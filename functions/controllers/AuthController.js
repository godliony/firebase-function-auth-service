const admin = require('firebase-admin');
const config = require('../config/firebase.json')
require('dotenv').config()
admin.initializeApp({
    credential: admin.credential.cert(config)
});
/* const admin = require('firebase-admin');
admin.initializeApp(); */

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const db = admin.firestore();
const User = db.collection('users');
module.exports = {

    // Login
    async handleLogin(req, res) {
        const { username, password } = req.body
        if (!username || !password) return res.status(400).json({ 'message': 'Username and password are required' })

        const users = await User.where("username", "==", username).get().then((querySnapshot) => {
            return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
        });
        if (users.length <= 0) return res.sendStatus(401) // Unauthorized

        const user = users[0];

        //evaluate password
        const match = await bcrypt.compare(password, user.password)
        if (match) {
          const roles = Object.values(user.roles);
            //creat JWTs
            const accessToken = jwt.sign(
                { "UserInfo": 
                  {
                    "username": user.username,
                    "roles": roles
                  }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1h' }
            )
            //refreshToken
            const refreshToken = jwt.sign(
                { "username": user.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            )
            //Saving refreshToken with current user
            await User.doc(user.id).update({ "refreshToken": refreshToken })
            res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 })
            res.json({ accessToken })
        } else {
            return res.sendStatus(401)
        }
    },

    async handleLogout(req,res){
      // On client, also delete the accessToken
      const cookies = req.cookies
      if(!cookies?.jwt) return res.sendStatus(204); //No content
      const refreshToken = cookies.jwt;
    
      //Is refreshToken in db?
      const users = await User.where("refreshToken", "==", refreshToken).get().then((querySnapshot) => {
        return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
      });
      if (users.length <= 0) {
        res.clearCookie('jwt', { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 })
        return res.sendStatus(204) //No content
      }
      const user = users[0];

      // Delete refreshToken in db
      await User.doc(user.id).update({ "refreshToken": '' })
      res.clearCookie('jwt', { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 }) // secure: true - only serves on https
      res.sendStatus(204)
    },

    //Refresh Token
    async handleRefreshToken(req, res){
      const cookies = req.cookies
      if(!cookies?.jwt) return res.sendStatus(401);
      const refreshToken = cookies.jwt;
    
      const users = await User.where("refreshToken", "==", refreshToken).get().then((querySnapshot) => {
        return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
      });
      if (users.length <= 0) return res.sendStatus(403) // Unauthorized
    
      // evaluate jwt
      const user = users[0];
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err,decoded) => {
          if(err || user.username !== decoded.username) return res.sendStatus(403);
          const roles = Object.values(user.roles);
          const accessToken = jwt.sign(
            { "UserInfo": 
              {
                "username": decoded.username,
                "roles": roles
              }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '5m' }
          )
          res.json({ accessToken })
        }
      )
    },

    //New user
    async handleRegister(req,res){
      try {
        const {username, password} = req.body
        if(!username || !password ) return res.status(400).json({'message': 'Username and password are required'})
        
        const duplicate = await User.where("username","==",username).get();
        if(!duplicate.empty) return res.sendStatus(409) // Conflict

        //encrypt the password
        const hashedPwd = await bcrypt.hash(password,10);
        //store the new user
        await User.add({
          "username": username,
          "roles": {"User": 2001},
          "password": hashedPwd
        });
        res.send({'success': `New user ${username} created!`})
    } catch (err) {
        res.status(500).send(err)
    }
    }
}
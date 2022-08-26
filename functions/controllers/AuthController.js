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
        const cookies = req.cookies;
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
            const newRefreshToken = jwt.sign(
                { "username": user.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' } 
            )
            const newRefreshTokenArray = 
              !cookies?.jwt
                ? user.refreshToken
                : user.refreshToken.filter(rt => rt !== cookies.jwt);
            
            if(cookies?.jwt) res.clearCookie('jwt', { httpOnly: true/*, secure: true*/, sameSite: 'None'})

            //Saving refreshToken with current user
            await User.doc(user.id).update({ "refreshToken": [...newRefreshTokenArray,newRefreshToken] })
            res.cookie('jwt', newRefreshToken, { httpOnly: true/*, secure: true*/, maxAge: 24 * 60 * 60 * 1000 })
            res.json({ roles,accessToken })
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
      const users = await User.where("refreshToken", 'array-contains', refreshToken).get().then((querySnapshot) => {
        return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
      });
      if (users.length <= 0) {
        res.clearCookie('jwt', { httpOnly: true/*, secure: true*/, sameSite: 'None'})
        return res.sendStatus(204) //No content
      }
      const user = users[0];

      // Delete refreshToken in db
      await User.doc(user.id).update({ "refreshToken": user.refreshToken.filter(rt => rt !== refreshToken) })
      res.clearCookie('jwt', { httpOnly: true/*, secure: true*/, sameSite: 'None'}) // secure: true - only serves on https
      res.sendStatus(204)
    },

    //Refresh Token
    async handleRefreshToken(req, res){
      const cookies = req.cookies
      if(!cookies?.jwt) return res.sendStatus(401);
      const refreshToken = cookies.jwt;
      res.clearCookie('jwt', { httpOnly: true/*, secure: true*/, sameSite: 'None' })
    
      const users = await User.where("refreshToken", 'array-contains', refreshToken).get().then((querySnapshot) => {
        return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
      });

      // Detected refresh token reuse!
      if (users.length <= 0){
        jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
          async (err,decoded) => {
            if(err) return res.sendStatus(403); //Forbidden
            console.log('attempted refresh token reuse!')
            const hackedUser = await User.where("username", "==", decoded.username).get().then((querySnapshot) => {
              return querySnapshot.docs.map(doc => Object.assign(doc.data(), { id: doc.id }))
            });
            if(hackedUser.length <= 0){
              await User.doc(hackedUser[0].id).update({ "refreshToken": [] })
            }
          }
        )
        return res.sendStatus(403) //Forbidden
      }

      const user = users[0];

      const newRefreshTokenArray =  user.refreshToken.filter(rt => rt !== refreshToken);
    
      // evaluate jwt
      
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err,decoded) => {
          if(err){
            console.log('expired refresh token')
            await User.doc(user.id).update({ "refreshToken": [...newRefreshTokenArray] })
          }
          if(err || user.username !== decoded.username) return res.sendStatus(403);

          //Refresh token was still valid

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
          const newRefreshToken = jwt.sign(
              { "username": user.username },
              process.env.REFRESH_TOKEN_SECRET,
              { expiresIn: '1d' }
          )
          //Saving refreshToken with current user
          await User.doc(user.id).update({ "refreshToken": [...newRefreshTokenArray, newRefreshToken] })
          res.cookie('jwt', newRefreshToken, { httpOnly: true/*, secure: true*/, maxAge: 24 * 60 * 60 * 1000 })
          res.json({ roles,accessToken })
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
          "password": hashedPwd,
          "refreshToken" : []
        });
        res.send({'success': `New user ${username} created!`})
    } catch (err) {
        res.status(500).send(err)
    }
    }
}
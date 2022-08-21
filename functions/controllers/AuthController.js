const admin = require('firebase-admin');
const config = require('../config.json')
const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')
admin.initializeApp({
    credential: admin.credential.cert(config)
});
const db = admin.firestore();
const User = db.collection('users');
module.exports = {

    // Login
    async login(req, res) {
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
            //creat JWTs
            const accessToken = jwt.sign(
                { "username": user.username },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '5m' }
            )
            //refreshToken
            const refreshToken = jwt.sign(
                { "username": user.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            )
            //Saving refreshToken with current user
            await User.doc(user.id).update({ "refreshToken": refreshToken })
            res.cookie('jwt', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
            res.json({ accessToken })
        } else {
            return res.sendStatus(401)
        }

    },
}
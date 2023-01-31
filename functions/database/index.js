const admin = require('firebase-admin');
const config = require('../config/firebase.json')
require('dotenv').config()
admin.initializeApp({
    credential: admin.credential.cert(config)
});
const db = admin.firestore();

module.exports = db
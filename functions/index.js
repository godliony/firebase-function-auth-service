const functions = require('firebase-functions');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const express = require('express');
const app = express();
const credentials = require('./middleware/credentials')
const corsOptions = require('./config/corsOptions')
let cors = require('cors');


// built-in middleware to handle urlencoded data
// in other words, form data:
// 'content-type: application/x-www-form-urlencoded'
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Handle options credentials check - before CORS!
app.use(credentials)
app.use(cors(corsOptions))
// middleware for cookies
app.use(cookieParser());

require('./routes')(app);

exports.auth = functions.region('asia-east2').https.onRequest(app);

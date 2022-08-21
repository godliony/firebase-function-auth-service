const functions = require('firebase-functions');

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
let cors = require('cors');


// built-in middleware to handle urlencoded data
// in other words, form data:
// 'content-type: application/x-www-form-urlencoded'
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors())
// built-in middleware for json

require('./routes')(app);

exports.auth = functions.region('asia-southeast1').https.onRequest(app);


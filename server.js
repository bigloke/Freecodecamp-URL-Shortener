'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');
var bodyParser = require('body-parser');

var urlHandler = require('./controllers/urlHandler.js');

var app = express();

// Basic Configuration for Heroku
var mongoURL = 'mongodb://bigloke:loke69@ds131137.mlab.com:31137/bigmongo';
var port = process.env.PORT || 3000;

mongoose.connect(mongoURL);

app.use(cors());
app.use(bodyParser.urlencoded({ 'extended': false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', urlHandler.addUrl);
app.get('/api/shorturl/:shorturl', urlHandler.processUrl);


// This calls are for test only
app.get('/api/cleanall', urlHandler.cleanAll);
app.get('/api/fillone', urlHandler.fillOne);
app.get('/api/currentposition', urlHandler.getLastPosition);

// Answer not found to all the wrong routes
app.use(function (req, res, next) {
  res.status(404);
  res.type('txt').send('Not found');
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const url = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Mongo config

//connect to db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//define schema
var urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true
  }
}, { timestamps: true });

var Urls = mongoose.model("Urls", urlSchema);


//enable body parsing
app.use(bodyParser.urlencoded({ extended: false }));

// Shortener endpoint
app.post('/api/shorturl', function(req, res) {
  
  
  //get original url
  var inputUrl = req.body.url;
  console.log(inputUrl)
  
  //check request body
  const isValid = validateUrl(inputUrl);
  if(!isValid) {
      //respond with error if invalid
      res.json({ error: 'invalid url' });
    
    }else{
      //create url
      const shortUrl = Math.random().toString(36).substr(2);

      //create response object
      const responseObject = {
          original_url: inputUrl,
          short_url: shortUrl,
      }
      
      //create mongo document
      const document = new Urls(responseObject);

      //send data to mongo
      document.save();
      
      //return data
      res.json(responseObject);
    }
});

// short link endpoint
app.get('/api/shorturl/:short_url', function(req, res) {

  //get token
  var input = req.params.short_url;

  //look for token in mongo
  Urls.findOne({ short_url: input})
  .then((doc) => {
    //redirect
    res.redirect(doc.original_url);
  })
  .catch((err) => {
    res.json({error: 'invalid url'})
  });
  


});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


function validateUrl(inputUrl) {
  const parsedUrl = url.parse(inputUrl);

  // Check if the protocol is http or https
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    console.log("first pass fail: " + inputUrl)
    return false;
  }

  // Check if the hostname is present and is a valid domain name
  if (!parsedUrl.hostname || !/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(parsedUrl.hostname)) {
    console.log("second pass fail: " + inputUrl)
    return false;
  }

  // Check if the pathname is valid
  if (parsedUrl.pathname === null || parsedUrl.pathname === undefined || parsedUrl.pathname === '') {
    console.log("third pass fail: " + inputUrl)
    return false;
  }

  return true;
}

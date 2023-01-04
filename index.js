var express = require('express');
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;
var mongoose = require('mongoose');
var shortId = require('shortid');
var bodyParser = require('body-parser');
var validUrl = require('valid-url');
require('dotenv').config();
var cors = require('cors');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
});

const connection = mongoose.connection;

connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})


app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Create Schema
let urlSchema = new mongoose.Schema({
  original: {type: String, required: true},
  short: Number
})
let Url = mongoose.model('Url', urlSchema);
let resObject = {};
app.post('/api/shorturl', (req, res) => {
  let inputUrl = req.body['url'];
  // let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]          {1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);
  
  // if(!inputUrl.match(urlRegex)){
  //   res.json({error: 'Invalid URL'})
  // 	return
  // }
  const httpRegex = /^(http|https)(:\/\/)/;
  if (!httpRegex.test(inputUrl)) {return res.json({ error: 'invalid url' })}
  resObject['original_url'] = inputUrl;
  let inputShort = 1;
  Url.findOne({})
    .sort({short: 'desc'})
    .exec((error, result) => {
      if (!error && result != undefined){
        inputShort = result.short + 1;
      }
      if (!error){
        Url.findOneAndUpdate(
          {original: inputUrl},
          {original: inputUrl, short: inputShort},
          {new: true, upsert: true},
          (error, saveUrl) => {
            if (!error) {
              resObject['short_url'] = saveUrl.short;
              res.json(resObject);
            }
          }
        )
      }
    })
  
});
app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input;

  Url.findOne({short: input},(error, result) => {
    if (!error && result != undefined){
      res.redirect(result.original);
    }else{
      res.json('URL Not Found');
    }
  })
})

app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
})


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose')

mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true})

// Basic Configuration
const port = process.env.PORT || 3000;

const URLSchema = new mongoose.Schema({
  original_url: {type: String, required: true, unique: true},
  short_url: {type: String, required: true, unique: true}
})

let URLModel = mongoose.model("url", URLSchema)

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  let url  =req.body.url
  try {
    urlObj = new URL(url)
    dnslookup(urlObj.hostname, (err, address, family) => {
      if (!address){
        res.json({error: 'invalid url'})
      }
      else {
        let original_url = urlObj.href
        URLModel.findOne({original_url: original_url}).then((foundURL) =>{
          if (foundURL) {
            res.json({original_url: foundURL.original_url, short_url: foundURL.short_url})
          }
          else {
            let short_url = 1
            URLModel.find({}).sort({short_url: "desc"}).limit(1).then((latestURL) => {
              if (latestURL.length > 0) {
                short_url = latestURL[0].short_url + 1
              }
              resObj = {
                original_url: original_url,
                short_url: short_url
              }
      
              let newURL = new URLModel(resObj)
              newURL.save()
              res.json(resObj)
            })
          }
        })
      }
    })
  }
  catch{
    res.json({error: 'invalid url'})
  }

});

app.get('/api/shorturl/:short_url', (req, res) => {
  let short_url = req.params.short_url
  URLModel.findOne({short_url: short_url}).then((foundURL) => {
    if(foundURL) {
      let original_url = foundURL.original_url
      res.redirect(original_url)
    }
    else {
      res.json({message: "The short url does not exist"})
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

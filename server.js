// I am using the bing image search api v7.0!
const express = require('express');
const app = express();
var config = require('./config');
var path = require('path');
var util = require('util');
var mongoose = require('mongoose');
var History = require('./models/schema');
var httpreq = require( 'request' );

mongoose.connect(config.db.host);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'))

app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html')
})

app.get("/history", (request, response) => {
  History.find().select({ _id: 0, term: 1, timestamp: 1 }).sort({ timestamp: -1 }).limit(20).then(res => {
      response.json(res);
  });
});

app.get("/search/:term", (req, res) => {
  var output = [];
  var offset = req.query.offset || 10;
  var timestamp = Date.now();
  var term = req.params.term;
  var qs = 'q=' + term + '&count=10&offset=' + offset + '&mkt=en-us&safeSearch=Moderate';
  var options = { 
     uri: 'https://api.cognitive.microsoft.com/bing/v7.0/images/search?' + qs,
     headers: {
       'Ocp-Apim-Subscription-Key': config.API_KEY1
     }
  };
  httpreq(options, function( error, response, body ) {
   var json = JSON.parse(body);
   function callback( image, index, array ) {
     output.push({
       alt: image.name,
       url: image.contentUrl,
       thumbnail: image.thumbnailUrl,
       context: image.hostPageDisplayUrl
     });
   };
   json.value.forEach(callback);
   res.end(JSON.stringify(output));
 });
  var history = new History({ term, timestamp });
  history.save();
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})

function createRes(img) {
  return {
    url: img.url,
    title: img.title,
    thumbnail: img.thumbnail.url,
    source: img.sourceUrl
  }
}

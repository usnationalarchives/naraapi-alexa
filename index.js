"use strict";

const Alexa = require("alexa-sdk");
const https = require('https');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
  'LaunchRequest': function() {
    this.attributes['recipe'] = '';
    this.attributes['nara_data'] = '';
    this.attributes['current_recipe'] = '';
    
    const speakValue = `Hello, welcome to the National Archives. Would you like to taste a slice of history?`;
    const listenValue = `Would you like to try a breakfast or dinner recipe?`;
    
    this.response
        .speak(speakValue)
        .listen(listenValue);
    this.response.cardRenderer('Recipes from the National Archives', speakValue);
    this.emit(':responseReady');
  },
  'GetRecipe': function () {
    this.attributes['recipe'] = this.event.request.intent.slots.recipe.value;
    const recipe = this.event.request.intent.slots.recipe.value;
    const apiSearchData = {recipeType: recipe};

    httpsGet(apiSearchData, (resResult) => {
        const currentIndex = getRandomResult(resResult.total);
        
        const currentItem = resResult.result.splice(currentIndex, 1);
        this.attributes['nara_data'] = resResult.result;
        this.attributes['current_recipe'] = currentItem[0];
        
        const speakValue = 
          `I have found ${currentItem[0].description.item.title}.
          If you would like to hear this recipe, please say read recipe.
          Or if you would like to hear another recipe, say next.`;
        
        const listenValue = 
          `Please say read recipe to hear ${currentItem[0].description.item.title},
           or say next for another recipe.`;
        this.response
            .speak(speakValue)
            .listen(listenValue);
        this.response.cardRenderer('Recipes from the National Archives', speakValue);
        this.emit(':responseReady');
    });
  },
  'GetDifferent': function() {
    var remainingResults = this.attributes['nara_data'];
    if (remainingResults.length <= 0) {
      this.response
        .speak('There are no more results. Please try asking again.');
      this.emit(':responseReady');
    } else {
      var currentIndex = getRandomResult(remainingResults.length);
      const currentItem = remainingResults.splice(currentIndex, 1);
      this.attributes['current_recipe'] = currentItem[0];
      
      this.response
          .speak('Would you like to try ' + currentItem[0].description.item.title)
          .listen('Please say next or read.');
      this.emit(':responseReady');
    }
    
  },
  'ReadRecipe': function () {
    let transcription = '';
    if(Array.isArray(this.attributes['current_recipe'].objects.object)) {
      
      const taggedObjects = this.attributes['current_recipe'].objects.object.filter(hasTags);
      const transcribedObjects = taggedObjects.filter(hasTranscription);
      if(transcribedObjects) {
        const filteredObjects = hasRecipe(transcribedObjects);
        const randomRecipeIndex = getRandomResult(filteredObjects.length);
        transcription = filteredObjects[randomRecipeIndex].publicContributions.transcription.text;
      }
    } else {
        if(this.attributes['current_recipe'].objects.object.publicContributions.transcription) {
          transcription = this.attributes['current_recipe'].objects.object.publicContributions.transcription.text;
        }
    }
    this.response
        .speak(transcription);
    this.response.cardRenderer('Recipes from the National Archives', transcription);
    this.emit(':responseReady');
  }
}

// Make a call to the National Archives API and get numResults items back.
function httpsGet(myData, callback) {
    
    var numResults = 1;
    var apiPath = '/api/v1?resultTypes=item&rows=' + numResults + 
    '&exists=objects.object.publicContributions.transcription'
    + '&resultFields=description.item.title,objects.object.publicContributions.transcription,objects.object.publicContributions.tags,description.item.naId';
    apiPath += '&objects.object.publicContributions.tags.tag=recipe%20AND%20' + myData.recipeType;
    
    var options = {
        host: 'catalog.archives.gov',
        path: apiPath,
        method: 'GET',
        headers: {'User-Agent': 'request'},
        json: true,
    };
    
    
    
    var req = https.request(options, res => {
        res.setEncoding('utf8');
        var returnData = "";
        res.on('data', chunk => {
            returnData = returnData + chunk;
        });
        
        res.on('end', () => {
          var naraObject = JSON.parse(returnData);
          var naraRecipe = naraObject.opaResponse.results;
           callback(naraRecipe);
        });
    });
    req.end();
}

function getRandomResult(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function hasTranscription(naraObject) {
  return naraObject.publicContributions.transcription;
}

function hasTags(naraObject) {
  return naraObject.publicContributions.tags;
}

// Since items are returned, some objects aren't actually recipes and need to be filtered
function hasRecipe(naraObjects) {
  let recipeList = [];
  for (let i = 0; i < naraObjects.length; i++) {
    if(naraObjects[i].publicContributions.tags) {
      let tags = naraObjects[i].publicContributions.tags;
      if(Array.isArray(tags.tag)) {
        for (let j = 0; j < naraObjects[i].publicContributions.tags['@total']; j++) {
          if (tags.tag[j]['$'].includes('recipe')) {
            recipeList.push(naraObjects[i]);
          }
        }
      } else {
        if (tags.tag['$'].includes('recipe')) {
          recipeList.push(naraObjects[i]);
        }
      }
    }
  }
  return recipeList; 
}

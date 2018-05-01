"use strict";

const Alexa = require("alexa-sdk");
const https = require('https');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var breakfastRecipes = [6727957];
var dinnerRecipes = [6731390, 6802684];
var dessertRecipes = [6731445];
var waffles = [193739];


var handlers = {
    'LaunchRequest': function() {
    this.attributes['recipe'] = '';
    this.attributes['nara_data'] = '';
    this.attributes['current_recipe'] = '';
    this.attributes['currentIndex'] = 0;
    this.attributes['outOfRecipes'] = false;
    
    const speakValue = `Hello, welcome to the National Archives. Would you like to taste a slice of history?`;
    const listenValue = `Would you like to try a breakfast or dinner recipe?`;
    
    this.response
        .speak(speakValue)
        .listen(listenValue);
    this.response.cardRenderer('Recipes from the National Archives', speakValue);
    this.emit(':responseReady');
  },
  'GetRecipe': function() {
      this.attributes['currentIndex'] = this.attributes['currentIndex'] ? this.attributes['currentIndex'] : 0;
      this.attributes['recipe'] =  this.attributes['recipe'] ? this.attributes['recipe'] : this.event.request.intent.slots.recipeType.value;
      const recipe = this.attributes['recipe'];
      var naIdList = '';
      if (this.attributes['outOfRecipes']) {
          naIdList = waffles;
      } else {
          if (recipe === 'dinner') {
            naIdList = dinnerRecipes;
            }
      }

      if (this.attributes['currentIndex'] >= naIdList.length) {
          
          this.emit('OutOfRecipes');
      }
      
      
      
      httpsGet({recipeId: naIdList[this.attributes['currentIndex']]}, (resResult) => {
        const currentItem = resResult.result[0];
        this.attributes['nara_data'] = resResult.result;
        this.attributes['current_recipe'] = currentItem;
        
        if(this.attributes['outOfRecipes']) {
            this.emit('ReadRecipe');
        } else {
            const speakValue = 
          `I have found ${currentItem.description.item.title}.
          If you would like to hear this recipe, please say read recipe.
          Or if you would like to hear another recipe, say next.`;
        
        const listenValue = 
          `Please say read recipe to hear ${currentItem.description.item.title},
          or say next for another recipe.`;
          this.attributes['currentIndex']++;
        this.response
            .speak(speakValue)
            .listen(listenValue);
        this.response.cardRenderer('Recipes from the National Archives', speakValue);
        this.emit(':responseReady');
        }
        
        
      });
    
  },
  'ReadRecipe': function() {
      var currentItem = this.attributes['current_recipe'];
      var transcription = '';
      if(Array.isArray(this.attributes['current_recipe'].objects.object)) {
          transcription = currentItem.objects.object[0].publicContributions.transcription.text;
      } else {
          transcription = currentItem.objects.object.publicContributions.transcription.text;
      }
      
      
      console.log(transcription);
      this.response
        .speak(transcription);
      this.response.cardRenderer('Recipes from the National Archives', transcription);
      this.emit(':responseReady');
  },
  'NextRecipe': function() {
      this.emit('GetRecipe');
  },
  'OutOfRecipes': function() {
      this.attributes['currentIndex'] = 0;
      this.attributes['outOfRecipes'] = true;
      const speakValue = 
            `You seem like a picky eater, maybe you’d like breakfast for dinner. 
            John F. Kennedy’s waffles are always a hit at my house. 
            Would you like me to John F. Kennedy’s waffles?`;
        const listenValue = 
          `Would you like me to John F. Kennedy’s waffles?`;
            this.response
                .speak(speakValue)
                .listen(listenValue);
          this.response.cardRenderer('Recipes from the National Archives', speakValue);
          this.emit(':responseReady');
  },
  'ListRecipes': function() {},
  'NoRecipes': function() {},
  "AMAZON.YesIntent": function () { 
    if (this.attributes['current_recipe'] === '') {
        this.emit('OutOfRecipes');
    } else if (this.attributes['outOfRecipes']) {
        this.emit('GetRecipe');
    }
  },
  "AMAZON.NoIntent": function () {
    // handle the case when user says No
    this.emit(':responseReady');
  }
}

function httpsGet(myData, callback) {
    
    
    
    var apiPath = '/api/v1?resultTypes=item'
        + '&resultFields=description.item.title,objects.object.publicContributions.transcription,objects.object.publicContributions.tags,description.item.naId'
        + '&naIds=' + myData.recipeId;
    
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

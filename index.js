"use strict";

const Alexa = require("alexa-sdk");
const https = require('https');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// Lists of predetermined recipe naIds
const breakfastRecipes = [6727957];
const dinnerRecipes = [6731390, 6802684];
const dessertRecipes = [6731445];
const waffles = [193739];
const cocktailRecipes = [17411415];
const favoriteRecipes = [6727894];
const vegetarianRecipes = [6784181];

const handlers = {
    // Responds to Alexa Open skill
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
  'ReturnRecipeFromAPI': function() {

    // this.attributes['recipe'] = this.attributes['recipe'] ? this.attributes['recipe'] : '';
    // this.attributes['currentIndex'] = this.attributes['currentIndex'] ? this.attributes['currentIndex'] : 0;
    // this.attributes['outOfRecipes'] = this.attributes['outOfRecipes'] ? this.attributes['outOfRecipes'] : false;
    
    const naIdList = this.attributes['naIdList'];
    const currentIndex = this.attributes['currentIndex'];
    const recipeTypeSlot = this.attributes['recipe'];
    console.log(currentIndex)
    // if (this.attributes['outOfRecipes']) {
    //   naIdList = waffles;
    // }
    
    httpsGet({recipeId: naIdList[currentIndex]}, (resResult) => {
      const currentItem = resResult.result[0];
      // this.attributes['nara_data'] = resResult.result;
      this.attributes['current_recipe'] = currentItem;

      const resultTitle = currentItem.description.item.title;
      let speakValue;
      let listenValue;
      
      switch (recipeTypeSlot) {
        case 'cocktail':
          speakValue =
            `I like to unwind with a ${resultTitle}. While I can't make it for you,
            I can read you the recipe. Would you like me to read the recipe or send
            it to your phone?`;
          listenValue = 
            `If you would like to hear this recipe,
            please say read recipe.`;
          break;
        case 'favorite':
          speakValue =
            `I'm quite partial to ${resultTitle}. If you would like to hear this
            recipe, please say read recipe. Or if you would like to hear another
            recipe, say next recipe.`;
          listenValue =
            `Please say read recipe to hear ${resultTitle},
            or say next for another recipe.`;
          break;
        case 'waffles':
          speakValue =
            `You seem like a picky eater, maybe you’d like breakfast for dinner. 
            John F. Kennedy’s waffles are always a hit at my house. 
            Would you like me to John F. Kennedy’s waffles?`;
          listenValue = 
            `Would you like me to John F. Kennedy’s waffles?`;
          break;
        default:
          speakValue =
            `I have found ${resultTitle}.
            If you would like to hear this recipe, please say read recipe.
            Or if you would like to hear another recipe, say next.`;
          listenValue =
            `Please say read recipe to hear ${resultTitle},
            or say next for another recipe.`;
          break;
      } 
      
      this.response
          .speak(speakValue)
          .listen(listenValue);
      this.response.cardRenderer('Recipes from the National Archives', speakValue);
      this.emit(':responseReady');
      
      
      
      // if(this.attributes['outOfRecipes']) {
      //     this.emit('ReadRecipe');
      // } else {
        
      // }
    });
    
    
    
  },
  // Makes an API GET request and returns a title to Alexa
  'GetRecipe': function() {
    const recipeTypeSlot = this.event.request.intent.slots.recipeType.value;
    const recipeAdjSlot = this.event.request.intent.slots.recipeAdj.value;
    
    this.attributes['recipe'] = this.event.request.intent.slots.recipeType.value;
    this.attributes['recipeAdj'] = this.event.request.intent.slots.recipeAdj.value;
    this.attributes['currentIndex'] = 0;
    
    if (recipeAdjSlot) {
      switch (recipeAdjSlot) {
        case 'vegetarian':
          this.attributes['naIdList'] = vegetarianRecipes;
          break;
      } 
    } else {
      switch (recipeTypeSlot) {
        case 'dinner':
          this.attributes['naIdList'] = dinnerRecipes;
          break;
        case 'cocktail':
          this.attributes['naIdList'] = cocktailRecipes;
          break;
        case 'breakfast':
          this.attributes['naIdList'] = breakfastRecipes;
          break;
      } 
    }
    
    this.emit('ReturnRecipeFromAPI');
      
  },
  // Reads the transcription of the returned recipe
  'ReadRecipe': function() {
      const currentItem = this.attributes['current_recipe'];
      let transcription = '';
      if(Array.isArray(currentItem.objects.object)) {
          transcription = currentItem.objects.object[0].publicContributions.transcription.text;
      } else {
          transcription = currentItem.objects.object.publicContributions.transcription.text;
      }
      
      this.response
        .speak(`Great, ${transcription} Would you like me to send it to your phone.`)
        .listen('Would you like me to send it to your phone?');
      this.response.cardRenderer('Recipes from the National Archives', transcription);
      this.emit(':responseReady');
  },
  // Fires GetRecipe without updating the type of recipe
  'NextRecipe': function() {
    this.attributes['currentIndex']++;
    const naIdList = this.attributes['naIdList'];
    const currentIndex = this.attributes['currentIndex'];
    
    if (this.attributes['outOfRecipes']) {
      let speakValue = "I'm out of recipes. If you would like to find more visit the National Archives and become a citizen archivist to tag more recipes.";
      this.response
        .speak(speakValue);
      this.response.cardRenderer('Recipes from the National Archives', speakValue);
      this.emit(':responseReady');
    }
    
    if (currentIndex >= naIdList.length) {
      this.emit('OutOfRecipes');
    } else {
      this.emit('ReturnRecipeFromAPI');
    }
    
    
  },
  'FavoriteRecipe': function() {
    this.attributes['currentIndex'] = 0;
    this.attributes['naIdList'] = favoriteRecipes;
    this.attributes['recipe'] = 'favorite';
    
    this.emit('ReturnRecipeFromAPI');
  },
  // Fires when there are no more naIds in the array
  'OutOfRecipes': function() {
    this.attributes['currentIndex'] = 0;
    this.attributes['outOfRecipes'] = true;
    this.attributes['naIdList'] = waffles;
    this.attributes['recipe'] = 'waffles';

    this.emit('ReturnRecipeFromAPI');
  },
  'ListRecipes': function() {},
  'NoRecipes': function() {},
  'SendToPhone': function() {
    if (this.attributes['recipe'] === 'cocktail') {
      this.response.speak('Okay. Enjoy one for me.');
    } else {
      this.response.speak('Okay.');
    }
    this.emit(':responseReady');
  },
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
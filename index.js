"use strict";

const Alexa = require("alexa-sdk");
const https = require('https');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// Lists of predetermined recipe naIds
const breakfastRecipes = [6727957, 5721363];
const dinnerRecipes = [6731390, 6802684, 186609];
const dessertRecipes = [6731445, 6784043, 6779856];
const waffles = [193739];
const cocktailRecipes = [17411415];
const favoriteRecipes = [6727894];
const vegetarianRecipes = [6784181, 6731265, 6784007];
const appetizerRecipes = [6783885]

const handlers = {
    // Responds to Alexa Open skill
    'LaunchRequest': function() {
    this.attributes['recipe'] = '';
    this.attributes['current_recipe'] = '';
    this.attributes['currentIndex'] = 0;
    this.attributes['outOfRecipes'] = false;
    
    const speakValue = `Hello, welcome to the National Archives. Would you like to taste a slice of history?`;
    const listenValue = `Would you like to try a breakfast or dinner recipe?`;
    
    if(supportsDisplay.call(this)||isSimulator.call(this)) {
      console.log("has display:"+ supportsDisplay.call(this));
      console.log("is simulator:"+isSimulator.call(this));
      var content = {
         "hasDisplaySpeechOutput" : speakValue,
         "hasDisplayRepromptText" : listenValue,
         "simpleCardTitle" : 'Recipes from the National Archives',
         "simpleCardContent" : speakValue,
         "bodyTemplateTitle" : '',
         "bodyTemplateContent" : 'Welcome to the National Archives.',
         "thumbnail" : 'https://catalog.archives.gov/images/NARA_Logo.png',
         "templateToken" : "launchTemplate",
         "sessionAttributes": {
           "current_recipe": '',
           "result_title" : '',
           "recipe" : '',
           "currentIndex" : 0,
           "outOfRecipes" : false,
         }
      };
      renderTemplate.call(this, content);
    } else {
    // Just use a card if the device doesn't support a card.
      this.attributes['recipe'] = '';
      this.attributes['current_recipe'] = '';
      this.attributes['currentIndex'] = 0;
      this.attributes['outOfRecipes'] = false;
      this.response.cardRenderer('Recipes from the National Archives', speakValue);
      this.response
        .speak(speakValue)
        .listen(listenValue);;
      this.emit(':responseReady');
    }
  },
  'ReturnRecipeFromAPI': function() {
    
    const naIdList = this.attributes['naIdList'];
    const currentIndex = this.attributes['currentIndex'];
    const recipeTypeSlot = this.attributes['recipe'];
    const outOfRecipes = this.attributes['outOfRecipes'] ? this.attributes['outOfRecipes'] : false;
    httpsGet({recipeId: naIdList[currentIndex]}, (resResult) => {
      const currentItem = resResult.result[0];
      // this.attributes['nara_data'] = resResult.result;
      this.attributes['current_recipe'] = currentItem;

      const resultTitle = currentItem.description.item.title;
      let speakValue;
      let displayValue;
      let listenValue;
      let image;
      
      switch (recipeTypeSlot) {
        case 'cocktail':
          speakValue =
            `I like to unwind with an ${resultTitle}. While I can't make it for you,
            I can read you the recipe. Would you like me to read the recipe or send
            it to your phone?`;
          displayValue =
            `I like to unwind with an <b>${resultTitle}</b>.<br /> While I can't make it for you,
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
          displayValue =
            `I'm quite partial to <b>${resultTitle}</b>.<br /> If you would like to hear this
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
            Would you like me to read John F. Kennedy’s waffles?`;
          displayValue =
            `You seem like a picky eater, maybe you’d like breakfast for dinner. 
            <b>John F. Kennedy’s waffles</b> are always a hit at my house. 
            Would you like me to read John F. Kennedy’s waffles?`;
          listenValue = 
            `Would you like me to John F. Kennedy’s waffles?`;
          break;
        case 'appetizer':
          speakValue =
            `Don't eat too much of this ${resultTitle}. or you'll spoil your dinner. <br />
            If you would like to hear this recipe, please say read recipe. 
            Or if you would like to hear another recipe, say next recipe.`;
          displayValue =
            `Don't eat too much of this <b>${resultTitle}</b>. or you'll spoil your dinner. <br />
            If you would like to hear this recipe, please say read recipe. 
            Or if you would like to hear another recipe, say next recipe.`;
          listenValue = 
            `Please say read recipe to hear ${resultTitle},
            or say next for another recipe.`;
          break;
        default:
          speakValue =
            `I have found ${resultTitle}.
            If you would like to hear this recipe, please say read recipe.
            Or if you would like to hear another recipe, say next recipe.`;
          displayValue =
            `I have found <b>${resultTitle}</b>.<br />
            If you would like to hear this recipe, please say read recipe.
            Or if you would like to hear another recipe, say next recipe.`;
          listenValue =
            `Please say read recipe to hear ${resultTitle},
            or say next recipe for another recipe.`;
          break;
      };
      
      if(Array.isArray(currentItem.objects.object)) {
          image = resResult.result[0].objects.object[0].file['@url']
      } else {
          image = resResult.result[0].objects.object.file['@url']
      }
      
      if(supportsDisplay.call(this)||isSimulator.call(this)) {
          console.log("has display:"+ supportsDisplay.call(this));
          console.log("is simulator:"+isSimulator.call(this));
          var content = {
             "hasDisplaySpeechOutput" : speakValue,
             "hasDisplayRepromptText" : resultTitle,
             "simpleCardTitle" : 'Recipes from the National Archives',
             "simpleCardContent" : displayValue,
             "bodyTemplateTitle" : 'Recipes from the National Archives',
             "bodyTemplateContent" : speakValue,
             "thumbnail" : image,
             "templateToken" : "returnRecipeTemplate",
             "sessionAttributes": {
               "current_recipe": currentItem,
               "result_title" : resultTitle,
               "naIdList" : naIdList,
               "currentIndex" : currentIndex,
               "recipe" : recipeTypeSlot,
               "outOfRecipes": outOfRecipes,
             }
          };
          renderTemplate.call(this, content);
        } else {
        // Just use a card if the device doesn't support a card.
          this.response.cardRenderer('Recipes from the National Archives', speakValue);
          this.response
            .speak(speakValue)
            .listen(listenValue);
          this.emit(':responseReady');
        }
      
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
        case 'sweet':
          this.attributes['naIdList'] = dessertRecipes;
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
        case 'dessert':
          this.attributes['naIdList'] = dessertRecipes;
          break;
        case 'appetizer':
          this.attributes['naIdList'] = appetizerRecipes;
          break;
      } 
    }
    
    this.emit('ReturnRecipeFromAPI');
      
  },
  // Reads the transcription of the returned recipe
  'ReadRecipe': function() {
      const currentItem = this.attributes['current_recipe'];
      const resultTitle = this.attributes['result_title'];
      let transcription = '';
      let image = '';
      console.log(this.attributes['current_recipe'])
      if(Array.isArray(currentItem.objects.object)) {
          transcription = currentItem.objects.object[0].publicContributions.transcription.text;
          image = currentItem.objects.object[0].file['@url']
      } else {
          transcription = currentItem.objects.object.publicContributions.transcription.text;
          image = currentItem.objects.object.file['@url']
      }
      
      if(supportsDisplay.call(this)||isSimulator.call(this)) {
          console.log("has display:"+ supportsDisplay.call(this));
          console.log("is simulator:"+isSimulator.call(this));
          var content = {
             "hasDisplaySpeechOutput" : `Great, ${transcription} If you would like me to send it to your phone, please send to phone.`,
            //"hasDisplayRepromptText" : resultTitle,
             "simpleCardTitle" : 'Recipes from the National Archives',
             "simpleCardContent" : 'Great,\n' + transcription + 'If you would like me to send it to your phone, please send to phone.',
             "bodyTemplateTitle" : 'Recipes from the National Archives',
             "bodyTemplateContent" : `Great, ${transcription} If you would like me to send it to your phone, please send to phone.`,
             "thumbnail" : image,
             "recipeTitle" : `<font size="4"><b>${resultTitle}</b></font>`,
             "templateToken" : "readRecipeTemplate",
             "sessionAttributes": {
               "current_recipe": currentItem,
               "result_title" : resultTitle,
             }
          };
          renderTemplate.call(this, content);
        } else {
        // Just use a card if the device doesn't support a card.
          this.response.cardRenderer('Recipes from the National Archives', transcription);
          this.response
            .speak(transcription)
            .listen('If you would like this recipe, please say send to phone.');
          this.emit(':responseReady');
        }
  },
  // Fires GetRecipe without updating the type of recipe
  'NextRecipe': function() {
    this.attributes['currentIndex']++;
    const naIdList = this.attributes['naIdList'];
    const currentIndex = this.attributes['currentIndex'];
    
    if (this.attributes['outOfRecipes']) {
      const speakValue = 'I\'m out of recipes. If you would like to find more visit the National Archives and become a citizen archivist to tag more recipes.';
      const displayValue = '<font size="3">I\'m out of recipes. If you would like to find more visit the National Archives and become a citizen archivist to tag more recipes.</font>';
      if(supportsDisplay.call(this)||isSimulator.call(this)) {
          console.log("has display:"+ supportsDisplay.call(this));
          console.log("is simulator:"+isSimulator.call(this));
          var content = {
             "hasDisplaySpeechOutput" : speakValue,
             //"hasDisplayRepromptText" : listenValue,
             "simpleCardTitle" : 'Recipes from the National Archives',
             "simpleCardContent" : displayValue,
             "bodyTemplateTitle" : 'Recipes from the National Archives',
             "bodyTemplateContent" : displayValue,
             "templateToken" : "noMoreRecipeTemplate",
             "sessionAttributes": {}
          };
          renderTemplate.call(this, content);
        } else {
        // Just use a card if the device doesn't support a card.
          this.response.cardRenderer('Recipes from the National Archives', speakValue);
          this.response
            .speak(speakValue)
            .listen('If you would like to hear another recipe, please say next recipe.');
          this.emit(':responseReady');
        }
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
  'ListRecipes': function() {
    
    const speakValue = 'I have many types of recipes. Are you looking for a breakfast, dinner, or dessert?';
    let displayValue = 'I have many types of recipes. Are you looking for a <b>breakfast</b>, <b>dinner</b>, or <b>dessert</b>?';
    let listenValue = 'If you are not sure, I can let you know about my favorite recipe.';
    
    if(supportsDisplay.call(this)||isSimulator.call(this)) {
        console.log("has display:"+ supportsDisplay.call(this));
        console.log("is simulator:"+isSimulator.call(this));
        var content = {
           "hasDisplaySpeechOutput" : speakValue,
           "hasDisplayRepromptText" : listenValue,
           "simpleCardTitle" : 'Recipes from the National Archives',
           "simpleCardContent" : displayValue,
           "bodyTemplateTitle" : 'Recipes from the National Archives',
           "bodyTemplateContent" : displayValue,
           "templateToken" : "listRecipeTemplate",
           "sessionAttributes": {}
        };
        renderTemplate.call(this, content);
      } else {
      // Just use a card if the device doesn't support a card.
        this.response.cardRenderer('Recipes from the National Archives', displayValue);
        this.response
          .speak(speakValue)
          .listen(listenValue);
        this.emit(':responseReady');
      }
  },
  'NoRecipes': function() {},
  'SendToPhone': function() {
    let responseText; 
    if (this.attributes['recipe'] === 'cocktail') {
      responseText = 'Okay. Enjoy one for me.';
    } else {
      responseText = 'Okay.';
    }
    if(supportsDisplay.call(this)||isSimulator.call(this)) {
        console.log("has display:"+ supportsDisplay.call(this));
        console.log("is simulator:"+isSimulator.call(this));
        var content = {
           "hasDisplaySpeechOutput" : responseText,
           "hasDisplayRepromptText" : responseText,
           "simpleCardTitle" : 'Recipes from the National Archives',
           "simpleCardContent" : responseText,
           "bodyTemplateTitle" : 'Recipes from the National Archives',
           "bodyTemplateContent" : responseText,
           "templateToken" : "sendToPhoneTemplate",
           "sessionAttributes": {}
        };
        renderTemplate.call(this, content);
      } else {
      // Just use a card if the device doesn't support a card.
        this.response.cardRenderer('Recipes from the National Archives', responseText);
        this.response
          .speak(responseText);
        this.emit(':responseReady');
      }
    
    
    this.emit(':responseReady');
  },
  "AMAZON.YesIntent": function () { 
    if (this.attributes['current_recipe'] === '') {
        this.emit('ListRecipes');
    } else if (this.attributes['outOfRecipes']) {
        this.emit('ReadRecipe');
    }
  },
  "AMAZON.NoIntent": function () {
    // handle the case when user says No
    this.emit(':responseReady');
  }
}

//==============================================================================
//=========================== Helper Functions  ================================
//==============================================================================

function supportsDisplay() {
  var hasDisplay =
    this.event.context &&
    this.event.context.System &&
    this.event.context.System.device &&
    this.event.context.System.device.supportedInterfaces &&
    this.event.context.System.device.supportedInterfaces.Display

  return hasDisplay;
}

function isSimulator() {
  var isSimulator = !this.event.context; //simulator doesn't send context
  return isSimulator;
}

function renderTemplate (content) {
   switch(content.templateToken) {
     case "launchTemplate":
       var response = {
         "version": "1.0",
         "response": {
           "directives": [
             {
                "type": "Hint",
                "hint": {
                  "type": "PlainText",
                  "text": "What is your favorite recipe?"
                }
              },
             {
               "type": "Display.RenderTemplate",
               "template": {
                 "type": "BodyTemplate6",
                 "title": content.bodyTemplateTitle,
                 "token": content.templateToken,
                 "textContent": {
                   "primaryText": {
                     "text": content.bodyTemplateContent,
                     "type": "RichText"
                   }
                 },
                 "backButton": "HIDDEN"
               }
             }
           ],
           "outputSpeech": {
             "type": "SSML",
             "ssml": "<speak>"+content.hasDisplaySpeechOutput+"</speak>"
           },
           "reprompt": {
             "outputSpeech": {
               "type": "SSML",
               "ssml": "<speak>"+content.hasDisplayRepromptText+"</speak>"
             }
           },
           "shouldEndSession": false,
           "card": {
             "type": "Standard",
             "title": content.simpleCardTitle,
             "content": content.simpleCardContent,
             "image": {
              "smallImageUrl": content.thumbnail,
              "largeImageUrl": content.thumbnail
              }
           }
         },
         "sessionAttributes": content.sessionAttributes
       }
       this.context.succeed(response);
       break;
      case "listRecipeTemplate":
       var response = {
         "version": "1.0",
         "response": {
           "directives": [
             {
               "type": "Display.RenderTemplate",
               "template": {
                 "type": "BodyTemplate6",
                 "title": content.bodyTemplateTitle,
                 "token": content.templateToken,
                 "textContent": {
                   "primaryText": {
                     "text": content.bodyTemplateContent,
                     "type": "RichText"
                   }
                 },
                 "backButton": "HIDDEN"
               }
             }
           ],
           "outputSpeech": {
             "type": "SSML",
             "ssml": "<speak>"+content.hasDisplaySpeechOutput+"</speak>"
           },
           "reprompt": {
             "outputSpeech": {
               "type": "SSML",
               "ssml": "<speak>"+content.hasDisplayRepromptText+"</speak>"
             }
           },
           "shouldEndSession": false,
           "card": {
             "type": "Standard",
             "title": content.simpleCardTitle,
             "content": content.simpleCardContent,
             "image": {
              "smallImageUrl": content.thumbnail,
              "largeImageUrl": content.thumbnail
              }
           }
         },
         "sessionAttributes": content.sessionAttributes
       }
       this.context.succeed(response);
       break;
       case "sendToPhoneTemplate":
       var response = {
         "version": "1.0",
         "response": {
           "directives": [
             {
               "type": "Display.RenderTemplate",
               "template": {
                 "type": "BodyTemplate6",
                 "title": content.bodyTemplateTitle,
                 "token": content.templateToken,
                 "textContent": {
                   "primaryText": {
                     "text": content.bodyTemplateContent,
                     "type": "RichText"
                   }
                 },
                 "backButton": "HIDDEN"
               }
             }
           ],
           "outputSpeech": {
             "type": "SSML",
             "ssml": "<speak>"+content.hasDisplaySpeechOutput+"</speak>"
           },
           "reprompt": {
             "outputSpeech": {
               "type": "SSML",
               "ssml": "<speak>"+content.hasDisplayRepromptText+"</speak>"
             }
           },
           "shouldEndSession": false,
           "card": {
             "type": "Standard",
             "title": content.simpleCardTitle,
             "content": content.simpleCardContent,
             "image": {
              "smallImageUrl": content.thumbnail,
              "largeImageUrl": content.thumbnail
              }
           }
         },
         "sessionAttributes": content.sessionAttributes
       }
       this.context.succeed(response);
       break;
       case "noMoreRecipeTemplate":
       var response = {
         "version": "1.0",
         "response": {
           "directives": [
             {
               "type": "Display.RenderTemplate",
               "template": {
                 "type": "BodyTemplate6",
                 "title": content.bodyTemplateTitle,
                 "token": content.templateToken,
                 "textContent": {
                   "primaryText": {
                     "text": content.bodyTemplateContent,
                     "type": "RichText"
                   }
                 },
                 "backButton": "HIDDEN"
               }
             }
           ],
           "outputSpeech": {
             "type": "SSML",
             "ssml": "<speak>"+content.hasDisplaySpeechOutput+"</speak>"
           },
           "reprompt": {
             "outputSpeech": {
               "type": "SSML",
               "ssml": "<speak>"+content.hasDisplayRepromptText+"</speak>"
             }
           },
           "shouldEndSession": false,
           "card": {
             "type": "Standard",
             "title": content.simpleCardTitle,
             "content": content.simpleCardContent,
             "image": {
              "smallImageUrl": content.thumbnail,
              "largeImageUrl": content.thumbnail
              }
           }
         },
         "sessionAttributes": content.sessionAttributes
       }
       this.context.succeed(response);
       break;
       case "returnRecipeTemplate":
           var response = {
             "version": "1.0",
             "response": {
               "directives": [
                 {
                   "type": "Display.RenderTemplate",
                   "template": {
                     "type": "BodyTemplate3",
                     "title": content.bodyTemplateTitle,
                     "token": content.templateToken,
                     "textContent": {
                       "primaryText": {
                         "text": content.bodyTemplateContent,
                         "type": "RichText"
                       }
                     },
                     "image": {
                        "sources": [
                          {
                            "url": content.thumbnail
                          }
                        ]
                      },
                     "backButton": "HIDDEN"
                   }
                 }
               ],
               "outputSpeech": {
                 "type": "SSML",
                 "ssml": "<speak>"+content.hasDisplaySpeechOutput+"</speak>"
               },
               "reprompt": {
                 "outputSpeech": {
                   "type": "SSML",
                   "ssml": "<speak>"+content.hasDisplayRepromptText+"</speak>"
                 }
               },
               "shouldEndSession": false,
               "card": {
                 "type": "Standard",
                 "title": content.simpleCardTitle,
                 "content": content.simpleCardContent,
                 "image": {
                  "smallImageUrl": content.thumbnail,
                  "largeImageUrl": content.thumbnail
                  }
               }
             },
             "sessionAttributes": content.sessionAttributes
           }
           this.context.succeed(response);
           break;
        case "readRecipeTemplate":
           var response = {
             "version": "1.0",
             "response": {
               
               "outputSpeech": {
                 "type": "SSML",
                 "ssml": "<speak>"+content.hasDisplaySpeechOutput+"</speak>"
               },
              // "reprompt": {
              //   "outputSpeech": {
              //     "type": "SSML",
              //     "ssml": "<speak>"+content.hasDisplayRepromptText+"</speak>"
              //   }
              // },
               "shouldEndSession": false,
               "card": {
                 "type": "Standard",
                 "title": content.simpleCardTitle,
                 "text": content.simpleCardContent,
                 "image": {
                  "smallImageUrl": content.thumbnail,
                  "largeImageUrl": content.thumbnail
                  }
               }
             },
             "sessionAttributes": content.sessionAttributes
           }
           this.context.succeed(response);
           break;

       default:
          this.response.speak("Thanks for chatting, goodbye");
          this.emit(':responseReady');
   }

}


function httpsGet(myData, callback) {
    // /api/v1?resultTypes=item&resultFields=description.item.title,objects.object.publicContributions.transcription,objects.object.publicContributions.tags,description.item.naId&naIds=6731390
    var apiPath = '/api/v1?resultTypes=item'
        //+ '&resultFields=description.item.title,objects.object.publicContributions.transcription,objects.object.publicContributions.tags,description.item.naId,objects.object.file'
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
# National Archives Recipes Alexa Skill

## Purpose
The project's main focus is to integrate the National Archives Catalog API into a non traditional web application. 

## Setting Up Environment
The only required tool to run this skill in development mode is an Amazon Developer account.  

Follow this guide to step Step 5 and then continue with the instructions below.  
[Amazon Fact Skill Tutorial](https://developer.amazon.com/alexa-skills-kit/tutorials/fact-skill-1)

### Steps to Integrate this skill
1. Replace the Fact Skill on your dynamo server with the contents of `index.js`.
1. In the Alexa Skill Builder replace the content in the JSON Editor with the `skill.json` file.

## What's Included
This skill connects with the Catalog API using node js to pull recipes from a curated list of Items in the Archive. Their naIds are contained in a few arrays on `index.js` that are matched to the slot types in `skills.json`.

The `index.js` file is broken up into handlers and helper functions. The handler functions are directly related to Intents from Alexa and the helper functions mainly provide https requests and device checking. 
/**
 * Skill code stub for Amazon Echo
 */

const Alexa = require('alexa-sdk');
const baseHandlers = require('./handlers/base');
const languageStrings = {
  'en-US': require('./languageStrings/en-US.json')
};

/**
 * @param {object} event
 * @param {object} context
 */
function skill (event, context) {
  var alexa = Alexa.handler(event, context);

  alexa.resources = languageStrings;
  alexa.registerHandlers(baseHandlers);
  alexa.execute();
}

module.exports = skill;


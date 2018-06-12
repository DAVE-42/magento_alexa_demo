# Using Magento 2 from Alexa

## Prerequisites

This prototype and documentation assumes that you have reasonable experience building Alexa
Skills and developing Magento-based applications.

To test this prototype you need a functioning Magento2 store with the Rest-API enabled. 
The shop needs to have simple products in the inventory that can be added to the cart.

For this prototype we assume you have the ASK-CLI ready and running (https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html)

To run the skill locally you need to install ngrok.

## Setup

1. Clone repository
2. in folder ```alexa/lambda/custom``` run ```npm install``` to get all dependencies
3. open ```alexa/lambda/custom/lib/settings.js``` and adjust 
   customer and admin user credentials as well as host entry.
3. in folder ```alexa``` run ```ask deploy```

### Additional steps for local test setup

4. in folder ``` alexa/lambda/custom``` run ```node test.js``` (Skill runs locally)
5. start ngrok by running ```./ngrok http 3000```
6. get the https-URL that ngrok puts out, which will look sth like "https://29325xxx.ngrok.io"
4. log into Amazon developer portal
5. open ```Magento Demo``` skill settings
6. set endpoint of the skill to the ngrok-URL 
   (make sure you use the settings for https-endpoint and choose 'sub-domain with wildcard certificate')
7. Make sure, testing for the skill is enabled

## Interaction protocol

- Alexa, start Magento Demo
- Get me a backpack!
- I added "Endeavor Daytrip Backpack" to your shopping cart. You now have 1 items of this type in your cart. Is there anything else I can help you with?
- Buy watch
- I added "Luma Analog Watch" to your shopping cart. You now have 1 items of this type in your cart. Is there anything else I can help you with?
- No.
- Alright then! Bye bye! 

## Product matching

Some products can be stored for quick access in the language model. For this, the name, sku and synonyms 
are placed inside ```models/en-US.json```.
If the users says something that is not matched in the language model, the skill performs a product search
for the specified utterance and if the shop returns results the first one is used.

## Limitations

- The current version of this prototype can only handle simple products 
- There is no authentication for different users. This prototype does 
  transactions for one specific user specified in the ```settings.js```
- If the Magento2 demo store you're using is a bit on slow side you might encounter timeouts.
- You can only add a certain number of products to the language model directly. Once a skill is published it's
  hard to update the product list in the language model.
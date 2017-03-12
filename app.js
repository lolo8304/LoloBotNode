/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var builder = require('./core/');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
console.log("process.env.port="+process.env.port);
console.log("process.env.PORT="+process.env.PORT);
var port = process.env.port || process.env.PORT || 3978;
console.log("port="+port);
console.log("process.env.MICROSOFT_APP_ID="+process.env.MICROSOFT_APP_ID);
console.log("process.env.MICROSOFT_APP_PASSWORD="+process.env.MICROSOFT_APP_PASSWORD);

server.listen(port, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Create your bot with a function to receive messages from the user
/*
var bot = new builder.UniversalBot(connector, function (session) {
    console.log("message "+session.message.text+" arrived")
    session.send("You said: %s", session.message.text);
    console.log("conversationData="+session.conversationData);
});
*/
var bot = new builder.UniversalBot(connector, [
    function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        var name = results.response;
        session.send("Hi %s!", name);
    }
]);

/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var builder = require('./core/');
var restify = require('restify');
var request = require('request');


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

var bot = new builder.UniversalBot(connector);

// Add global LUIS recognizer to bot
var model = process.env.MICROSOFT_LUIS_MODEL || 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/7fae536f-e15b-4dca-89eb-2c2fe7a42378?subscription-key=15eaad62ca2745f191d172bcab175a95&verbose=true&q=';
console.log('LUIS endpoint ', model); 
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

dialog.matches('builtin.intent.none', [
    function (session, args, next) {
            session.send("Sorry - I did not get this");
    }
]);
dialog.matches('Hello', [
    function (session, args, next) {
        builder.Prompts.text(session, "Welcome to Barcelona - my name is LoloBot and I am your assistant. Who are you?");
    },
    function (session, results) {
        if (results.response && results.response.toLowerCase() === "lolo") {
            session.send("Welcome my friend. How can I help you?");
        } else {
            session.send("Sorry - I only listen to Lolo");
            builder.Prompts.text(session, "Try again?");
        }
    },
    function (session, results) {
        if (results.response && results.response.toLowerCase() === "lolo") {
            session.send("Welcome my friend. How can I help you?");
        } else {
            session.endDialog("Sorry - my boss is Lolo. Goodbye");
        }
    }
]);

dialog.matches('GetWeather', [
    function (session, args, next) {
        // Resolve and store any entities passed from LUIS.
        var intent = args.intent;
        var cityName = builder.EntityRecognizer.findEntity(args.entities, 'builtin.geography.city');
        var time = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.date');
        var temp = builder.EntityRecognizer.findEntity(args.entities, 'WeatherInfo::temp');
        var city = session.dialogData.city = {
          name: cityName ? cityName.entity : "Barcelona",
          date: time ? time.resolution.date : "2017-03-23",
          dateText: time ? time.entity : "today",
          type: temp ? "temperature" : "weather"
        };
        
        // exampe response
        /* body: {"coord":{"lon":2.16,"lat":41.39},"weather":[
                {"id":801,"main":"Clouds","description":"few clouds","icon":"02n"}
            ],
            "base":"stations","main":{
                "temp":286.15,"pressure":1026,"humidity":81,"temp_min":285.15,"temp_max":287.15
            },"visibility":10000,
            "wind":{"speed":0.5},"clouds":{"all":24},"dt":1489438800,
            "sys":{"type":1,"id":5485,"message":0.111,"country":"ES","sunrise":1489385092,"sunset":1489427809},
            "id":3128760,
            "name":"Barcelona","cod":200}
        */
        if (city.name) {
            getWeather(city.name, function(cityName, error, json) {
                var weather = json.weather[0];
                var main = json.main;
                var weatherText = "The temperature "+city.dateText+" is "+main.temp+"°C in "+city.name;
                if (city.type == "temperature") {
                    weatherText = "The temperature "+city.dateText+" is "+main.temp+"°C in "+city.name;
                } else {
                    weatherText = "Weather forecast in "+city.name+" "+city.dateText+": "+weather.description+" ["+main.temp_min+"°C - "+main.temp_max+"°C ]";
                }
                session.send(weatherText);
                console.log(json);
            });
        } else {
            sessin.endDialog("No answer without location. Bye");
        }
    }
]);

dialog.onDefault(
    builder.DialogAction.send("Sorry - I did not understand. Try again")
);


function getWeather(cityName, callback) {
    var url = "http://api.openweathermap.org/data/2.5/weather?units=metric&appid=438fdaf64852b4208f4b48759afc3dcb&q="+cityName;
    request(url, function (error, response, body) {
        // Data reception is done, do whatever with it!
        var parsed = JSON.parse(body);
        callback(cityName, error, parsed);
    });
}



/* simple Hello Echo bot
var bot = new builder.UniversalBot(connector, [
    function (session) {
        console.log("message "+session.message.text+" arrived")
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        console.log("message "+session.message.text+" arrived + results "+results.response);
        var name = results.response;
        session.send("Hi %s!", name);
    }
]);

*/
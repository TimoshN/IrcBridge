var irc = require('irc');
const token = require('./token.json');

function NewClient(id, nick, password, discordClient) {

    console.log('Irc:NewClient', id, nick)

    var clientIrc = new irc.Client(token.ircserver, nick,{
        channels: [token.channel],
    });

    clientIrc.addListener('registered', function() {
        clientIrc.say('nickserv', 'identify ' + password);
    })

    clientIrc.addListener('message', function (from, to, message) {
        console.log('Basic:', from + ' => ' + to + ': ' + message);
    });

    clientIrc.addListener('pm', function (from, message) {
        console.log('PM', from + ' => ME: ' + message);

        discordClient.users.find( x => x.id === id ).send('<'+from+'> '+message)
    });

    clientIrc.addListener('names', function (channel, nicks) {
        console.log("Connected "+nick)

        discordClient.users.find( x => x.id === id ).send('Connected')
    });

    clientIrc.on('error', function(err){
        console.log(err)
    })

    return clientIrc
}


module.exports = {
    NewClient:NewClient
}
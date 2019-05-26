var irc = require('irc');
const token = require('./token.json');

function NewClient(id, nick, password, discordClient) {

    console.log('Irc:NewClient', id, nick, token.ircserver, token.channel)

    var clientIrc = new irc.Client(token.ircserver, nick,{
        autoConnect: false,
        userName: 'IrcBridge',
        realName: 'Test irc bridge for discord',
        //channels: [token.channel],
        debug: true,
        showErrors: true,
    });

    clientIrc.addListener('registered', function() {
        console.log('REGISTERED')

        // setTimeout(function(){
        //     clientIrc.say('NickServ', 'identify ' + password);
        // }, 2000)
        // setTimeout(function(){
        //     clientIrc.connect()

        //     clientIrc.join(token.channel, function(msg){
        //         console.log(msg)
        //     })
        // }, 5000)
    })

    clientIrc.addListener('notice', function(nick, to, text, message) {
        if ( nick == 'NickServ' ) {

            if ( text.search('This nickname is registered') >= 0 ) {
                setTimeout(function(){
                    console.log('SEND identify')
                    clientIrc.say('NickServ', 'identify ' + password);
                }, 2000)
            } else if ( text.search('You are now identified for') >= 0  ) {
                console.log('JOIN', token.channel)
                clientIrc.join(token.channel, function(msg){
                    console.log(msg)
                })
            }
        }
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
        discordClient.users.find( x => x.id === id ).send(JSON.stringify(err))
    })

    clientIrc.connect(1, function(serverReply) {
        console.log("Connected!\nserverReply=", serverReply);

        
        // clientIrc.join(token.channel, function(input) {
        //   console.log("Joined #channel");
          
        // });
    });

    return clientIrc
}


module.exports = {
    NewClient:NewClient
}
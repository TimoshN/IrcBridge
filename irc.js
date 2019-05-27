var irc = require('irc');
const token = require('./token.json');

var nickToID = {}

var ns = {}

ns.Register = function() {
    console.log('REGISTERED')
}
ns.Notice = function(password, ircClient){
    return function(nick, to, text, message) {
        if ( nick == 'NickServ' ) {
            if ( text.search('This nickname is registered') >= 0 ) {
                setTimeout(()=>{
                    console.log('SEND identify')
                    this.say('NickServ', 'identify ' + password);
                }, 1000)
            } else if ( text.search('You are now identified for') >= 0  ) {
                console.log('JOIN', token.channel)
                this.join(token.channel, function(msg){
                    console.log(msg)
                })
            }
        }
    }
}

ns.Message = function ( discordClient ) {
    return function( from, to, message ) {
        if ( nickToID[from] ) {

        } else {       
            discordClient.send(message, { username:from }).catch(err => {
                console.log('Message', err)
            })
        }
    }
}

ns.PM = function(id, discordClient) {
    return function (from, message) {
        discordClient.users.find( x => x.id === id ).send('<'+from+'> '+message)
    }
}

ns.Names = function(id, discordClient) {
    return function (channel, nicks) {
        discordClient.users.find( x => x.id === id ).send('<Connected>')

        discordClient.guilds.find(guild => {
            var role = guild.roles.find(x => x.name === token.discord_role_name)

            if ( role ) {
                guild.members.find(x => {
                    if (x.id === id ) {
                        x.addRole( role.id, 'IrcBridge enable irc' )
                    }
                })
            }
        })
    }
}

ns.NamesReader = function( ) {
    console.log("Reader connected.")
}

ns.OnError = function(id, discordClient) {
    return function(err){
        console.log(err)
        discordClient.users.find( x => x.id === id ).send(JSON.stringify(err))
    }
}

ns.OnErrorReader = function() {
    console.log(err)
}

ns.ServerConnect = function(serverReply) {
    console.log("Connected!");
}


function NewClient(id, nick, password, discordClient) {


    console.log('Irc:NewClient', id, nick, token.ircserver, token.channel)

    nickToID[nick] = id 

    var clientIrc = new irc.Client(token.ircserver, nick,{
        autoConnect: false,
        userName: 'Discord irc client',
        realName: 'Test irc client for discord',
    });

    clientIrc.addListener('registered', ns.Register )

    clientIrc.addListener('notice', ns.Notice(password, clientIrc))

    clientIrc.addListener('pm', ns.PM(id, discordClient));

    clientIrc.addListener('names', ns.Names(id, discordClient));

    clientIrc.on('error', ns.OnError(id, discordClient));

    clientIrc.connect(5, ns.ServerConnect);

    return clientIrc
}


function StartReader(discordClient) {

    console.log('Irc:StartReader', token.irclogin, token.ircserver, token.channel)

    var clientIrc = new irc.Client(token.ircserver, token.irclogin,{
        autoConnect: false,
        userName: 'IrcBridge',
        realName: 'Test irc bridge for discord',
    });

    clientIrc.addListener('registered', ns.Register )

    clientIrc.addListener('notice', ns.Notice(token.ircpassword, clientIrc))

    clientIrc.addListener('message', ns.Message(discordClient));

    clientIrc.addListener('names', ns.NamesReader);

    clientIrc.on('error', ns.OnErrorReader);

    clientIrc.connect(5, ns.ServerConnect);

    return clientIrc
}

module.exports = {
    NewClient:NewClient,
    StartReader:StartReader
}
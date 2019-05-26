const settings = require('./settings.js');
const irc = require('./irc.js');
const token = require('./token.json');

var ircClients = {}

const prefix = '!'
const commands = {
    'register': function(msg) {
        let msg_command = msg.content.split(' ')

        let nick = msg_command[1];
        let password = msg_command[2];

        let status = settings.Register(msg.author.id, { nick:nick, password:password } )

        if ( status ) {
            msg.reply('Register command nick=' + nick + ' password=' + password);
        } else {
            msg.reply("Can't register this nick");
        }
    },
    'unregister': function(msg) {
        let msg_command = msg.content.split(' ')

        let nick = msg_command[1];
        
        let status = settings.Unregister(msg.author.id)

        if ( status ) {
            msg.reply('Unregister command nick='+ nick);
        } else {
            msg.reply("Can't unregister this nick");
        }
    },
    'reconnect':function(msg){

        var info = settings.GetInfoByID( msg.author.id )

        console.log(info)

        if ( info ) {
            msg.reply("Reconnecting?");

            if ( ircClients[msg.author.id] ) {
                ircClients[msg.author.id].disconnect()
            }
            delete ircClients[msg.author.id]

            ircClients[msg.author.id] = irc.NewClient(msg.author.id, info.nick, info.password, client)
        } else {
            if ( ircClients[msg.author.id] ) {
                ircClients[msg.author.id].disconnect()
            }
            delete ircClients[msg.author.id]
        }
        // if ( ircClients[msg.author.id] ) {

        // } else {
            
        // }
    },
    'msg': function(msg) {
        let msg_command = msg.content.split(' ')

        let target = msg_command[1];

        let target_msg = []

        for (let i=2; i<msg_command.length; i++) {
            target_msg.push( msg_command[i] )
        }

        console.log('Msg to', target, target_msg.join(' '))

        if ( ircClients[msg.author.id] ) {
            ircClients[msg.author.id].say(target, target_msg.join(' '))
        }
    },
    'who': function(msg) {
        if ( ircClients[msg.author.id] ) {

            let channels = ircClients[msg.author.id].chans
            let user_list = []
            for (let name in channels['#wowuidevs'].users) {
                user_list.push('<'+name+'>')
            }

            msg.reply('Users: '+user_list.join(', '))
        }
    } 
}


const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    //console.log( client.users.find( x => x.id === '118483467766857735' ).send('TestWhisper') )

    var list = settings.GetRegistered() 

    for (id in list) {
        ircClients[id] = irc.NewClient(id, list[id].nick, list[id].password, client)
    }
});

client.on('message', msg => {

    if (msg.content === 'ping') {
        msg.reply('Pong!');
    }


    console.log(msg.channel.type, msg.author.tag, msg.author.id, msg.content)

    console.log('msg.content.startsWith(prefix)=', msg.content.startsWith(prefix))
    
    if ( msg.channel.type == 'dm' ) {
     
        if (!msg.content.startsWith(prefix)){
            return;
        }
        
        console.log('Pass1')

        console.log('command=', msg.content.toLowerCase().slice(prefix.length).split(' ')[0])
        console.log('hasOwnProperty=', commands.hasOwnProperty(msg.content.toLowerCase().slice(prefix.length).split(' ')[0]))

        if (commands.hasOwnProperty(msg.content.toLowerCase().slice(prefix.length).split(' ')[0])) {

            console.log('Pass2')

            commands[msg.content.toLowerCase().slice(prefix.length).split(' ')[0]](msg);
        }
    } else if ( msg.channel.type == 'text' ) {
        if ( ircClients[msg.author.id] ) {
            ircClients[msg.author.id].say('#wowuidevs', msg.content)
        }
    }
});

client.on('error', function(e){
    console.log(e)
})
client.login(token.d_token);




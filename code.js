const settings = require('./settings.js');
const irc = require('./irc.js');
const token = require('./token.json');

var ircClients = {}
var ircReader = null 

const prefix = '!'
const commands = {
    'register': function(msg) {
        let status = settings.Register(msg.author.id)

        if ( status ) {
            msg.reply('<You are registered>');
        } else {
            msg.reply("<Can't register you>");
        }
    },
    'unregister': function(msg) {
        let status = settings.Unregister(msg.author.id)

        if ( status ) {
            msg.reply('<You are unregistered>');
        } else {
            msg.reply("<Can't unregister you>");
        }
    },
    'login':function(msg){
        let msg_command = msg.content.split(' ')

        let nick = msg_command[1];
        let password = msg_command[2];

        if ( ircClients[msg.author.id] ) {
            ircClients[msg.author.id].disconnect();
            delete ircClients[msg.author.id]

            msg.reply("<Disconnecting.>");
        }

        if ( !ircClients[msg.author.id] ) {
            ircClients[msg.author.id] = irc.NewClient(msg.author.id, nick, password, client)

            msg.reply("<Connecting.>");
        }
    },
    'msg': function(msg) {
        let msg_command = msg.content.split(' ')

        let target = msg_command[1];

        if ( target ==  token.channel ) {
            msg.reply('Use '+token.discord_chat_name+' for public messages')
            return
        }

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
            for (let name in channels[token.channel].users) {
                user_list.push('<'+name+'>')
            }

            msg.reply('```Users:\n'+user_list.join(', ')+'```')
        }
    },
    'help':function(msg) {

        let msgBlock = '```Commands:\n'
		
		msgBlock += '!login nick password - join to irc channel\n'
		msgBlock += '!register - let you warning about IrcBridge restart\n'
		msgBlock += '!unregister - disable warning\n'
		msgBlock += '!who - list of users in irc channel\n'
		msgBlock += '!msg target msg - whisper to target\n'
        msgBlock += '!help - list of commands\n'

        msgBlock += "```"

        msg.reply(msgBlock)
    }
}


const Discord = require('discord.js');
const client = new Discord.Client();
const webhook = new Discord.WebhookClient(token.webhookid, token.webhookkey)

function setupRoles(guild, role) {
    role.setPermissions(['SEND_MESSAGES', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY', 'VIEW_CHANNEL'])
    
    guild.members.find(function(x){
        if ( x.id != client.user.id ) {
            x.edit({roles: []}).catch(e=>{
                console.log(x.user.username+'#'+x.user.discriminator)
                console.log("Role error=", e)
            })
        } else {
            x.addRole( role.id, 'IrcBridge enable irc' )
        }
    })
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    //console.log( client.users.find( x => x.id === '118483467766857735' ).send('TestWhisper') )

    console.log('client.user.id=', client.user.id)

    ircReader = irc.StartReader(webhook)


    var list = settings.GetRegistered() 

    for (id in list) {
        client.users.find( x => x.id === id ).send('<IrcBridge is online. Need type !login nick password to start chatting>')
    }

    var guild = client.guilds.find(x => x.id === '581968083518881823' ) 

    console.log('Check ', token.discord_chat_name)

    var channel = guild.channels.find(c => c.name === token.discord_chat_name)

    if ( !channel ) {
        console.log('Created ', token.discord_chat_name)
        channel = guild.createChannel(token.discord_chat_name, 'text')
    } else {
        console.log(token.discord_chat_name, ' already created ')
    }
    
    channel.overwritePermissions(channel.guild.defaultRole, { 
        SEND_MESSAGES: false,
        MANAGE_MESSAGES: false,
        READ_MESSAGE_HISTORY: false,
        VIEW_CHANNEL: false,
     });

    console.log('Check role ', token.discord_role_name)

    var role = guild.roles.find(x => x.name === token.discord_role_name)

    if ( !role ) {
        console.log('Create role ', token.discord_role_name)

        role = guild.createRole({
            name: token.discord_role_name,
            color: 3066993,
            hoist: false,
            position: 1,
            permissions: [67325505],
            managed: false,
            mentionable: false
        }, 'IrcBridge role')
    } else {
        console.log('Role ',token.discord_role_name,' already exists')
    }
    setupRoles(guild, role)

    channel.overwritePermissions(role, { 
        SEND_MESSAGES: true,
        MANAGE_MESSAGES: true,
        READ_MESSAGE_HISTORY: true,
        VIEW_CHANNEL: true,
     });

    webhook.send('<Online>', { username:'SystemMessage' }).catch(err => {
        console.log('Message', err)
    })

});

client.on('message', msg => {

    if (msg.content === 'ping') {
        msg.reply('Pong!');
    }

    console.log(client.user.id, msg.channel.type, msg.channel.name, msg.author.tag, msg.author.id, msg.content)

    if ( msg.author.id === client.user.id || msg.author.id === token.webhookid ) {
        return 
    }

    console.log(msg.channel.type, msg.channel.name, msg.author.tag, msg.author.id, msg.content)

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
    } else if ( msg.channel.type == 'text' && msg.channel.name == token.discord_chat_name ) {
        if ( ircClients[msg.author.id] ) {
            ircClients[msg.author.id].say(token.channel, msg.content)
        } else {
            msg.author.send('<Need type !login nick password to start chatting>') 
        }
    }
});

client.on('error', function(e){
    console.log(e)
})
client.login(token.d_token);




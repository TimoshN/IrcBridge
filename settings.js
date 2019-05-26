const nconf = require('nconf');

nconf.use('file', { file: './config.json' });
nconf.load();



// nconf.set('aboutus', req.body.html)
// nconf.save();

// let aboutus = nconf.get('aboutus')
function Register(id, info ) {
    
    if ( GetInfoByID( id ) ) {
        return false
    }

    nconf.set('registered:'+id, info)
    nconf.save();

    return true
}

function Unregister(id) {

    if ( !GetInfoByID( id ) ) {
        return false
    }

    nconf.set('registered:'+id, null)
    nconf.save();

    return true
}

function GetInfoByID( id ) {
    var info = nconf.get('registered:'+id)

    console.log('GetID:info=', info)

    return info
}

function GetInfoByNick( nick ) {
    var list = nconf.get('registered')

    for (id in list) {
        if ( list[id].nick === nick ) {
            
            console.log('GetInfoByNick:info=', list[id])

            return list[id]
        }
    }

}

function GetRegistered() {
    var list = nconf.get('registered')

    console.log('GetRegistered:list=', list)

    return list
}

module.exports = {
    Register:Register,
    Unregister:Unregister,
    GetInfoByID:GetInfoByID,
    GetInfoByNick:GetInfoByNick,
    GetRegistered:GetRegistered,
}
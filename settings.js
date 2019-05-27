const nconf = require('nconf');

nconf.use('file', { file: './config.json' });
nconf.load();



// nconf.set('aboutus', req.body.html)
// nconf.save();

// let aboutus = nconf.get('aboutus')
function Register(id) {
    
    if ( GetInfoByID( id ) ) {
        return false
    }

    nconf.set('registered:'+id, true)
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

function GetRegistered() {
    var list = nconf.get('registered')

    console.log('GetRegistered:list=', list)

    return list
}

module.exports = {
    Register:Register,
    Unregister:Unregister,
    GetInfoByID:GetInfoByID,
    GetRegistered:GetRegistered,
}
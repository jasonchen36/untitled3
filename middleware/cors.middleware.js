var config = require('../config/config');
var cors = require('cors');
var _ = require('lodash');

//cors middleware
var whitelist = _.map(config.accessControlAllowOrigin.split(','),function(whiteListedUri) {
    return whiteListedUri.trim();
});

var originWhiteListCheck = function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
};

var corsOptions = {
    origin: originWhiteListCheck,
    methods: ['GET', 'PUT', 'POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','Content-Length','X-Request-With'],
    credentials:true
};

module.exports = cors(corsOptions);

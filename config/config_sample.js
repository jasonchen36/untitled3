/*jslint node: true */

'use strict';

var _ = require('lodash');
var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
    domain: process.env.DOMAIN,
    api: {
        name: 'TAXplan'
    },
    root: rootPath,
	port: 3001,
    ipaddr : '127.0.0.1',
    database: {
      debugSQL: false,
      client:'mysql',
      connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'taxplan',
        charset: 'utf8'
      }
    },
	// The secret should be set to a non-guessable string that
	// is used to compute a session hash
	sessionSecret: process.env.SESSION_SECRET,
    JWTExpires: '1h',
    //We need to think about storage, possibly s3
    uploadDir: rootPath + '/uploads',
    email: {
        admin: 'email@email.com',//'info@taxplancanada.ca',
        templates: {
            welcome: 'welcome',
            password_reset: 'password_reset',
            comment: 'comment',
            finish_questionnaire: 'questionnaire_finished',
            payment: 'payment',
            profile_created: 'profile_created',
            document_uploaded: 'document_uploaded'
        }
    },
    stripe: {
        secret: process.env.STRIPE_SECRET_KEY,
        key: process.env.STRIPE_PUBLIC_KEY
    },
    postageapp: {
        api_key: process.env.POSTAGEAPP_API_KEY
    }
};

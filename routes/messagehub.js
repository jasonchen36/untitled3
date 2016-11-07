/*jslint node: true */

'use strict';

//TODO: optimize the imports

// User routes use users controller
var account = require('../controllers/account');
var fs = require('fs');
var mv = require('mv');
var config = require('../config/config');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var mongoose = require('mongoose'),
    Account = mongoose.model('Account');
var User = mongoose.model('User');
var Questionnaire = mongoose.model('Questionnaire');
var Document = mongoose.model('Document');
var PDFDocument = require('pdfkit');
var htmlparser = require("htmlparser2");

var message = require('../controllers/message.controller');

// v2 of authorization-faking method. 
// TODO: REMOVE when no longer testing email!!
var fakeAuthorization = function (req, res, next) {
    //console.log('Starting fakeAuthorization...');
    
    User.findOne({ email: 'ken@ellefsontech.com' }, function (err, user) {
        if (err) {
            //return done(err);
        }
        if (!user) {
            //return done(null, false); //no such user
            next();
        } else {
            //console.log('found user');
            //return done(null, user); //allows the call chain to continue to the intended route
            req.user = user;
            next();
        }
    });
};



module.exports = function (app, passport) {
    // test
    app.get('/messagehub/himom', passport.authenticate('bearer', { session: false }), function (req, res) {
        res.send('Hi Mom! it\'s ' + req.user.name);
    });
    
    // authentication example - passport.authenticate('bearer', { session: false })
    
    app.post('/messages', passport.authenticate('bearer', { session: false }), message.create);
    
    app.get('/messages', passport.authenticate('bearer', { session: false }), message.getMessageListForUser);
    
    app.get('/messages/:id', passport.authenticate('bearer', { session: false }), message.read);
    
    // pages
    app.get('/messages/page', function (req, res) {
        res.render('users/messages', {
            title: 'Message Hub'
        });
    });
    
    // email pull(here for TEST)
    // TODO: relocate? 
    app.get('/emailtest', fakeAuthorization, message.emailtest);
    
    app.get('/messages/emailtest', fakeAuthorization, function (req, res) {
        res.send('an email test from ' + req.user.name);
    });


};

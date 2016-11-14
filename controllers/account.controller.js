/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
//var db = require('../services/db');
var logger = require('../services/logger.service');
//var account = require('../models/account.model');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');


exports.create = function (req, res) {
    res.status(200).send('OK');
};


exports.findById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      name: 'test',
      email: 'test@email.com'
    };

    res.status(200).send(jsonData);
};

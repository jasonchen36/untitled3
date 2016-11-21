/*jslint node: true */

'use strict';

// account controller

/**
 * Module dependencies.
 */
var logger = require('../services/logger.service');
var account = require('../models/account.model');
var validator = require('express-validator');
var util = require('util');
var bodyParser = require('body-parser'); //connects bodyParsing middleware
var path = require('path');     //used for file path

// boilerplate
var _ = require('underscore');
var config = require('../config/config');

/*******************************************************************************
ENDPOINT
POST /document

INPUT BODY:
{
  taxReturnId:    123,
  uploadFileName: "T4.pdf"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.create = function (req, res) {
    console.dir(req.file);
    console.log(req.body.taxReturnId);

    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({
        taxReturnId: req.body.taxReturnId,
        file: req.file
    }));
};


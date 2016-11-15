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

/*******************************************************************************
ENDPOINT
POST /account

INPUT BODY:
{
  firstname:  "Michael",
  product:    "2016"
}

RESPONSE:
200 OK
 ******************************************************************************/
exports.create = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
GET /account/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  userId: 913,
  name: "Frank",
  email: "test@email.com"
}
*******************************************************************************/
exports.findById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      userId: 913,
      name: 'test',
      email: 'test@email.com'
    };

    res.status(200).send(jsonData);
};
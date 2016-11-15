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
POST /quote

INPUT BODY:
{
  account_id:  "33",
  product_id:    "44"
}

RESPONSE:
200 OK
 ******************************************************************************/
exports.create = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
GET /quote/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  account_id: "33",
  product_id: "44",
  price: "200"
}
*******************************************************************************/
exports.findById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      price: '200'
    };

    res.status(200).send(jsonData);
};

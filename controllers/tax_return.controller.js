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
POST /tax_return

INPUT BODY:
{
  account_id:  "33",
  first_name: "Jason",
  last_name: "Chen",
  province_of_residence: "Ontario",
  date_of_birth: "08-23-1988",
  canadian_citizen: "Y",
  authorize_cra: "Y"
}

RESPONSE:
200 OK
 ******************************************************************************/
exports.create = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
GET /tax_return/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  account_id: "33",
  status_id: "44",
  address: "911 Test"
}
*******************************************************************************/
exports.findById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      address: '911 Test'
    };

    res.status(200).send(jsonData);
};

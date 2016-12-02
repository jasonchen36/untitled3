/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
//var db = require('../services/db');
var logger = require('../services/logger.service');
var Categories = require('../models/categories.model');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');

/*******************************************************************************
ENDPOINT
GET /categories

RESPONSE:

[
  {
    "id": 1,
    "name": "Income",
    "displaytext": "Please add the following income information?",
    "secondarytext": null,
    "created_at": "2016-11-16T23:56:04.000Z",
    "updated_at": "2016-11-17T22:15:44.000Z"
  },
  {
    "id": 2,
    "name": "Credits",
    "displaytext": "Hi % do you have these credits:",
    "secondarytext": null,
    "created_at": "2016-11-16T23:56:11.000Z",
    "updated_at": "2016-11-17T22:15:45.000Z"
  }
]

*******************************************************************************/
exports.list = function (req, res) {

      Categories.list().then(function(categories) {
          if (categories) {
              res.status(200).send(categories);
          } else {
              res.status(404).send();
          }
        });
};

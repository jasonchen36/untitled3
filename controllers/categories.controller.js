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
{

}
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

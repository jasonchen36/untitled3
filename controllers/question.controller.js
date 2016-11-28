/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
//var db = require('../services/db');
var logger = require('../services/logger.service');
var Account = require('../models/account.model');
var Product = require('../models/product.model');
var Question = require('../models/question.model');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');

/*******************************************************************************
ENDPOINT
GET /questions/product/:id/category/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
   "id":1,
   "accountId":2,
   "productId":3,
   "taxReturns":[
      {
         "taxReturnId":1,
         "name":"Carmela Doctor",
         "items":[
            {
              "id": 1,
               "text":"Tax Prep. Basic",
               "value":80
            },
            {
              "id": 2,
               "text":"Tax Prep. Investment Income",
               "value":10
            },
            {
              "id": 3,
               "text":"Tax Prep. Rental Income",
               "value":10
            }
         ]
      },
      {
         "taxReturnId":2,
         "name":"Doug Doctor",
         "items":[
            {
              "id": 1,
               "text":"Tax Prep. Basic",
               "value":80
            },
            {
              "id": 2,
               "text":"Tax Prep. Investment Income",
               "value":10
            },
            {
              "id": 3,
               "text":"Tax Prep. Rental Income",
               "value":10
            }
         ]
      }
   ],
   "otherLineItems":  // quoteLineItems table (taxReturnId needs to be null - remove constraint)
   [
      {
         "id":33,
         "name":"Direct Deposit",
         "items":[
            {
               "id": 1,
               "text":"Direct Deposit",
               "value":5
            }
         ]
      }
   ]
}
*******************************************************************************/
exports.findById = function (req, res) {
  req.checkParams('productId', 'Please provide a product id').isInt();
  req.checkParams('categoryId', 'Please provide a category id').isInt();

  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var productId = req.params.productId;
      var categoryId = req.params.categoryId;
      Question.findByProductIdCategoryId(productId,categoryId).then(function(question) {
          if (question) {
              res.status(200).send(question);
          } else {
              res.status(404).send();
          }
      });
  }
};

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
   "id":1,
   "accountId":2,
   "productId":3,
   "taxReturnsQuoted":[
      {
         "taxReturnId":1,
         "name":"Carmela Doctor",
         "itemCount":3,
         "items":[
            {
               "text":"Tax Prep. Basic",
               "value":80
            },
            {
               "text":"Tax Prep. Investment Income",
               "value":10
            },
            {
               "text":"Tax Prep. Rental Income",
               "value":10
            }
         ]
      },
      {
         "taxReturnId":2,
         "name":"Doug Doctor",
         "itemCount":3,
         "items":[
            {
               "text":"Tax Prep. Basic",
               "value":80
            },
            {
               "text":"Tax Prep. Investment Income",
               "value":10
            },
            {
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
         "itemCount":1,
         "items":[
            {
               "text":"Direct Deposit",
               "value":5
            }
         ]
      }
   ]
}
*******************************************************************************/
exports.findById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      price: '200'
    };

    res.status(200).send(jsonData);
};

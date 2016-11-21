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
  accountId:  33,
  productId:  44
}

RESPONSE:
200 OK
{
  quoteId: 4
}
 ******************************************************************************/
exports.create = function (req, res) {
    var jsonData = {
      quoteId: 4
    };
    res.status(200).json(jsonData);
};

/*******************************************************************************
ENDPOINT
POST /quote/:id/submit

INPUT BODY:
{
  accountId:  33,
  productId:   44
}

RESPONSE:
200 OK
{
  quoteId: 4
}
 ******************************************************************************/
exports.submit = function (req, res) {
  var jsonData = {
    quoteId: 4
  };
    res.status(200).json(jsonData);
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
    var id = req.params.id;
    var jsonData = {
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
    };

    res.status(200).json(jsonData);
};

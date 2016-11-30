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
var Quote = require('../models/quote.model');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');

/*******************************************************************************
ENDPOINT
POST /quote

INPUT BODY:
{
  "accountId":  33,
  "productId":  44
}

RESPONSE:
200 OK
{
  "quoteId": 4
}
 ******************************************************************************/
exports.create = function (req, res) {
  req.checkBody('accountId', 'Please provide a accountId').isInt();
  req.checkBody('productId', 'Please provide a productId').isInt();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var accountId = req.body.accountId;
      var productId = req.body.productId;

      // check that accountId exists
      Account.findById(accountId).then(function(account) {
          if ((!account) || (account.length === 0)) {
              res.status(404).send({ msg: 'Invalid accountID' });
          } else {
              // check that productId exists
              Product.findById(productId).then(function(product) {
                  if ((!product) || (product.length === 0)) {
                      res.status(404).send({ msg: 'Invalid productID' });
                  } else {
                      var quoteObj = {};
                      quoteObj.accountId = accountId;
                      quoteObj.productId = productId;

                      return Quote.create(quoteObj).then(function(quoteId) {
                          var resultObj = {};
                          resultObj.accountId = accountId;
                          resultObj.productId = productId;

                          res.status(200).json(resultObj);
                      });
                  }
              });
          }
      });
  }
};

/*******************************************************************************
ENDPOINT
POST /quote/:id/submit

Params:
quoteId

INPUT BODY:
{
  "accountId":  70,
  "productId":   10
}

RESPONSE:
200 OK
{
  "quoteId": 4
}
 ******************************************************************************/
exports.submit = function (req, res) {
  req.checkBody('accountId', 'Please provide a accountId').isInt();
  req.checkBody('productId', 'Please provide a productId').isInt();
  req.checkParams('id', 'Please provide a quoteId').isInt();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var accountId = req.body.accountId;
      var productId = req.body.productId;

      // check that accountId exists
      Account.findById(accountId).then(function(account) {
          if ((!account) || (account.length === 0)) {
              res.status(404).send({ msg: 'Invalid accountID' });
          } else {
              // check that productId exists
              Product.findById(productId).then(function(product) {
                  if ((!product) || (product.length === 0)) {
                      res.status(404).send({ msg: 'Invalid productID' });
                  } else {
                      var quoteObj = {};
                      quoteObj.accountId = accountId;
                      quoteObj.productId = productId;

                      return Quote.create(quoteObj).then(function(quoteId) {
                          var resultObj = {};
                          resultObj.accountId = accountId;
                          resultObj.productId = productId;

                          res.status(200).json(resultObj);
                      });
                  }
              });
          }
      });
  }
};


/*******************************************************************************
ENDPOINT
GET /quote/:id

Params:
quoteId

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
  req.checkParams('id', 'Please provide a quoteId').isInt();

  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var id = req.params.id;
      Quote.findById(id).then(function(quote) {
          if (quote) {
              res.status(200).send(quote);
          } else {
              res.status(404).send();
          }
      });
  }
};

/*******************************************************************************
ENDPOINT
POST /quote/:id/calculate

Params:
quoteId

INPUT BODY:
{
  "accountId":  33,
  "productId":  44
}

RESPONSE:
200 OK
{
  "quoteId": 4,
  "lineItems": [],
  "taxReturns": []
}
 ******************************************************************************/
exports.calculate = function (req, res) {
  req.checkBody('accountId', 'Please provide a accountId').isInt();
  req.checkBody('productId', 'Please provide a productId').isInt();
  req.checkParams('id', 'Please provide a quoteId').isInt();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var accountId = req.body.accountId;
      var productId = req.body.productId;

      // check that accountId exists
      Account.findById(accountId).then(function(account) {
          if ((!account) || (account.length === 0)) {
              res.status(404).send({ msg: 'Invalid accountID' });
          } else {
              // check that productId exists
              Product.findById(productId).then(function(product) {
                  if ((!product) || (product.length === 0)) {
                      res.status(404).send({ msg: 'Invalid productID' });
                  } else {
                      var quoteObj = {};
                      quoteObj.accountId = accountId;
                      quoteObj.productId = productId;

                      return Quote.create(quoteObj).then(function(quoteId) {
                          var resultObj = {};
                          resultObj.accountId = accountId;
                          resultObj.productId = productId;

                          res.status(200).json(resultObj);
                      });
                  }
              });
          }
      });
  }
};

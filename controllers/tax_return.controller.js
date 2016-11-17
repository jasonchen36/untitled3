/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
var logger = require('../services/logger.service');
var TaxReturn = require('../models/tax_return.model');
var Account = require('../models/account.model');
var Product = require('../models/product.model');
var validator = require('express-validator');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');

/*******************************************************************************
ENDPOINT
POST /tax_return

INPUT BODY:
{
  accountId: 1,
  productId: 70,
  filers: [
    {
      firstName: 'Carmela'
    },
    {
      firstName: 'Doug'
    },
    {
      firstName: 'Tim'
    },
    {
      firstName: 'Michael'
    }
  ]
}

RESPONSE:
200 OK
{
  accountId: 1,
  productId: 70,
  filerCount: 4,
  taxReturns: [
    {
      firstName: 'Carmela',
      taxReturnId: 55
    },
    {
      firstName: 'Doug',
      taxReturnId: 56
    },
    {
      firstName: 'Tim',
      taxReturnId: 57
    },
    {
      firstName: 'Michael',
      taxReturnId: 58
    }
  ]
}
 ******************************************************************************/
exports.createTaxReturn = function (req, res) {
    req.checkBody('accountId', 'Please provide a accountId').isInt();
    req.checkBody('productId', 'Please provide a productId').isInt();
    req.checkBody('filers', 'Please provide an array of filers').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var accountId = req.body.accountId;
        var productId = req.body.productId;
        var filers = req.body.filers;

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
                        var taxReturnPromises = [];
                        _.forEach(filers, function(filer) {
                            var taxReturnObj = {};
                            taxReturnObj.accountId = accountId;
                            taxReturnObj.productId = productId;
                            taxReturnObj.firstName = filer.firstName;
                            taxReturnPromises.push(TaxReturn.create(taxReturnObj));
                        });
                        return Promise.all(taxReturnPromises).then(function(promiseResults) {
                            var resultObj = {};
                            resultObj.accountId = accountId;
                            resultObj.productId = productId;
                            resultObj.filerCount = filers.length;
                            resultObj.taxReturns = promiseResults;

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
PUT /tax_return

INPUT BODY:
{
  accountId:  1,                            Mandatory
  productId:  70,                           Mandatory
  firstName: "Jason",                       Optional
  lastName: "Chen",                         Optional
  provinceOfResidence: "Ontario",           Optional
  dateOfBirth: "08/23/1988",                Optional
  canadianCitizen: "Y",                     Optional
  authorizeCra: "Y"                         Optional
}

RESPONSE:
200 OK

NOTE:
At least one optional field must be present or there would be nothing to update
 ******************************************************************************/
exports.updateTaxReturnById = function (req, res) {
    res.status(200).send('OK');
};
/*******************************************************************************
ENDPOINT
GET /tax_return/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  accountId: 33,
  statusId: 44
}
*******************************************************************************/
exports.findTaxReturnById = function (req, res) {
    req.checkParams('id', 'Please provide an integer id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var id = req.params.id;
        TaxReturn.findById(id).then(function(taxReturn) {
            if (taxReturn) {
                res.status(200).send(taxReturn);
            } else {
                res.status(404).send();
            }
        });
    }
};

/*******************************************************************************
ENDPOINT
POST /tax_return/:id/answer

INPUT BODY:
{
  questionId:  "33",
  taxReturnId: "44",
  text: "Y"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.createAnswer = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
GET /tax_return/:id/answer/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  text: "Y"
}
*******************************************************************************/
exports.findAnswerById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      text: "Y"
    };

    res.status(200).send(jsonData);
};

/*******************************************************************************
ENDPOINT
GET /tax_return/:id/answers

INPUT BODY:
{
  taxReturnId: "44",
}

RESPONSE:
{
  { questionId: "33",
   text: "Y" },
  { questionId: "34",
   text: "N" }
}
*******************************************************************************/
exports.listAnswers = function (req, res) {
    var id = req.params.id;
    var jsonData = [
        {
            questionId: "33",
            text: "Y"
        },
        {
            questionId: "34",
            text: "N"
        }
    ];

    res.status(200).send(jsonData);
};

/*******************************************************************************
ENDPOINT
POST /tax_return/:id/address

INPUT BODY:
{
  addressLine1:  "34 Wellington Street",
  addressLine2: "Suite 504",
  city: "Toronto",
  province: "Ontario",
  postalCode: "L4D 5D7"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.createAddress = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
POST /tax_return/:id/address

INPUT BODY:
{
  addressLine1:  "34 Wellington Street",
  addressLine2: "Suite 504",
  city: "Toronto",
  province: "Ontario",
  postalCode: "L4D 5D7"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.linkExistingAddress = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
PUT /tax_return/:id/address/:id

INPUT BODY:
{
  addressLine1:  "34 Wellington Street",
  addressLine2: "Suite 504",
  city: "Toronto",
  province: "Ontario",
  postalCode: "L4D 5D7"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.updateAddress = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
GET /tax_return/:id/address/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  addressLine1:  "34 Wellington Street",
  addressLine2: "Suite 504",
  city: "Toronto",
  province: "Ontario",
  postalCode: "L4D 5D7"
}
*******************************************************************************/
exports.findAddressById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      addressLine1:  "34 Wellington Street",
      addressLine2: "Suite 504",
      city: "Toronto",
      province: "Ontario",
      postalCode: "L4D 5D7"
    };

    res.status(200).send(jsonData);
};

/*******************************************************************************
ENDPOINT
POST /tax_return/:id/dependent

INPUT BODY:
{
  taxReturnId:  "44",
  firstName: "Jason",
  lastName: "Chen",
  dateOfBirth: "08/07/1988",
  relationship: "son"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.createAddress = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
POST /tax_return/:id/dependent

INPUT BODY:
{
  taxReturnId:  "44",
  firstName: "Jason",
  lastName: "Chen",
  dateOfBirth: "08/07/1988",
  relationship: "son"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.linkExistingDependent = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
PUT /tax_return/:id/dependent/:id

INPUT BODY:
{
  taxReturnId:  "44",
  firstName: "Jason",
  lastName: "Chen",
  dateOfBirth: "08/07/1988",
  relationship: "son"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.updateDependent = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
GET /tax_return/:id/dependent/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  taxReturnId:  "44",
  firstName: "Jason",
  lastName: "Chen",
  dateOfBirth: "08/07/1988",
  relationship: "son"
}
*******************************************************************************/
exports.findAddressById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      taxReturnId:  "44",
      firstName: "Jason",
      lastName: "Chen",
      dateOfBirth: "08/07/1988",
      relationship: "son"
    };

    res.status(200).send(jsonData);
};


/*******************************************************************************
ENDPOINT
GET /tax_return/:id/checklist

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  name: "T5"
}
*******************************************************************************/
exports.findChecklist = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      name: "Credits"
    };

    res.status(200).send(jsonData);
};

/*******************************************************************************
ENDPOINT
POST /tax_return/:id/document

INPUT BODY:
{
  name: "file.doc",
  url: "taxplan.com/file.doc",
  thumbnail_url: "taxplan.com/filename.jpg"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.createDocument = function (req, res) {
    res.status(200).send('OK');
};

/*******************************************************************************
ENDPOINT
DELETE /tax_return/:id/document/:id

INPUT BODY:
{
  name: "file.doc",
  url: "taxplan.com/file.doc",
  thumbnail_url: "taxplan.com/filename.jpg"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.deleteDocumentById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      name: "file.doc",
      url: "taxplan.com/file.doc",
      thumbnail_url: "taxplan.com/filename.jpg"
    };

    res.status(200).send(jsonData);
};

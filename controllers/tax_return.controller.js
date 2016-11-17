/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
var logger = require('../services/logger.service');
var account = require('../models/account.model');
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
    req.checkBody('accountId', 'Please provide a accountId').notEmpty();
    req.checkBody('productId', 'Please provide a productId').notEmpty();
    req.checkBody('filers', 'Please provide an array of filers').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
      res.status(200).send('OK');
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
}
/*******************************************************************************
ENDPOINT
GET /tax_return/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  accountId: "33",
  statusId: "44"
}
*******************************************************************************/
exports.findTaxReturnById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      accountId: "33",
      statusId: "44"
    };

    res.status(200).send(jsonData);
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
  {addressLine1:  "34 Wellington Street",
  addressLine2: "Suite 504",
  city: "Toronto",
  province: "Ontario",
  postalCode: "L4D 5D7"},
  {addressLine1:  "35 Wellington Street",
  addressLine2: "Suite 505",
  city: "Toronto",
  province: "Ontario",
  postalCode: "L4D 6D7"},

}

RESPONSE:
200 OK
*******************************************************************************/
exports.createAddresses = function (req, res) {
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
GET /tax_return/:id/document/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  name: "file.doc",
  url: "taxplan.com/file.doc",
  thumbnail_url: "taxplan.com/filename.jpg"
}
*******************************************************************************/
exports.findDocumentById = function (req, res) {
    var id = req.params.id;
    var jsonData = {
      name: "file.doc",
      url: "taxplan.com/file.doc",
      thumbnail_url: "taxplan.com/filename.jpg"
    };

    res.status(200).send(jsonData);
};

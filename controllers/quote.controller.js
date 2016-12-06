/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
var config = require('../config/config');
var logger = require('../services/logger.service');
var Document = require('../models/document.model');
var Quote = require('../models/quote.model');
var Product = require('../models/product.model');
var Account = require('../models/account.model');
var TaxReturn = require('../models/tax_return.model');
var Checklist = require('../models/checklist.model');
var validator = require('express-validator');
var util = require('util');
var path = require('path');
var _ = require('underscore');
var thumbnailService = require('../services/thumbnailService');


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
                res.status(404).send({msg: 'Invalid accountID'});
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

/*******************************************************************************
ENDPOINT
POST quote/:id/document
form-data

PARAMS
id:        123                      MANDATORY (QUOTE ID MUST EXIST)

INPUT BODY:
{
  "taxReturnId":    456,              OPTIONAL (ID MUST EXIST if specified)
                                    - to allow for docs not associated with a particular tax return
  "checklistItemId": 70,              OPTIONAL (ID MUST EXIST if specified)
                                    - specify which document this is from the checklist.
                                    - if not specified, additional doc associated with the quote is assumed
  "uploadFileName": {multer object}   MANDATORY
}

RESPONSE:
200 OK
*******************************************************************************/
exports.createDocument = function (req, res) {
    req.checkParams('id', 'Please provide a quote id').isInt();
    req.checkBody('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkBody('checklistItemId', 'Please provide a checklistItemId').isInt();
    // NOTE: multer validates uploadFileName
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {

        logger.debug('req.body = ' + JSON.stringify(req.body, null, 2));
        logger.debug(req.file);

        var quoteId = req.params.id;
        var taxReturnId = req.body.taxReturnId;
        var checklistItemId = req.body.checklistItemId;
        var originalname = req.file.originalname;
        var sourcePath = req.file.path;
        var fileName = path.basename(sourcePath);
        var destPath = config.thumbnail.destPath + '/' + fileName;

        return Quote.checkIdExists(quoteId).then(function(quoteIdExists) {
            return TaxReturn.checkIdExists(taxReturnId).then(function(taxReturnIdExists) {
                return Checklist.checkIdExists(checklistItemId).then(function(checklistItemExists) {
                    if ((quoteId) && (!quoteIdExists)) {
                        res.status(404).send({ msg: 'quoteId not found' });
                        res.end();
                        return;
                    }

                    if ((taxReturnId) && (!taxReturnIdExists)) {
                        res.status(404).send({ msg: 'taxReturnId not found' });
                        res.end();
                        return;
                    }

                    if ((checklistItemId) && (!checklistItemExists)) {
                        res.status(404).send({ msg: 'checklistItemId not found' });
                        res.end();
                        return;
                    }

                    var documentObj = {};
                    documentObj.quoteId = quoteId;
                    documentObj.taxReturnId = taxReturnId;
                    documentObj.checklistItemId = checklistItemId;
                    documentObj.name = originalname;
                    documentObj.url = fileName;
                    documentObj.thumbnailUrl = fileName;
                    return Document.create(documentObj).then(function(insertId) {
                        res.writeHead(200, {'content-type': 'text/plain'});
                        res.write('received upload:\n\n');
                        res.end(util.inspect({
                            quoteId: req.body.quoteId,
                            taxReturnId: req.body.taxReturnId,
                            documentTypeId: req.body.documentTypeId,
                            file: req.file
                        }));
                        return thumbnailService.resize(sourcePath, destPath, config.thumbnail.width);
                    });

                });
            });
        });
    }
};

/*******************************************************************************
ENDPOINT
DELETE /quote/:id/document/:id

Params:
quoteId and documentId

RESPONSE:
200 OK or 404
*******************************************************************************/
exports.deleteDocumentById = function (req, res) {
    req.checkParams('quoteId', 'Please provide an integer quoteId').isInt();
    req.checkParams('documentId', 'Please provide an integer documentId').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var quoteId = req.params.quoteId;
        Document.findById(quoteId).then(function(document) {
            if (document) {
                Document.deleteById(quoteId).then(function() {
                    res.status(200).send('Ok');
                });
            } else {
                res.status(404).send();
            }
        });
    }
};

/*******************************************************************************
ENDPOINT
GET /quote/:id/checklist

Params:
quoteId

RESPONSE:
{
  checklist: [
    {
      checklist_item_id: 93,
      name: "T4A"
      documents: [
      {
        documentId: 4,
        taxReturnId: 1,
        name: "filename.jpg",
        url: "http://localhost/uploads/taxplan.com",
        thumbnailUrl: "http://localhost/thumb/taxplan.jpg"
      },
      {
        documentId: 5,
        taxReturnId: 2,
        name: "filename2.jpg",
        url: "http://localhost/uploads/taxplan.com",
        thumbnailUrl: "http://localhost/thumb/taxplan2.jpg"
      }
    },
    {
      ...
    },
  ],
  additionalDocuments: [ // these have null taxreturnId on the documents table
    {
       documentId: 12,
      name: "filename12.jpg",
      url: "http://localhost/uploads/taxplan.com",
      thumbnailUrl: "http://localhost/thumb/taxplan2.jpg"
    }
  ]
}
*******************************************************************************/

exports.getChecklist = function (req, res) {
    req.checkParams('id', 'Please provide an integer quote id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var id = req.params.id;
        Checklist.getCheckListForQuoteId(id).then(function(checklist) {
            if (checklist) {
                res.status(200).send(checklist);
            } else {
                res.status(404).send();
            }
        });
    }
};

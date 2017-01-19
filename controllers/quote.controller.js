/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
var config = require('../config/config');
var Promise = require('bluebird');
var logger = require('../services/logger.service');
var cacheService = require('../services/cache.service');
var notificationService = require('../services/notification.service');
var Document = require('../models/document.model');
var Quote = require('../models/quote.model');
var Product = require('../models/product.model');
var Account = require('../models/account.model');
var Question = require('../models/question.model');
var Answer = require('../models/answer.model');
var TaxReturn = require('../models/tax_return.model');
var Checklist = require('../models/checklist.model');
var expressValidator = require('express-validator');
var util = require('util');
var path = require('path');
var _ = require('underscore');
var thumbnailService = require('../services/thumbnailService');
var PDFDocument = require('pdfkit');

/*******************************************************************************
ENDPOINT
POST /quote

INPUT BODY:
{
  "accountId": 123,
  "productId": 10,
  "taxReturns": [
    {
      "taxReturnId": 1,
      "answers": [
        {
          "questionId": 116,
          "text": "Yes"
        },
        {
          "questionId": 117,
          "text": "No"
        },
        {
          "questionId": 88,
          "text": "No"
        },
        {
          "questionId": 121,
          "text": "No"
        },
        {
          "questionId": 84,
          "text": "No"
        },
        {
          "questionId": 108,
          "text": "No"
        },
        {
          "questionId": 70,
          "text": "No"
        },
        {
          "questionId": 124,
          "text": "No"
        }
      ]
    },
    {
      "taxReturnId": 2,
      "answers": [
        {
          "questionId": 116,
          "text": "No"
        },
        {
          "questionId": 117,
          "text": "No"
        },
        {
          "questionId": 88,
          "text": "No"
        },
        {
          "questionId": 121,
          "text": "No"
        },
        {
          "questionId": 84,
          "text": "No"
        },
        {
          "questionId": 108,
          "text": "No"
        },
        {
          "questionId": 70,
          "text": "No"
        } ,
        {
          "questionId": 124,
          "text": "No"
        }
      ]
    }
  ]
}

RESPONSE:
200 OK
{
  "accountId": 123,
  "productId": 10,
  "quoteId": 21,
  "lineItems": [
    {
      "taxReturnId": 1,
      "price": 149.95
    },
    {
      "taxReturnId": 2,
      "price": 69.95
    }
  ]
}
 ******************************************************************************/
exports.create = function (req, res) {
    req.checkBody('accountId', 'Please provide a accountId').isInt();
    req.checkBody('productId', 'Please provide a productId').isInt();
    req.checkBody('taxReturns', 'Please provide an taxReturns array').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var accountId = parseInt(req.body.accountId);
        var productId = parseInt(req.body.productId);
        var taxReturns = req.body.taxReturns;

        // check that accountId exists
        return Account.findById(accountId).then(function(account) {
            if ((!account) || (account.length === 0)) {
                res.status(404).send({msg: 'Invalid accountID'});
            } else {
                // check that productId exists
                return Product.findById(productId).then(function(product) {
                    if ((!product) || (product.length === 0)) {
                        res.status(404).send({ msg: 'Invalid productID' });
                    } else {
                        var answerErrors = [];
                        var validateQuestionIdPromises = [];
                        _.forEach(taxReturns, function(taxReturn) {
                            var taxReturnId = taxReturn.taxReturnId;
                            // Validate Answers
                            _.forEach(taxReturn.answers, function(answerObj) {
                                if ((!answerObj.text) ||
                                    ((answerObj.text !== 'No') && (answerObj.text !== 'Yes'))) {
                                      // Invalid text value for answer
                                      var questionId = answerObj.questionId;
                                      answerErrors.push({taxReturnId: taxReturnId,
                                                         questionID: questionId,
                                                         error: 'Invalid text value for answer (questionId = ' + questionId + ')'});
                                }
                            });

                            var validateQuestionId = function(questionId) {
                                return Question.checkIdExists(questionId).then(function(isValid) {
                                    if (!isValid) {
                                        answerErrors.push({taxReturnId: taxReturnId,
                                                           questionID: questionId,
                                                           error: 'questionId = ' + questionId + ' not found on questions table'});
                                    }
                                }).catch(function(err) {
                                    logger.error(err.message);
                                    res.status(500).send({ msg: 'Something broke: check server logs.' });
                                    return;
                                });
                            };
                            _.forEach(taxReturn.answers, function(answerObj) {
                                validateQuestionIdPromises.push(validateQuestionId(answerObj.questionId));
                            });
                        });
                        return Promise.all(validateQuestionIdPromises).then(function(result) {
                            if (answerErrors.length > 0) {
                                res.status(400).send(answerErrors);
                            } else {

                                // save question answers
                                var saveAnswer = function(answerObj) {
                                    return Answer.create(answerObj);
                                };
                                var saveAnswersPromises = [];
                                _.forEach(taxReturns, function(taxReturn) {
                                    _.forEach(taxReturn.answers, function(answerObj) {
                                        var taxReturnId = taxReturn.taxReturnId;
                                        answerObj.taxReturnId = taxReturnId;
                                        saveAnswersPromises.push(saveAnswer(answerObj));
                                    });
                                });
                                return Promise.all(saveAnswersPromises).then(function(result) {
                                    var quoteObj = {};
                                    quoteObj.accountId = accountId;
                                    quoteObj.productId = productId;
                                    quoteObj.quoteId = 0; // initialize to 0 (aka 'undefined')
                                    quoteObj.totalPrice = 0;
                                    quoteObj.lineItems = [];
                                    _.forEach(taxReturns, function(taxReturn) {
                                        var tmpLineItemObj = {};
                                        tmpLineItemObj.taxReturnId = taxReturn.taxReturnId;
                                        tmpLineItemObj.price = calculatePrice(taxReturn.answers);
                                        quoteObj.lineItems.push(tmpLineItemObj);
                                    });

                                    return Quote.create(quoteObj).then(function(quoteId) {
                                        quoteObj.quoteId = quoteId;
                                        _.forEach(quoteObj.lineItems, function(lineItem) {
                                            quoteObj.totalPrice = quoteObj.totalPrice + lineItem.price;
                                        });
                                        quoteObj.totalPrice = Math.round(quoteObj.totalPrice * 100) / 100;
                                        res.status(200).json(quoteObj);
                                    }).catch(function(err) {
                                        logger.error(err.message);
                                        res.status(500).send({ msg: 'Something broke: check server logs.' });
                                        return;
                                    });
                                }).catch(function(err) {
                                    logger.error(err.message);
                                    res.status(500).send({ msg: 'Something broke: check server logs.' });
                                    return;
                                });
                            }
                        }).catch(function(err) {
                            logger.error(err.message);
                            res.status(500).send({ msg: 'Something broke: check server logs.' });
                            return;
                        });
                    }
                }).catch(function(err) {
                    logger.error(err.message);
                    res.status(500).send({ msg: 'Something broke: check server logs.' });
                    return;
                });
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

var calculatePrice = function(answers) {
    var isSelfEmployed = false;
    var hasRentalProperty = false;
    var isPostSecondaryStudent = false;
    var hasCapitalGains = false;
    var hasMovingOrMedicalExpenses = false;
    var hasEmploymentRelatedExpenses = false;
    var isImmigrantOrEmigrant = false;
    var NoneOfTheAbove = false;

    var selfEmployedId = 1000;
    var rentalPropertyId = 1001;
    var postSecondaryStudentId = 1002;
    var capitalGainsId = 1003;
    var MovingOrMedicalExpensesId = 1004;
    var EmploymentRelatedExpensesId = 1005;
    var ImmigrantEmigrantId = 1006;
    var NoneOfTheAboveId = 1007;

    _.forEach(answers, function(answerObj) {
        if ((answerObj.questionId === selfEmployedId) && (answerObj.text === 'Yes')) {
            isSelfEmployed = true;
        }
        if ((answerObj.questionId === rentalPropertyId) && (answerObj.text === 'Yes')) {
            hasRentalProperty = true;
        }
        if ((answerObj.questionId === postSecondaryStudentId) && (answerObj.text === 'Yes')) {
            isPostSecondaryStudent = true;
        }
        if ((answerObj.questionId === capitalGainsId) && (answerObj.text === 'Yes')) {
            hasCapitalGains = true;
        }
        if ((answerObj.questionId === MovingOrMedicalExpensesId) && (answerObj.text === 'Yes')) {
            hasMovingOrMedicalExpenses = true;
        }
        if ((answerObj.questionId === EmploymentRelatedExpensesId) && (answerObj.text === 'Yes')) {
            hasEmploymentRelatedExpenses = true;
        }
        if ((answerObj.questionId === ImmigrantEmigrantId) && (answerObj.text === 'Yes')) {
            isImmigrantOrEmigrant = true;
        }
        if ((answerObj.questionId === NoneOfTheAboveId) && (answerObj.text === 'Yes')) {
            NoneOfTheAbove = true;
        }
    });

    var price = 69.95; // default price is the same as if "None Apply" was selected
    if ((isSelfEmployed) || (hasRentalProperty)) {
        price = 149.95;
    } else {
        if ((hasCapitalGains) ||
            (hasMovingOrMedicalExpenses) ||
            (hasEmploymentRelatedExpenses) ||
            (isImmigrantOrEmigrant)) {
            price = 89.95;
        } else {
            if (NoneOfTheAbove) {
                price = 69.99;
            } else {
                if (isPostSecondaryStudent) {
                    price = 0.00;
                }
            }
        }
    }

    return price;
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
    req.checkBody('accountId', 'Please provide an integer accountId').isInt();
    req.checkBody('productId', 'Please provide an integer productId').isInt();
    req.checkParams('id', 'Please provide a quoteId').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var accountId = parseInt(req.body.accountId);
        var productId = parseInt(req.body.productId);
        var quoteId = parseInt(req.params.id);

        if (accountId !== req.user.account_id) {
            res.status(401).send();
            return;
        }

        // check that accountId exists
        return Account.findById(accountId).then(function(account) {
            if ((!account) || (account.length === 0)) {
                res.status(404).send({ msg: 'Invalid accountID' });
            } else {
                // check that productId exists
                return Product.findById(productId).then(function(product) {
                    if ((!product) || (product.length === 0)) {
                        res.status(404).send({ msg: 'Invalid productID' });
                    } else {
                        return TaxReturn.setAllsubmittedForAccountId(accountId, productId).then(function() {
                            var data = {};
                            data.name = req.user.first_name;
                            notificationService.sendNotification(notificationService.NotificationType.TAX_RETURN_SUBMITTED, req.user, data).then(function() {
                                res.status(200).send();
                            });
                        }).catch(function(err) {
                            logger.error(err.message);
                            res.status(500).send({ msg: 'Something broke: check server logs.' });
                            return;
                        });
                    }
                }).catch(function(err) {
                    logger.error(err.message);
                    res.status(500).send({ msg: 'Something broke: check server logs.' });
                    return;
                });
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
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
        var id = parseInt(req.params.id);
        return Quote.findById(id).then(function(quote) {
            if (quote) {
                res.status(200).send(quote);
            } else {
                res.status(404).send();
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
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
    req.checkParams('id', 'Please provide an integer quote id').isInt();
    req.checkBody('checklistItemId', 'Please provide an integer checklistItemId').isInt();
    if (req.body.taxReturnId) {
        req.checkBody('taxReturnId', 'Please provide an integer taxReturnId').isInt();
    }
    // NOTE: multer validates uploadFileName
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {

        logger.debug('req.body = ' + JSON.stringify(req.body, null, 2));
        logger.debug(req.file);

        var quoteId = parseInt(req.params.id);
        var taxReturnId = parseInt(req.body.taxReturnId);
        var checklistItemId = parseInt(req.body.checklistItemId);
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
                    if (taxReturnId) {
                        documentObj.taxReturnId = taxReturnId;
                    }
                    documentObj.checklistItemId = checklistItemId;
                    documentObj.name = originalname;
                    documentObj.url = fileName;
                    documentObj.thumbnailUrl = fileName;
                    return Document.create(documentObj).then(function(insertId) {
                        res.writeHead(200, {'content-type': 'text/plain'});
                        res.write('received upload:\n\n');
                        if ((taxReturnId) && (taxReturnId.length > 0)) {
                            res.end(util.inspect({
                                quoteId: quoteId,
                                taxReturnId: taxReturnId,
                                checklistItemId: checklistItemId,
                                file: req.file
                            }));
                        } else {
                            res.end(util.inspect({
                                quoteId: quoteId,
                                checklistItemId: checklistItemId,
                                file: req.file
                            }));
                        }
                        return thumbnailService.resize(sourcePath, destPath, config.thumbnail.width);
                    }).catch(function(err) {
                        logger.error(err.message);
                        res.status(500).send({ msg: 'Something broke: check server logs.' });
                        return;
                    });
                }).catch(function(err) {
                    logger.error(err.message);
                    res.status(500).send({ msg: 'Something broke: check server logs.' });
                    return;
                });
            }).catch(function(err) {
                logger.error(err.message);
                res.status(500).send({ msg: 'Something broke: check server logs.' });
                return;
            });
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
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
        var quoteId = parseInt(req.params.quoteId);
        var documentId = parseInt(req.params.documentId);
        return Document.findById(documentId).then(function(document) {
            if (document) {
                return Document.deleteById(quoteId, documentId).then(function() {
                    res.status(200).send('Ok');
                }).catch(function(err) {
                    logger.error(err.message);
                    res.status(500).send({ msg: 'Something broke: check server logs.' });
                    return;
                });
            } else {
                res.status(404).send();
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

/*******************************************************************************
ENDPOINT
GET /quote/:id/checklist

PARAMS
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
        var id = parseInt(req.params.id);
        return Checklist.getCheckListForQuoteId(id).then(function(checklist) {
            if (checklist) {
                res.status(200).send(checklist);
            } else {
                res.status(404).send();
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

/*******************************************************************************
ENDPOINT
GET /quote/:id/checklist/PDF

PARAMS
quoteId

RESPONSE:
Streamed PDF document

*******************************************************************************/
exports.getChecklistPDF = function(req, res) {
    req.checkParams('id', 'Please provide an integer quote id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var id = parseInt(req.params.id);
        return Checklist.getCheckListForQuoteId(id).then(function(checklist) {
            if (checklist) {
                var doc = new PDFDocument({
                    Title: 'Export'
                });

                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Access-Control-Allow-Origin': '*',
                    'Content-Disposition': 'attachment; filename=checklist.pdf'
                });

                doc.pipe(res);
                doc.fontSize(14);
                doc.moveDown();
                doc.text('My TAXitem Checklist', {align: 'center'});
                doc.moveDown();
                doc.fontSize(12);
                doc.text('This checklist is a guide based on the answers from your TAXprofile.  If there are other items you feel are relevant please send them as well.  You can upload and send us the items that apply to you by attaching them along with a comment on My Dasboard.');
                doc.moveDown();
                var indent = doc.x + 20;

                _.forEach(checklist.checklistitems, function(item) {
                    doc.fontSize(12);
                    var r = Math.round((doc._font.ascender / 1000 * doc._fontSize) / 3);
                    doc.rect(indent + r - 20, doc.y, 10, 10).stroke();
                    doc.text(item.name, indent);
                    doc.fontSize(10);
                    _.forEach(item.filers, function(filer) {
                        var fullname = filer.first_name + ' ' + filer.last_name;
                        doc.text(fullname);
                        doc.moveDown();
                    });

                    doc.moveDown();
                });


                doc.end();
            } else {
                res.status(404).send();
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

exports.findByAccountId = function(req, res) {
    req.checkParams('productId', 'Please provide a product id').isInt();
    req.checkParams('accountId', 'Please provide a account id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var productId = parseInt(req.params.productId);
        var accountId = parseInt(req.params.accountId);
        return Quote.findByProductIdAccountId(productId, accountId).then(function(account) {
            if (account) {
                res.status(200).send(account);
            } else {
                res.status(404).send();
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

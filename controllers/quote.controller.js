/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var config = require('../config/config');
var Promise = require('bluebird');
var expressValidator = require('express-validator');
var util = require('util');
var path = require('path');
var _ = require('underscore');
var PDFDocument = require('pdfkit');
var documentModel = require('../models/document.model');
var quoteModel = require('../models/quote.model');
var productModel = require('../models/product.model');
var accountModel = require('../models/account.model');
var userModel = require('../models/user.model');
var questionModel = require('../models/question.model');
var answerModel = require('../models/answer.model');
var taxReturnModel = require('../models/tax_return.model');
var checklistModel = require('../models/checklist.model');
var packageModel = require('../models/package.model');
var logger = require('../services/logger.service');
var cacheService = require('../services/cache.service');
var notificationService = require('../services/notification.service');
var thumbnailService = require('../services/thumbnailService');
var stringHelper = require('../helpers/stringHelper');

var SMALL_BUSINESS_PACKAGE_ID = 1;
var LANDLORD_PACKAGE_ID = 2;
var COMPLEX_CASE_PACKAGE_ID = 3;
var TYPICAL_PACKAGE_ID = 5;
var STUDENT_PACKAGE_ID = 6;
var SMALL_BUSINESS_PLUS_LANDLORD_PACKAGE_ID = 7;



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
exports.create = function (req, res, next) {
    req.checkBody('accountId', 'Please provide a accountId').isInt();
    req.checkBody('productId', 'Please provide a productId').isInt();
    req.checkBody('taxReturns', 'Please provide an taxReturns array').notEmpty();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var accountId = parseInt(req.body.accountId);
    var productId = parseInt(req.body.productId);
    var taxReturnsArr = req.body.taxReturns;

    // check that accountId exists
    return accountModel.findById(accountId).then(function(accountObj) {
        if ((!accountObj) || (accountObj.length === 0)) {
            return res.status(404).send({msg: 'Invalid account id'});
        }
        // check that productId exists
        return productModel.findById(productId).then(function(productObj) {
            if ((!productObj) || (productObj.length === 0)) {
                return res.status(404).send({ msg: 'Invalid product id' });
            }
            var answerErrors = [];
            var validateQuestionIdPromises = [];
            _.forEach(taxReturnsArr, function(taxReturnObj) {
                var taxReturnId = taxReturnObj.taxReturnId;
                // Validate Answers
                _.forEach(taxReturnObj.answers, function(answerObj) {
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
                    return questionModel.checkIdExists(questionId).then(function(isValid) {
                        if (!isValid) {
                            answerErrors.push({taxReturnId: taxReturnId,
                                               questionID: questionId,
                                               error: 'questionId = ' + questionId + ' not found on questions table'});
                        }
                    }).catch(function(err) {
                        next(err);
                    });
                };
                _.forEach(taxReturnObj.answers, function(answerObj) {
                    validateQuestionIdPromises.push(validateQuestionId(answerObj.questionId));
                });
            });
            return Promise.all(validateQuestionIdPromises).then(function(result) {
                if (answerErrors.length > 0) {
                    return res.status(400).send(answerErrors);
                }

                // save question answers
                var saveAnswer = function(answerObj) {
                    return answerModel.create(answerObj);
                };
                var saveAnswersPromises = [];
                _.forEach(taxReturnsArr, function(taxReturnObj) {
                    _.forEach(taxReturnObj.answers, function(answerObj) {
                        var taxReturnId = taxReturnObj.taxReturnId;
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
                    var getPackagePromises = [];



                    _.forEach(taxReturnsArr, function(taxReturnObj) {
                        var tmpLineItemObj = {};
                        tmpLineItemObj.taxReturnId = taxReturnObj.taxReturnId;
                        tmpLineItemObj.packageId = getPackageId(taxReturnObj.answers);
                        getPackagePromises.push(packageModel.findById(tmpLineItemObj.packageId));
                        quoteObj.lineItems.push(tmpLineItemObj);
                    });

                    return Promise.all(getPackagePromises).then(function(packageResultsArr) {
                        _.forEach(packageResultsArr, function(packageResultObj) {
                            var lineItemArr = _.where(quoteObj.lineItems, {packageId: packageResultObj.id});
                            _.forEach(lineItemArr, function(lineItemObj) {
                                lineItemObj.price = packageResultObj.price;
                                lineItemObj.name = stringHelper.cleanString(packageResultObj.name);
                                lineItemObj.description = stringHelper.cleanString(packageResultObj.description);
                                lineItemObj.notes = stringHelper.cleanString(packageResultObj.notes);
                                if (!lineItemObj.notes) {
                                    lineItemObj.notes = ''; // fix undefined
                                }
                            });
                        });


                        return quoteModel.create(quoteObj).then(function(quoteId) {
                            quoteObj.quoteId = quoteId;
                            _.forEach(quoteObj.lineItems, function(lineItemObj) {
                                quoteObj.totalPrice = quoteObj.totalPrice + lineItemObj.price;
                            });
                            quoteObj.totalPrice = (Math.round(quoteObj.totalPrice * 100) / 100).toFixed(2);
                            return res.status(200).json(quoteObj);
                        }).catch(function(err) {
                            next(err);
                        });
                    }).catch(function(err) {
                        next(err);
                    });
                }).catch(function(err) {
                    next(err);
                });
            }).catch(function(err) {
                next(err);
            });
        }).catch(function(err) {
            next(err);
        });
    }).catch(function(err) {
        next(err);
    });
};

var getPackageId = function(answers) {
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

    var packageId = TYPICAL_PACKAGE_ID; // default packageId
    if ((isSelfEmployed) &&
        (hasRentalProperty)) {
        packageId = SMALL_BUSINESS_PLUS_LANDLORD_PACKAGE_ID;
    } else {
        if (isSelfEmployed) {
            packageId = SMALL_BUSINESS_PACKAGE_ID;
        } else {
            if (hasRentalProperty) {
                packageId = LANDLORD_PACKAGE_ID;
            } else {
                if ((hasCapitalGains) ||
                    (hasMovingOrMedicalExpenses) ||
                    (hasEmploymentRelatedExpenses) ||
                    (isImmigrantOrEmigrant)) {
                    packageId = COMPLEX_CASE_PACKAGE_ID;
                } else {
                    if (NoneOfTheAbove) {
                        packageId = TYPICAL_PACKAGE_ID;
                    } else {
                        if (isPostSecondaryStudent) {
                            packageId = STUDENT_PACKAGE_ID;
                        }
                    }
                }
            }
        }
    }

    return packageId;
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
exports.submit = function (req, res, next) {
    req.checkBody('accountId', 'Please provide an integer accountId').isInt();
    req.checkBody('productId', 'Please provide an integer productId').isInt();
    req.checkParams('id', 'Please provide a quoteId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var accountId = parseInt(req.body.accountId);
    var productId = parseInt(req.body.productId);
    var quoteId = parseInt(req.params.id);
    return quoteModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        // check that accountId exists
        return accountModel.findById(accountId).then(function(accountObj) {
            if ((!accountObj) || (accountObj.length === 0)) {
                return res.status(404).send({ msg: 'Invalid accountID' });
            }
            // check that productId exists
            return productModel.findById(productId).then(function(productObj) {
                if ((!productObj) || (productObj.length === 0)) {
                    return res.status(404).send({ msg: 'Invalid productID' });
                }
                return taxReturnModel.setAllsubmittedForAccountId(accountId, productId).then(function() {
                    var data = {};
                    data.name = req.user.first_name;
                    return notificationService.sendNotification(req.user, notificationService.NotificationType.TAX_RETURN_SUBMITTED, data).then(function() {
                        res.status(200).send();

                        // update the last User activity of the logged in user
                        userModel.updateLastUserActivity(req.user);
                    });
                }).catch(function(err) {
                    next(err);
                });
            }).catch(function(err) {
                next(err);
            });
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.findById = function (req, res, next) {
    req.checkParams('id', 'Please provide a quoteId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var quoteId = parseInt(req.params.id);
    return quoteModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return quoteModel.findById(quoteId).then(function(quoteQbj) {
            if (!quoteQbj) {
                return res.status(404).send();
            }
            return res.status(200).send(quoteQbj);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.createDocument = function (req, res, next) {
    req.checkParams('id', 'Please provide an integer quote id').isInt();
    req.checkBody('checklistItemId', 'Please provide an integer checklistItemId').isInt();
    if (req.body.taxReturnId) {
        req.checkBody('taxReturnId', 'Please provide an integer taxReturnId').isInt();
    }
    // NOTE: multer validates uploadFileName
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    logger.debug('req.body = ' + JSON.stringify(req.body, null, 2));
    logger.debug(req.file);

    var quoteId = parseInt(req.params.id);
    return quoteModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        var taxReturnId = parseInt(req.body.taxReturnId);
        var checklistItemId = parseInt(req.body.checklistItemId);
        var originalname = req.file.originalname;
        var sourcePath = req.file.path;
        var fileName = path.basename(sourcePath);
        var destPath = config.thumbnail.destPath + '/' + fileName;

        return quoteModel.checkIdExists(quoteId).then(function(quoteIdExists) {
            return taxReturnModel.checkIdExists(taxReturnId).then(function(taxReturnIdExists) {
                return checklistModel.checkIdExists(checklistItemId).then(function(checklistItemExists) {
                    if ((quoteId) && (!quoteIdExists)) {
                        return res.status(404).send({ msg: 'quoteId not found' });
                    }

                    if ((taxReturnId) && (!taxReturnIdExists)) {
                        return res.status(404).send({ msg: 'taxReturnId not found' });
                    }

                    if ((checklistItemId) && (!checklistItemExists)) {
                        return res.status(404).send({ msg: 'checklistItemId not found' });
                    }

                    var documentObj = {};
                    documentObj.quoteId = quoteId;
                    if (taxReturnId) {
                        documentObj.taxReturnId = taxReturnId;
                    }
                    documentObj.checklistItemId = checklistItemId;
                    documentObj.name = originalname;
                    documentObj.url = fileName;
                    return identifyFormatPromise(sourcePath).then(function(thumbFileName) {
                        documentObj.thumbnailUrl = thumbFileName;
                        return documentModel.create(documentObj).then(function(insertId) {
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

                            // update the last User activity of the logged in user
                            userModel.updateLastUserActivity(req.user);

                            if (thumbFileName !== config.thumbnail.defaultDocIconFileName) {
                                thumbnailService.resize(sourcePath, destPath, config.thumbnail.width);
                            } else {
                                return Promise.resolve();
                            }
                        }).catch(function(err) {
                            next(err);
                        });
                    }).catch(function(err) {
                        next(err);
                    });
                }).catch(function(err) {
                    next(err);
                });
            }).catch(function(err) {
                next(err);
            });
        }).catch(function(err) {
            next(err);
        });
    });
};

var identifyFormatPromise = function(sourcePath) {
    return thumbnailService.identify(sourcePath).then(function() {
        return path.basename(sourcePath);
    }).catch(function(err) {
        return config.thumbnail.defaultDocIconFileName;
    });
}

/*******************************************************************************
ENDPOINT
DELETE /quote/:id/document/:id

Params:
quoteId and documentId

RESPONSE:
200 OK or 404
*******************************************************************************/
exports.deleteDocumentById = function (req, res, next) {
    req.checkParams('quoteId', 'Please provide an integer quoteId').isInt();
    req.checkParams('documentId', 'Please provide an integer documentId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var quoteId = parseInt(req.params.quoteId);
    return quoteModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        var documentId = parseInt(req.params.documentId);
        return documentModel.findById(documentId).then(function(documentObj) {
            if (!documentObj) {
                return res.status(404).send();
            }
            return documentModel.deleteById(quoteId, documentId).then(function() {
                res.status(200).send('Ok');

                // update the last User activity of the logged in user
                userModel.updateLastUserActivity(req.user);
            }).catch(function(err) {
                next(err);
            });
        }).catch(function(err) {
            next(err);
        });
    });
};

/*******************************************************************************
ENDPOINT
GET /quote/:quoteId/document/documentId

PARAMS
quoteId
documentId

RESPONSE:
Streamed document

*******************************************************************************/
exports.getDocumentById = function(req, res, next) {
    req.checkParams('quoteId', 'Please provide a quoteId').isInt();
    req.checkParams('documentId', 'Please provide a documentId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var quoteId = parseInt(req.params.quoteId);
    var documentId = parseInt(req.params.documentId);
    return quoteModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        return documentModel.findById(documentId).then(function(documentObj) {
            var file = config.uploadDir + '/' + documentObj.url;
            return res.download(file, documentObj.name); // Set disposition and send it
        }).catch(function(err) {
            next(err);
        });
    });
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

exports.getChecklist = function (req, res, next) {
    req.checkParams('id', 'Please provide an integer quote id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var quoteId = parseInt(req.params.id);
    return quoteModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return checklistModel.getCheckListForQuoteId(quoteId).then(function(checklistObj) {
            if (!checklistObj) {
                return res.status(404).send();
            }
           checklistObj.name = stringHelper.cleanString(checklistObj.name);
           checklistObj.title = stringHelper.cleanString(checklistObj.title);
           checklistObj.subtitle = stringHelper.cleanString(checklistObj.subtitle);
           checklistObj.description = stringHelper.cleanString(checklistObj.description);

           return res.status(200).send(checklistObj);
        }).catch(function(err) {
            next(err);
        });
    });
};

/*******************************************************************************
ENDPOINT
GET /quote/:id/checklist/PDF

PARAMS
quoteId

RESPONSE:
Streamed PDF document

*******************************************************************************/
exports.getChecklistPDF = function(req, res, next) {
    req.checkParams('id', 'Please provide an integer quote id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var quoteId = parseInt(req.params.id);
    return quoteModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        return checklistModel.getCheckListForQuoteId(quoteId).then(function(checklistObj) {
            if (!checklistObj) {
                return res.status(404).send();
            }
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
            doc.text('This checklist is a guide that may apply to you based on your answers from TAXplan. If there are other items you wish to add, please upload them to ADDITIONAL DOCUMENTS.');
            doc.moveDown();
            var indent = doc.x + 20;

            _.forEach(checklistObj.checklistitems, function(itemObj) {
                doc.fontSize(12);
                var r = Math.round((doc._font.ascender / 1000 * doc._fontSize) / 3);
                doc.rect(indent + r - 20, doc.y, 10, 10).stroke();
                doc.text(itemObj.name, indent);
                doc.fontSize(10);
                _.forEach(itemObj.filers, function(filerObj) {
                    var fullname = filerObj.first_name + ' ' + filerObj.last_name;
                    doc.text(fullname);
                    doc.moveDown();
                });

                doc.moveDown();
            });


            doc.end();
        }).catch(function(err) {
            next(err);
        });
    });
};

exports.findByAccountId = function(req, res, next) {
    req.checkParams('productId', 'Please provide a product id').isInt();
    req.checkParams('accountId', 'Please provide a account id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var productId = parseInt(req.params.productId);
    var accountId = parseInt(req.params.accountId);
    return accountModel.hasAccess(req.user, accountId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return quoteModel.findByProductIdAccountId(productId, accountId).then(function(accountObj) {
            if (!accountObj) {
                return res.status(404).send();
            }
            return res.status(200).send(accountObj);
        }).catch(function(err) {
            next(err);
        });
    });
};


exports.setDocumentAsViewed = function(req, res, next) {
    req.checkParams('quoteId', 'Please provide a product id').isInt();
    req.checkParams('documentId', 'Please provide a account id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    if(!userModel.isAdmin(req.user) && !userModel.isTaxpro(req.user)) {
        return res.status(403).send();
    }

    var quoteId = parseInt(req.params.quoteId);
    var documentId = parseInt(req.params.documentId);
    return documentModel.setDocumentAsViewedById(quoteId, documentId)
      .then(function(accountObj) {
        if(!accountObj) {
          return res.status(404).send();
        }

        return res.status(200).send(accountObj);
      }).catch(function(err) {
        next(err);
      });
};

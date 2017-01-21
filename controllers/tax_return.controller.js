/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
var logger = require('../services/logger.service');
var TaxReturn = require('../models/tax_return.model');
var Account = require('../models/account.model');
var User = require('../models/user.model');
var Product = require('../models/product.model');
var Question = require('../models/question.model');
var Answer = require('../models/answer.model');
var Address = require('../models/address.model');
var Dependant = require('../models/dependant.model');
var Document = require('../models/document.model');
var validator = require('express-validator');
var cacheService = require('../services/cache.service');
var Promise = require('bluebird');
var User = require('../models/user.model');
var util = require('util');

// boilerplate
var _ = require('underscore');
var moment = require('moment');
var config = require('../config/config');
var API_DATE_INPUT_FORMAT = config.api.dateInputFormat;

/*******************************************************************************
 ENDPOINT
 POST /tax_returns

 INPUT BODY:
 {
   taxReturns: [
     {
       "accountId": 8,                      MANDATORY
       "productId": 1,                      MANDATORY
       "firstName": "Carmela"               MANDATORY
     },
     {
       "accountId": 8,                      MANDATORY
       "productId": 1,                      MANDATORY
       "firstName": "Pier"                  MANDATORY
     }
   ]
 }

 RESPONSE:
 200 OK
 [
   {
     "taxReturnId": 101
   },
   {
     "taxReturnId": 102
   }
 ]

 ******************************************************************************/
exports.createTaxReturns = function (req, res) {
    req.checkBody('taxReturns', 'Please provide array of taxReturns').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var createTaxReturnPromise = function(taxReturn) {
            var accountId = parseInt(taxReturn.accountId);
            var productId = parseInt(taxReturn.productId);
            var firstName = taxReturn.firstName;
            var filerType = taxReturn.filerType;
            var status = taxReturn.status;
            var sin = taxReturn.sin;
            var prefix = taxReturn.prefix;
            var middleInitial = taxReturn.middleInitial;

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
                            var taxReturnObj = {};
                            taxReturnObj.accountId = accountId;
                            taxReturnObj.productId = productId;
                            taxReturnObj.firstName = firstName;
                            taxReturnObj.filerType = filerType;
                            taxReturnObj.status = status;
                            taxReturnObj.sin = sin;
                            taxReturnObj.prefix = prefix;
                            taxReturnObj.middleInitial = middleInitial;

                            return TaxReturn.create(taxReturnObj).then(function(taxReturnId) {
                                var resultObj = {};
                                resultObj.accountId = accountId;
                                resultObj.productId = productId;
                                resultObj.taxReturnId = taxReturnId;
                                resultObj.filerType = filerType;
                                resultObj.status = status;
                                resultObj.sin = sin;
                                resultObj.prefix = prefix;
                                resultObj.middleInitial = middleInitial;
                                return Promise.resolve(resultObj);
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
        };


        var resultArr = [];
        var createTaxReturnPromises = [];
        var accessDenied = false;
        _.forEach(req.body.taxReturns, function(taxReturn) {
            createTaxReturnPromises.push(createTaxReturnPromise(taxReturn));
        });
        if (accessDenied) {
            res.status(403).send();
            return;
        }

        return Promise.each(createTaxReturnPromises, function(taxReturnResult) {
            resultArr.push(taxReturnResult);
        }).catch(function(err) {
            logger.error(err.stack);
            res.status(400).send({ msg: 'create tax return failed' });
            return Promise.resolve({});
        }).then(function() {
            res.status(200).json(resultArr);

            // update the last User activity of the logged in user
            User.updateLastUserActivity(req.user);
        });
    }
};

/*******************************************************************************
 ENDPOINT
 POST /tax_return

 INPUT BODY:
 {
   "accountId": 8,                      MANDATORY
   "productId": 1,                      MANDATORY
   "firstName": "Carmela"               MANDATORY
 }

 RESPONSE:
 200 OK
 {
   "taxReturnId": 101
 }
 ******************************************************************************/
exports.createTaxReturn = function (req, res) {
    req.checkBody('accountId', 'Please provide a accountId').isInt();
    req.checkBody('productId', 'Please provide a productId').isInt();
    req.checkBody('firstName', 'Please provide a firstName').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var accountId = parseInt(req.body.accountId);
        var productId = parseInt(req.body.productId);
        var firstName = req.body.firstName;
        var filerType = req.body.filerType;
        var status = req.body.status;
        var sin = req.body.sin;
        var prefix = req.body.prefix;
        var middleInitial = req.body.middleInitial;

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
                        var taxReturnObj = {};
                        taxReturnObj.accountId = accountId;
                        taxReturnObj.productId = productId;
                        taxReturnObj.firstName = firstName;
                        taxReturnObj.filerType = filerType;
                        taxReturnObj.status = status;
                        taxReturnObj.sin = sin;
                        taxReturnObj.prefix = prefix;
                        taxReturnObj.middleInitial = middleInitial;

                        return TaxReturn.create(taxReturnObj).then(function(taxReturnId) {
                            var resultObj = {};
                            resultObj.accountId = accountId;
                            resultObj.productId = productId;
                            resultObj.taxReturnId = taxReturnId;
                            resultObj.filerType = filerType;
                            resultObj.status = status;
                            resultObj.sin = sin;
                            resultObj.prefix = prefix;
                            resultObj.middleInitial = middleInitial;

                            res.status(200).json(resultObj);

                            // update the last User activity of the logged in user
                            User.updateLastUserActivity(req.user);

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
 PUT /tax_return/:id

 Params:
 taxReturnId

 INPUT BODY:
 {
   "accountId":  1,                            Mandatory
   "productId":  70,                           Mandatory
   "firstName": "Jason",                       Optional
   "lastName": "Chen",                         Optional
   "provinceOfResidence": "Ontario",           Optional
   "dateOfBirth": "08/23/1988",                Optional
   "canadianCitizen": "Y",                     Optional
   "authorizeCra": "Y"                         Optional
 }

 RESPONSE:
 200 OK

 NOTE:
 At least one optional field must be present or there would be nothing to update
 ******************************************************************************/
exports.updateTaxReturnById = function (req, res) {
    if (!User.hasAccess(req.user, req.body.accountId)) {
        res.status(403).send();
        return;
    }
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var taxReturnId = parseInt(req.params.id);
        var accountId = req.body.accountId;
        var productId = req.body.productId;
        var taxReturnObj = {};

        if ((!req.body.firstName) &&
            (!req.body.lastName) &&
            (!req.body.provinceOfResidence) &&
            (!req.body.dateOfBirth) &&
            (!req.body.canadianCitizen) &&
            (!req.body.authorizeCra) &&
            (!req.body.filerType) &&
            (!req.body.status) &&
            (!req.body.sin) &&
            (!req.body.prefix) &&
            (!req.body.middleInitial)
        ) {
            res.status(400).send({ msg: 'Invalid request: no fields specified for update?' });
        } else {
          if (req.body.firstName) { taxReturnObj.first_name = req.body.firstName; }
          if (req.body.lastName) { taxReturnObj.last_name = req.body.lastName; }
          if (req.body.provinceOfResidence) { taxReturnObj.province_of_residence = req.body.provinceOfResidence; }
          if (req.body.dateOfBirth) { taxReturnObj.date_of_birth = req.body.dateOfBirth; }
          if (req.body.canadianCitizen) { taxReturnObj.canadian_citizen = req.body.canadianCitizen; }
          if (req.body.authorizeCra) { taxReturnObj.authorize_cra = req.body.authorizeCra; }
          if (req.body.filerType) { taxReturnObj.filer_type = req.body.filerType; }
          if (req.body.status) {taxReturnObj.status = req.body.status; }
          if (req.body.middleInitial) {taxReturnObj.middle_initial = req.body.middleInitial; }
          if (req.body.sin) {taxReturnObj.SIN = req.body.sin; }
          if (req.body.prefix) {taxReturnObj.prefix = req.body.prefix; }

          return TaxReturn.update(taxReturnId, taxReturnObj)
            .then(function(taxReturnId) {
              return TaxReturn.findById(taxReturnId);
            })
            .then(function(taxReturn) {
              if (taxReturn) {
                res.status(200).send(taxReturn);

                // update the last User activity of the logged in user
                User.updateLastUserActivity(req.user);
              } else {
                res.status(404).send();
              }
            }).catch(function(err) {
                logger.error(err.message);
                res.status(500).send({ msg: 'Something broke: check server logs.' });
                return;
            });
        }
    }
};

/*******************************************************************************
 ENDPOINT
 PUT /tax_return/:id/status

 Params:
 taxReturnId

 INPUT BODY:
 {
   "statusId":  1                            Mandatory
 }

 RESPONSE:
 200 OK

 ******************************************************************************/
exports.updateTaxReturnStatusById = function (req, res) {
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    req.checkBody('statusId', 'Please provide a status id').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        const taxReturnId = parseInt(req.params.id),
            taxReturnObj = {
                status_id: parseInt(req.body.statusId)
            };
        return TaxReturn.update(taxReturnId, taxReturnObj).then(function() {
            res.status(200).send('OK');

            // update the last User activity of the logged in user
            User.updateLastUserActivity(req.user);
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

/*******************************************************************************
 ENDPOINT
 GET /tax_return/:id

 Params:
 taxReturnId

 RESPONSE:
 {
   "accountId":  1,                            Mandatory
   "productId":  70,                           Mandatory
   "firstName": "Jason",                       Optional
   "lastName": "Chen",                         Optional
   "provinceOfResidence": "Ontario",           Optional
   "dateOfBirth": "08/23/1988",                Optional
   "canadianCitizen": "Y",                     Optional
   "authorizeCra": "Y"                         Optional
 }
 *******************************************************************************/
exports.findTaxReturnById = function (req, res) {
    req.checkParams('id', 'Please provide a taxReturnId').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var id = parseInt(req.params.id);
        return TaxReturn.findById(id).then(function(taxReturn) {
            if (taxReturn) {
                res.status(200).send(taxReturn);
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
 POST /tax_return/:id/answers

 Params:
 taxReturnId

 INPUT BODY:
 {
   "answers" :
   [
   {
     "questionId":  70,
     "text": "Yes"
   },
   {
     "questionId":  71,
     "text": "Yes"
   }
   ]
 }

 RESPONSE:
 200 OK
 *******************************************************************************/
exports.createAnswer = function(req, res) {
    req.checkBody('answers', 'Please provide a list of answers').notEmpty();
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var taxReturnId = parseInt(req.params.id);
        var answers = req.body.answers;
        // check that taxReturnId exists
        return TaxReturn.findById(taxReturnId).then(function(taxReturn) {
            if ((!taxReturn) || (taxReturn.length === 0)) {
                res.status(404).send({msg: 'Invalid taxReturnId'});
            } else {
                return cacheService.get('values', Answer.populateValues()).then(function(valuesCache) {
                    return cacheService.get('questions', Question.populateQuestions()).then(function(questionsCache) {
                        var answersObj = answers;
                        var answerErrors = [];
                        var answerPromises = [];
                        _.each(answersObj, function(answer) {
                            var questionId = parseInt(answer.questionId);
                            var question = _.find(questionsCache, {id: questionId});
                            if (!question) {
                                answerErrors.push({taxReturnId: taxReturnId,
                                    questionID: questionId,
                                    error: 'questionId = ' + questionId + ' is not valid.'});
                            } else {
                                var filteredValues = _.filter(valuesCache, {question_id: questionId});
                                var answerText = answer.text;
                                var questionType = question.type;
                                var foundValue = _.find(filteredValues, {text: answerText});
                                var validBool = ((questionType === 'Bool') && isYesNoAnswer(answerText));
                                var validChoice = ((questionType === 'Choice') && (foundValue));
                                var validDate = false;
                                if (questionType === 'Date') {
                                    var isValidDate = moment(answerText, API_DATE_INPUT_FORMAT, true).isValid();
                                    validDate = ((questionType === 'Date') && (isValidDate));
                                }
                                var validNotSure = ((questionType === 'NotSure') && isYesNoAnswer(answerText));
                                var validNoneApply = ((questionType === 'NoneApply') && isYesNoAnswer(answerText));

                                if ((answer.text) &&
                                    (validBool ||
                                    validChoice ||
                                    validDate ||
                                    validNotSure ||
                                    validNoneApply)
                                ) {
                                    var questionIdparsed = parseInt(questionId);
                                    if (!isNaN(questionIdparsed) && (questionId)) {
                                        var answerObj = {};
                                        answerObj.questionId = questionIdparsed;
                                        answerObj.text = answerText;
                                        answerObj.taxReturnId = taxReturnId;

                                        answerPromises.push(Answer.create(answerObj));
                                    } else {
                                        answerErrors.push({taxReturnId: taxReturnId,
                                            questionID: questionId,
                                            error: 'questionId = ' + questionId + ' is not valid.'});
                                    }
                                } else {
                                    var msg = '';
                                    if (questionType === 'Date') {
                                        msg = 'Invalid text value for answer (questionId=' + questionId +
                                            ', questionType=' + questionType + ', answer.text=' + answerText + '). API Date Format is ' + API_DATE_INPUT_FORMAT;
                                    } else {
                                        msg = 'Invalid text value for answer (questionId=' + questionId +
                                            ', questionType=' + questionType + ', answer.text=' + answerText + ')';

                                    }
                                    answerErrors.push({taxReturnId: taxReturnId,
                                        questionID: questionId,
                                        error: msg});
                                }
                            }
                        });
                        if (answerErrors.length > 0) {
                            res.status(400).send(answerErrors);
                        } else {
                            return Promise.all(answerPromises).then(function() {
                                res.status(200).send('OK');

                                // update the last User activity of the logged in user
                                User.updateLastUserActivity(req.user);
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

var isYesNoAnswer = function(answerText) {
    if ((answerText === 'Yes') || (answerText === 'No')) {
        return true;
    } else {
        return false;
    }
};
/*******************************************************************************
 ENDPOINT
 GET /tax_return/:id/answer/:id

 Params:
 taxReturnId and answerId

 RESPONSE:
 {
   "text": "Yes"
 }
 *******************************************************************************/
exports.findAnswerById = function (req, res) {
    req.checkParams('answerId', 'Please provide an answerId').isInt();
    req.checkParams('taxReturnId', 'Please provide an taxReturnId').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var answerId = parseInt(req.params.answerId);
        return Answer.findById(answerId).then(function(answer) {
            if (answer) {
                res.status(200).send(answer);
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
 GET /tax_return/:id/answers

 Params:
 taxReturnId

 RESPONSE:
 [
 { "questionId": 33,
   "answerId": 44,
  "text": "Y" },
 { "questionId": 34,
 "answerId": 44,
  "text": "N" }
 ]
 *******************************************************************************/
exports.listAnswers = function(req, res) {
    req.checkParams('id', 'Please provide a taxReturnId').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var id = parseInt(req.params.id);
        return cacheService.get('values', Answer.populateValues()).then(function(valuesCache) {
            return Answer.listAnswers(valuesCache, id).then(function(answers) {
                if (answers) {
                    var answersObj = {};
                    answersObj.answers = answers;
                    res.status(200).send(answersObj);
                } else {
                    res.status(404).send();
                }
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

exports.listAnswersFilterCategory = function(req, res) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('categoryId', 'Please provide a categoryId').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var taxReturnId = parseInt(req.params.taxReturnId);
        var categoryId = parseInt(req.params.categoryId);
        return cacheService.get('values', Answer.populateValues()).then(function(valuesCache) {
            return Answer.listAnswers(valuesCache, taxReturnId, categoryId).then(function(answers) {
                if (answers) {
                    var answersObj = {};
                    answersObj.answers = answers;
                    res.status(200).send(answersObj);
                } else {
                    res.status(404).send();
                }
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
 POST /tax_return/:id/address

 Params:
 taxReturnId

 INPUT BODY:
 {
   "addressLine1":  "34 Wellington Street",
   "addressLine2": "Suite 504",
   "city": "Toronto",
   "province": "Ontario",
   "postalCode": "L4D 5D7"
 }

 RESPONSE:
 200 OK
 {
   addressId: 44
 }
 *******************************************************************************/
exports.createAddress = function (req, res) {
    req.checkBody('addressLine1', 'Please provide a street address').notEmpty();
    req.checkBody('city', 'Please provide a city').notEmpty();
    req.checkBody('province', 'Please provide a province').notEmpty();
    req.checkBody('postalCode', 'Please provide a postal code').notEmpty();
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();

    if (errors) {
        res.status(400).send(errors);
    } else {
        var addressLine1 = req.body.addressLine1;
        var addressLine2 = req.body.addressLine2;
        var city = req.body.city;
        var province = req.body.province;
        var postalCode = req.body.postalCode;
        var country = req.body.country;

        var addressObj = {};
        addressObj.addressLine1 = addressLine1;
        addressObj.addressLine2 = addressLine2;
        addressObj.city = city;
        addressObj.province = province;
        addressObj.postalCode = postalCode;
        if ((country) && country.length > 0){
          addressObj.country = country;
        }
        return Address.create(addressObj).then(function(addressId) {
            var resultObj = {};
            resultObj.addressId = addressId;
            res.status(200).json(resultObj);

            // update the last User activity of the logged in user
            User.updateLastUserActivity(req.user);
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

/*******************************************************************************
 ENDPOINT
 PUT /tax_return/:id/address/:id

 Params:
 taxReturnId and addressId

 INPUT BODY:
 {
   "addressLine1":  "34 Wellington Street",
   "addressLine2": "Suite 504",
   "city": "Toronto",
   "province": "Ontario",
   "postalCode": "L4D 5D7"
 }

 RESPONSE:
 200 OK
 *******************************************************************************/
exports.updateAddress = function (req, res) {
    req.checkBody('addressLine1', 'Please provide a street address').notEmpty();
    req.checkBody('city', 'Please provide a city').notEmpty();
    req.checkBody('province', 'Please provide a province').notEmpty();
    req.checkBody('postalCode', 'Please provide a postal code').notEmpty();
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('addressId', 'Please provide an addressId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var addressLine1 = req.body.addressLine1;
        var addressLine2 = req.body.addressLine2;
        var addressId = parseInt(req.params.addressId);
        var city = req.body.city;
        var province = req.body.province;
        var postalCode = req.body.postalCode;
        var country = req.body.country;

        var addressObj = {};
        if (req.body.addressLine1) { addressObj.address_line1 = req.body.addressLine1; }
        if (req.body.addressLine2) { addressObj.address_line2 = req.body.addressLine2; }
        if (req.body.city) { addressObj.city = req.body.city; }
        if (req.body.province) { addressObj.providence = req.body.province; }
        if (req.body.postalCode) { addressObj.postal_code = req.body.postalCode; }
        if (req.body.country) { addressObj.country = req.body.country; }

        return Address.update(addressId, addressObj).then(function(addressObjId) {
            var resultObj = {};
            resultObj.addressLine1 = addressLine1;
            resultObj.addressLine2 = addressLine2;
            resultObj.city = city;
            resultObj.province = province;
            resultObj.postalCode = postalCode;

            res.status(200).json(resultObj);

            // update the last User activity of the logged in user
            User.updateLastUserActivity(req.user);
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};
/*******************************************************************************
 ENDPOINT
 GET /tax_return/:id/address/:id

 Params:
 taxReturnId and addressId

 INPUT BODY:
 None. req.params.id is the only input (no body)

 RESPONSE:
 {
   "addressLine1":  "34 Wellington Street",
   "addressLine2": "Suite 504",
   "city": "Toronto",
   "province": "Ontario",
   "postalCode": "L4D 5D7"
 }
 *******************************************************************************/
exports.findAddressById = function (req, res) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('addressId', 'Please provide a addressId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var addressId = parseInt(req.params.addressId);
        return Address.findById(addressId).then(function(address) {
            if (address) {
                res.status(200).send(address);
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
 GET /tax_return/:id/addresses

 Params:
 taxReturnId

 INPUT BODY:
 None. req.params.id is the only input (no body)

 RESPONSE:
[
 {
   "addressLine1":  "34 Wellington Street",
   "addressLine2": "Suite 504",
   "city": "Toronto",
   "province": "Ontario",
   "postalCode": "L4D 5D7"
 }
]
 *******************************************************************************/
exports.listAddresses = function (req, res) {
    req.checkParams('id', 'Please provide a tax return id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var taxReturnId = parseInt(req.params.id);
        return Address.findAll(taxReturnId).then(function(addressArr) {
            if (addressArr) {
                res.status(200).send(addressArr);
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
 POST /tax_return/:id/address/:id

 Params:
 taxReturnId and addressId

 INPUT BODY:

 RESPONSE:
 200 OK
 *******************************************************************************/
exports.linkExistingAddresses = function (req, res) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('addressId', 'Please provide a addressId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var addressId = parseInt(req.params.addressId);
        var taxReturnId = parseInt(req.params.taxReturnId);
        // check that addressId exists
        return Address.findById(addressId).then(function(address) {
            if ((!address) || (address.length === 0)) {
                res.status(404).send({ msg: 'Invalid address' });
            } else {
                // check that taxReturnId exists
                return TaxReturn.findById(taxReturnId).then(function(taxReturn) {
                    if ((!taxReturn) || (taxReturn.length === 0)) {
                        res.status(404).send({ msg: 'Invalid taxReturn' });
                    } else {
                        var addressTaxReturnObj = {};
                        addressTaxReturnObj.addressId = addressId;
                        addressTaxReturnObj.taxReturnId = taxReturnId;

                        return Address.createAssociation(addressTaxReturnObj).then(function() {
                            res.status(200).send("OK");

                            // update the last User activity of the logged in user
                            User.updateLastUserActivity(req.user);
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
 POST /tax_return/:id/dependant

 Params:
 taxReturnId

 INPUT BODY:
 {
   "firstName": "Jason",
   "lastName": "Chen",
   "dateOfBirth": "YYYY-MM-DD",
   "relationship": "son"
 }

 RESPONSE:
 200 OK
 {
   dependantId: 4
 }
 *******************************************************************************/
exports.createDependant = function (req, res) {
    req.checkBody('firstName', 'Please provide a firstName').notEmpty();
    req.checkBody('lastName', 'Please provide a lastName').notEmpty();
    req.checkBody('dateOfBirth', 'Please provide a dateOfBirth').notEmpty();
    req.checkBody('relationship', 'Please provide a relationship').notEmpty();
    req.checkParams('id', 'Please provide a dependantId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var dateOfBirth = req.body.dateOfBirth;
        var relationship = req.body.relationship;
        var isShared = req.body.isShared;

        var dependantObj = {};
        dependantObj.firstName = firstName;
        dependantObj.lastName = lastName;
        dependantObj.dateOfBirth = dateOfBirth;
        dependantObj.relationship = relationship;
        dependantObj.isShared = isShared;

        return Dependant.create(dependantObj).then(function(dependantId) {
            var resultObj = {};
            resultObj.dependantId = dependantId;
            res.status(200).json(resultObj);

            // update the last User activity of the logged in user
            User.updateLastUserActivity(req.user);
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};
/*******************************************************************************
 ENDPOINT
 PUT /tax_return/:id/dependant/:id

 Params:
 taxReturnId and dependantId

 INPUT BODY:
 {
   "firstName": "Jason",    Optional
   "lastName": "Chen",       Optional
   "dateOfBirth": "YYYY-MM-DD",    Optional
   "relationship": "son"        Optional
 }

 RESPONSE:
 200 OK
 *******************************************************************************/
exports.updateDependant = function (req, res) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('dependantId', 'Please provide a dependantId').isInt();
    req.checkBody('firstName', 'Please provide a firstName').notEmpty();
    req.checkBody('lastName', 'Please provide a lastName').notEmpty();
    req.checkBody('dateOfBirth', 'Please provide a dateOfBirth').notEmpty();
    req.checkBody('relationship', 'Please provide a relationship').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var dateOfBirth = req.body.dateOfBirth;
        var relationship = req.body.relationship;
        var dependantId = parseInt(req.params.dependantId);
        var taxReturnId = parseInt(req.params.taxReturnId);
        var isShared = req.body.isShared;
        var isValidDate = moment(dateOfBirth, API_DATE_INPUT_FORMAT, true).isValid();
        if(!isValidDate){
            res.status(400).send({msg: "Invalid date format. Expected date format is " + API_DATE_INPUT_FORMAT});
            res.end();
            return;
        }
        // check that dependantId exists
        return Dependant.findById(dependantId).then(function(dependant) {
            if ((!dependant) || (dependant.length === 0)) {
                res.status(404).send({ msg: 'Dependant not found' });
            } else {
                var dependantObj = {};
                if (req.body.firstName) { dependantObj.first_name = req.body.firstName; }
                if (req.body.lastName) { dependantObj.last_name = req.body.lastName; }
                if (req.body.dateOfBirth) { dependantObj.date_of_birth = req.body.dateOfBirth; }
                if (req.body.relationship) { dependantObj.relationship = req.body.relationship; }
                if (req.body.isShared) { dependantObj.is_shared = req.body.isShared; }

                return Dependant.update(dependantId,dependantObj).then(function() {
                    var resultObj = {};
                    resultObj.firstName = firstName;
                    resultObj.lastName = lastName;
                    resultObj.dateOfBirth = dateOfBirth;
                    resultObj.relationship = relationship;
                    resultObj.isShared = isShared;

                    res.status(200).json(resultObj);

                    // update the last User activity of the logged in user
                    User.updateLastUserActivity(req.user);
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
 DELETE /tax_return/:taxReturnId/dependant/:dependantId

 Params:
 taxReturnId and dependantId

 RESPONSE:
 200 OK
 *******************************************************************************/
exports.deleteDependant = function (req, res) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('dependantId', 'Please provide a dependantId').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        const dependantId = parseInt(req.params.dependantId),
            taxReturnId = parseInt(req.params.taxReturnId);
        // check that dependantId exists
        return Dependant.deleteById(dependantId, taxReturnId).then(function() {
            res.status(200).send('OK');

            // update the last User activity of the logged in user
            User.updateLastUserActivity(req.user);
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

/*******************************************************************************
 ENDPOINT
 GET /tax_return/:id/dependants

 Params:
 taxReturnId

 RESPONSE:
 [
 {
   "taxReturnId":  44,
   "firstName": "Jason",
   "lastName": "Chen",
   "dateOfBirth": "08/07/1988",
   "relationship": "son"
 },
 {
  "taxReturnId":  44,
  "firstName": "Jason",
  "lastName": "Chen",
  "dateOfBirth": "08/07/1988",
  "relationship": "son"
},
 ]
 *******************************************************************************/
exports.getDependantsById = function (req, res) {
    req.checkParams('id', 'Please provide a taxReturn Id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var taxReturnId = parseInt(req.params.id);
        return Dependant.getAllById(taxReturnId).then(function(dependant) {
            if (dependant) {
                res.status(200).send(dependant);
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
 GET /tax_return/:id/dependant/:id

 Params:
 taxReturnId and dependantId

 RESPONSE:
 {
   "taxReturnId":  44,
   "firstName": "Jason",
   "lastName": "Chen",
   "dateOfBirth": "08/07/1988",
   "relationship": "son"
 }
 *******************************************************************************/
exports.findDependantById = function (req, res) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('dependantId', 'Please provide a dependantId').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var dependantId = parseInt(req.params.dependantId);
        return Dependant.findById(dependantId).then(function(dependant) {
            if (dependant) {
                res.status(200).send(dependant);
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
 POST /tax_return/:id/dependant/:id

 Params:
 taxReturnId and dependantId

 RESPONSE:
 200 OK

 *******************************************************************************/
exports.linkExistingDependants = function (req, res) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId id').isInt();
    req.checkParams('dependantId', 'Please provide a dependantId id').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var dependantId = parseInt(req.params.dependantId);
        var taxReturnId = parseInt(req.params.taxReturnId);
        // check that dependantId exists
        return Dependant.findById(dependantId).then(function(dependant) {
            if ((!dependant) || (dependant.length === 0)) {
                res.status(404).send({ msg: 'Invalid dependant' });
            } else {
                // check that taxReturnId exists
                return TaxReturn.findById(taxReturnId).then(function(taxReturn) {
                    if ((!taxReturn) || (taxReturn.length === 0)) {
                        res.status(404).send({ msg: 'Invalid taxReturn' });
                    } else {
                        var dependantTaxReturnObj = {};
                        dependantTaxReturnObj.dependantId = dependantId;
                        dependantTaxReturnObj.taxReturnId = taxReturnId;
                        return Dependant.createAssociation(dependantTaxReturnObj).then(function() {
                            res.status(200).send("OK");
                            // update the last User activity of the logged in user
                            User.updateLastUserActivity(req.user);
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
 POST admin/tax_returns/statuses

 Params:
 none

 RESPONSE:
 [
  {
    "id": 0,
    "name": "To Be Assigned",
    "display_text": "TAXpro To Be Assigned",
    "created_at": "2016-12-23T20:42:50.000Z",
    "updated_at": "2016-12-23T21:37:15.000Z"
  },
  {
    "id": 1,
    "name": "Assigned",
    "display_text": "In Progress",
    "created_at": "2016-11-30T22:57:58.000Z",
    "updated_at": "2016-12-23T21:37:41.000Z"
  }]

 *******************************************************************************/
exports.getAvailableTaxReturnStatuses = function (req, res) {
  var errors = req.validationErrors();
  if (errors) {
    res.status(400).send(errors);
  } else {

    // check that dependantId exists
    return TaxReturn.getTaxReturnStatuses()
      .then(function(results) {
        return res.status(200).json(results);
    }).catch(function(err) {
        logger.error(err.message);
        res.status(500).send({ msg: 'Something broke: check server logs.' });
        return;
    });
  }
};

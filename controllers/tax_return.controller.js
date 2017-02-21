/*jslint node: true */

'use strict';


/**
 * Module dependencies.
 */
var config = require('../config/config');
var API_DATE_INPUT_FORMAT = config.api.dateInputFormat;
var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
var validator = require('express-validator');
var db = require('../services/db');
var logger = require('../services/logger.service');
var taxReturnModel = require('../models/tax_return.model');
var accountModel = require('../models/account.model');
var userModel = require('../models/user.model');
var productModel = require('../models/product.model');
var questionModel = require('../models/question.model');
var answerModel = require('../models/answer.model');
var addressModel = require('../models/address.model');
var dependantModel = require('../models/dependant.model');
var cacheService = require('../services/cache.service');
var statusChangesModel = require('../models/statusChanges.model');


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
exports.createTaxReturns = function (req, res, next) {
    req.checkBody('taxReturns', 'Please provide array of taxReturns').notEmpty();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var createTaxReturnPromise = function(taxReturn, trx) {

        var accountId = parseInt(taxReturn.accountId);
        if (!accountId) {
            return Promise.reject(new Error('No accountId specified'));
        }
        var productId = parseInt(taxReturn.productId);
        if (!productId) {
            return Promise.reject(new Error('No productId specified'));
        }
        var firstName = taxReturn.firstName;
        if (!firstName) {
            return Promise.reject(new Error('No firstName specified'));
        }
        var filerType = taxReturn.filerType;
        if (!filerType) {
            return Promise.reject(new Error('No filerType specified'));
        }
        var status = taxReturn.status;
        var sin = taxReturn.sin;
        var prefix = taxReturn.prefix;
        var middleInitial = taxReturn.middleInitial;

        var taxReturnObj = {};
        // check that accountId exists
        return accountModel.findById(accountId)
        .then(function(accountObj) {
            if ((!accountObj) || (accountObj.length === 0)) {
                return Promise.reject(new Error('Invalid accountId'));
            }
            // check that productId exists
            return productModel.findById(productId);
        }).then(function(productObj) {
            if ((!productObj) || (productObj.length === 0)) {
                return Promise.reject(new Error('Invalid productId'));
            }

            taxReturnObj.accountId = accountId;
            taxReturnObj.productId = productId;
            taxReturnObj.firstName = firstName;
            taxReturnObj.filerType = filerType;
            taxReturnObj.status = status;
            taxReturnObj.sin = sin;
            taxReturnObj.prefix = prefix;
            taxReturnObj.middleInitial = middleInitial;

            return taxReturnModel.create(taxReturnObj, trx);
        }).then(function(taxReturnId) {
            var resultObj = taxReturnObj;
            resultObj.taxReturnId = taxReturnId;
            return Promise.resolve(resultObj);
        });
    };



    var resultArr = [];
    var accessDenied = false;
    return db.knex.transaction(function(trx) {
        Promise.each(req.body.taxReturns, function(taxReturnObj) {
            return createTaxReturnPromise(taxReturnObj, trx).then(function(result) {
                resultArr.push(result);
            });
        }).then(function() {
            trx.commit();
            res.status(200).json(resultArr);

            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(req.user);
        }).catch(function(err) {
            trx.rollback();
            //logger.error(err);
            res.status(400).send({ msg: 'create tax return failed' });
            var proxiedError = new Error();
            proxiedError.message = err.message;
            proxiedError.stack = err.stack;
            return Promise.reject(proxiedError);
        });
    });
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
exports.createTaxReturn = function (req, res, next) {
console.log('createTaxReturn() req.body = ' + JSON.stringify(req.body, null, 2));
    req.checkBody('accountId', 'Please provide a accountId').isInt();
    req.checkBody('productId', 'Please provide a productId').isInt();
    req.checkBody('firstName', 'Please provide a firstName').notEmpty();
    req.checkBody('filerType', 'Please provide a filerType').notEmpty();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var accountId = parseInt(req.body.accountId);
    var productId = parseInt(req.body.productId);
    var firstName = req.body.firstName;
    var filerType = req.body.filerType;
    var status = req.body.status;
    var sin = req.body.sin;
    var prefix = req.body.prefix;
    var middleInitial = req.body.middleInitial;

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
            var taxReturnObj = {};
            taxReturnObj.accountId = accountId;
            taxReturnObj.productId = productId;
            taxReturnObj.firstName = firstName;
            taxReturnObj.filerType = filerType;
            taxReturnObj.status = status;
            taxReturnObj.sin = sin;
            taxReturnObj.prefix = prefix;
            taxReturnObj.middleInitial = middleInitial;

            return taxReturnModel.create(taxReturnObj).then(function(taxReturnId) {
                var resultObj = taxReturnObj;
                resultObj.taxReturnId = taxReturnId;
                res.status(200).json(resultObj);

                // update the last User activity of the logged in user
                userModel.updateLastUserActivity(req.user);

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
exports.updateTaxReturnById = function (req, res, next) {
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.id);
    var accountId = req.body.accountId;
    var productId = req.body.productId;
    var taxReturnObj = {};

    return Promise.all([taxReturnModel.hasAccess(req.user, taxReturnId), taxReturnModel.findById(taxReturnId)]).then(function(results) {

        var allowed = results[0];
        var taxReturn = results[1];

        if (!allowed) {
            return res.status(403).send();
        }

        if ((!req.body.firstName) &&
            (!req.body.lastName) &&
            (!req.body.provinceOfResidence) &&
            (!req.body.dateOfBirth) &&
            (!req.body.canadianCitizen) &&
            (!req.body.authorizeCra) &&
            (!req.body.filerType) &&
            (!req.body.statusId) &&
            (!req.body.sin) &&
            (!req.body.prefix) &&
            (!req.body.middleInitial) &&
            (!req.body.refund) &&
            (!req.body.details)
        ) {
            return res.status(400).send({ msg: 'Invalid request: no fields specified for update?' });
        } else {
          if(userModel.isAdminOrTaxpro(req.user) && req.body.statusId) {

            return statusChangesModel.allowableStatusChangeForTaxReturn( taxReturn.status.id,parseInt(req.body.statusId),req.user.role);
          } else {
            return Promise.resolve(true);
          }
        }
      })
    .then(function(allowableStatusChange) {
        
        if(!allowableStatusChange) {
          
                return res.status(403).json({message:"status changed from current status not allowed"});
        } else {

          if (req.body.firstName) { taxReturnObj.first_name = req.body.firstName; }
          if (req.body.lastName) { taxReturnObj.last_name = req.body.lastName; }
          if (req.body.provinceOfResidence) { taxReturnObj.province_of_residence = req.body.provinceOfResidence; }
          if (req.body.dateOfBirth) { taxReturnObj.date_of_birth = req.body.dateOfBirth; }
          if (typeof req.body.canadianCitizen !== "undefined") { taxReturnObj.canadian_citizen = req.body.canadianCitizen; }
          if (typeof req.body.authorizeCra !== "undefined") { taxReturnObj.authorize_cra = req.body.authorizeCra; }
          if (req.body.filerType) { taxReturnObj.filer_type = req.body.filerType; }
          if (req.body.middleInitial) {taxReturnObj.middle_initial = req.body.middleInitial; }
          if (req.body.sin) {taxReturnObj.SIN = req.body.sin; }
          if (req.body.prefix) {taxReturnObj.prefix = req.body.prefix; }

          // only allow admin or taxpro to change these
          if(userModel.isAdminOrTaxpro(req.user)) {
            if (req.body.sin) {taxReturnObj.SIN = req.body.sin; }
            if (req.body.statusId) {taxReturnObj.status_id = req.body.statusId; }
            if (req.body.refund) {taxReturnObj.refund = req.body.refund; }
            if (req.body.details) {taxReturnObj.details = req.body.details; }
          }


          return taxReturnModel.update(taxReturnId, taxReturnObj).then(function() {
              return taxReturnModel.findById(taxReturnId)
                .then(function(taxReturnResults) {
                  var taxReturn = taxReturnResults;

                  // insert state changes
                  if (!taxReturn) {
                    return res.status(404).send();
                  }

                  return statusChangesModel.addStatusChangesToTaxReturn(taxReturn,req.user.role);
                }).then(function(taxReturn) {
                  res.status(200).send(taxReturn);

                  // update the last User activity of the logged in user
                  userModel.updateLastUserActivity(req.user);
                }).catch(function(err) {
                    next(err);
                });
            }).catch(function(err) {
                next(err);
            });
        }
    });
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
exports.updateTaxReturnStatusById = function (req, res, next) {
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    req.checkBody('statusId', 'Please provide a status id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    const taxReturnId = parseInt(req.params.id),
        taxReturnObj = {
            status_id: parseInt(req.body.statusId)
        };
    return Promise.all([taxReturnModel.hasAccess(req.user, taxReturnId), taxReturnModel.findById(taxReturnId)]).then(function(results) {
      var allowed = results[0];
        if (!allowed) {
            return res.status(403).send();
        }

      var taxReturn = results[1];

      return statusChangesModel.allowableStatusChangeForTaxReturn( taxReturn.status.id,taxReturnObj.status_id,req.user.role);

    })
    .then(function(allowableStatusChange) {
        
        if(!allowableStatusChange) {
            return res.status(403).json({message:"status changed from current status not allowed"});
        }

        return taxReturnModel.update(taxReturnId, taxReturnObj).then(function() {
            res.status(200).send('OK');

            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(req.user);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.findTaxReturnById = function (req, res, next) {
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.id);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return taxReturnModel.findById(taxReturnId, userModel.isAdmin(req.user) || userModel.isTaxpro(req.user))
        .then(function(taxReturnResults) {
            var taxReturn = taxReturnResults;

            // insert state changes
            if (!taxReturn) {
              return res.status(404).send();
            }

          return statusChangesModel.addStatusChangesToTaxReturn(taxReturn,req.user.role);

        })
        .then(function(taxReturn) {
            res.status(200).send(taxReturn);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.createAnswer = function(req, res, next) {
    req.checkBody('answers', 'Please provide a list of answers').notEmpty();
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.id);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        var answers = req.body.answers;
        // check that taxReturnId exists
        return taxReturnModel.findById(taxReturnId).then(function(taxReturnObj) {
            if ((!taxReturnObj) || (taxReturnObj.length === 0)) {
                return res.status(404).send({msg: 'Invalid taxReturnId'});
            }
            return cacheService.get('values', answerModel.populateValues()).then(function(valuesCache) {
                return cacheService.get('questions', questionModel.populateQuestions()).then(function(questionsCache) {
                    var answersArr = answers;
                    var answerErrors = [];
                    var answerPromises = [];
                    _.each(answersArr, function(answerObj) {
                        var questionId = parseInt(answerObj.questionId);
                        var question = _.find(questionsCache, {id: questionId});
                        if (!question) {
                            answerErrors.push({
                                taxReturnId: taxReturnId,
                                questionID: questionId,
                                error: 'questionId = ' + questionId + ' is not valid.'});
                        } else {
                            var filteredValues = _.filter(valuesCache, {question_id: questionId});
                            var answerText = answerObj.text;
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

                            if ((answerObj.text) &&
                                (validBool ||
                                validChoice ||
                                validDate ||
                                validNotSure ||
                                validNoneApply)
                            ) {
                                var questionIdparsed = parseInt(questionId);
                                if (!isNaN(questionIdparsed) && (questionId)) {
                                    var createAnswerObj = {};
                                    createAnswerObj.questionId = questionIdparsed;
                                    createAnswerObj.text = answerText;
                                    createAnswerObj.taxReturnId = taxReturnId;

                                    answerPromises.push(answerModel.create(createAnswerObj));
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
                        return res.status(400).send(answerErrors);
                    }
                    return Promise.all(answerPromises).then(function() {
                        res.status(200).send('OK');

                        // update the last User activity of the logged in user
                        userModel.updateLastUserActivity(req.user);
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
exports.findAnswerById = function (req, res, next) {
    req.checkParams('answerId', 'Please provide an answerId').isInt();
    req.checkParams('taxReturnId', 'Please provide an taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        var answerId = parseInt(req.params.answerId);
        return answerModel.findById(answerId).then(function(answerObj) {
            if (!answerObj) {
                return res.status(404).send();
            }
            return res.status(200).send(answerObj);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.listAnswers = function(req, res, next) {
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.id);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return cacheService.get('values', answerModel.populateValues()).then(function(valuesCache) {
            return answerModel.listAnswers(valuesCache, taxReturnId).then(function(answersArr) {
                if (!answersArr) {
                    return res.status(404).send();
                }
                var answersObj = {};
                answersObj.answers = answersArr;
                return res.status(200).send(answersObj);
            }).catch(function(err) {
                next(err);
            });
        }).catch(function(err) {
            next(err);
        });
    });
};

exports.listAnswersFilterCategory = function(req, res, next) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('categoryId', 'Please provide a categoryId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        var categoryId = parseInt(req.params.categoryId);
        return cacheService.get('values', answerModel.populateValues()).then(function(valuesCache) {
            return answerModel.listAnswers(valuesCache, taxReturnId, categoryId).then(function(answersArr) {
                if (!answersArr) {
                    return res.status(404).send();
                }
                var answersObj = {};
                answersObj.answers = answersArr;
                return res.status(200).send(answersObj);
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
exports.createAddress = function (req, res, next) {
    req.checkBody('addressLine1', 'Please provide a street address').notEmpty();
    req.checkBody('city', 'Please provide a city').notEmpty();
    req.checkBody('province', 'Please provide a province').notEmpty();
    req.checkBody('postalCode', 'Please provide a postal code').notEmpty();
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var addressLine1 = req.body.addressLine1;
    var addressLine2 = req.body.addressLine2;
    var city = req.body.city;
    var province = req.body.province;
    var postalCode = req.body.postalCode;
    var country = req.body.country;
    var taxReturnId = parseInt(req.params.id);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        var addressObj = {};
        addressObj.addressLine1 = addressLine1;
        addressObj.addressLine2 = addressLine2;
        addressObj.city = city;
        addressObj.province = province;
        addressObj.postalCode = postalCode;
        if ((country) && country.length > 0){
          addressObj.country = country;
        }
        return addressModel.create(addressObj).then(function(addressId) {
            var resultObj = {};
            resultObj.addressId = addressId;
            res.status(200).json(resultObj);

            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(req.user);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.updateAddress = function (req, res, next) {
    req.checkBody('addressLine1', 'Please provide a street address').notEmpty();
    req.checkBody('city', 'Please provide a city').notEmpty();
    req.checkBody('province', 'Please provide a province').notEmpty();
    req.checkBody('postalCode', 'Please provide a postal code').notEmpty();
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('addressId', 'Please provide an addressId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var addressLine1 = req.body.addressLine1;
    var addressLine2 = req.body.addressLine2;
    var addressId = parseInt(req.params.addressId);
    var city = req.body.city;
    var province = req.body.province;
    var postalCode = req.body.postalCode;
    var country = req.body.country;
    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        var addressObj = {};
        if (req.body.addressLine1) { addressObj.address_line1 = req.body.addressLine1; }
        if (req.body.addressLine2) { addressObj.address_line2 = req.body.addressLine2; }
        if (req.body.city) { addressObj.city = req.body.city; }
        if (req.body.province) { addressObj.providence = req.body.province; }
        if (req.body.postalCode) { addressObj.postal_code = req.body.postalCode; }
        if (req.body.country) { addressObj.country = req.body.country; }

        return addressModel.update(addressId, addressObj).then(function(addressId) {
            var resultObj = {};
            resultObj.addressLine1 = addressLine1;
            resultObj.addressLine2 = addressLine2;
            resultObj.city = city;
            resultObj.province = province;
            resultObj.postalCode = postalCode;

            res.status(200).json(resultObj);

            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(req.user);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.findAddressById = function (req, res, next) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('addressId', 'Please provide a addressId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        var addressId = parseInt(req.params.addressId);
        return addressModel.findById(addressId).then(function(addressObj) {
            if (!addressObj) {
                return res.status(404).send();
            }
            return res.status(200).send(addressObj);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.listAddresses = function (req, res, next) {
    req.checkParams('id', 'Please provide a tax return id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.id);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return addressModel.findAll(taxReturnId).then(function(addressArr) {
            if (!addressArr) {
                return res.status(404).send();
            }
            return res.status(200).send(addressArr);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.linkExistingAddresses = function (req, res, next) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('addressId', 'Please provide a addressId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var addressId = parseInt(req.params.addressId);
    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        // check that addressId exists
        return addressModel.findById(addressId).then(function(address) {
            if ((!address) || (address.length === 0)) {
                return res.status(404).send({ msg: 'Invalid address' });
            }
            // check that taxReturnId exists
            return taxReturnModel.findById(taxReturnId).then(function(taxReturnObj) {
                if ((!taxReturnObj) || (taxReturnObj.length === 0)) {
                    return res.status(404).send({ msg: 'Invalid taxReturn' });
                }
                var addressTaxReturnObj = {};
                addressTaxReturnObj.addressId = addressId;
                addressTaxReturnObj.taxReturnId = taxReturnId;

                return addressModel.createAssociation(addressTaxReturnObj).then(function() {
                    res.status(200).send("OK");

                    // update the last User activity of the logged in user
                    userModel.updateLastUserActivity(req.user);
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
exports.createDependant = function (req, res, next) {
    req.checkBody('firstName', 'Please provide a firstName').notEmpty();
    req.checkBody('lastName', 'Please provide a lastName').notEmpty();
    req.checkBody('dateOfBirth', 'Please provide a dateOfBirth').notEmpty();
    req.checkBody('relationship', 'Please provide a relationship').notEmpty();
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.id);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
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

        return dependantModel.create(dependantObj).then(function(dependantId) {
            var resultObj = {};
            resultObj.dependantId = dependantId;
            res.status(200).json(resultObj);

            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(req.user);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.updateDependant = function (req, res, next) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('dependantId', 'Please provide a dependantId').isInt();
    req.checkBody('firstName', 'Please provide a firstName').notEmpty();
    req.checkBody('lastName', 'Please provide a lastName').notEmpty();
    req.checkBody('dateOfBirth', 'Please provide a dateOfBirth').notEmpty();
    req.checkBody('relationship', 'Please provide a relationship').notEmpty();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var dateOfBirth = req.body.dateOfBirth;
    var relationship = req.body.relationship;
    var dependantId = parseInt(req.params.dependantId);
    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        var isShared = req.body.isShared;
        var isValidDate = moment(dateOfBirth, API_DATE_INPUT_FORMAT, true).isValid();
        if(!isValidDate){
            return res.status(400).send({msg: "Invalid date format. Expected date format is " + API_DATE_INPUT_FORMAT});
        }
        // check that dependantId exists
        return dependantModel.findById(dependantId).then(function(dependant) {
            if ((!dependant) || (dependant.length === 0)) {
                return res.status(404).send({ msg: 'Dependant not found' });
            }
            var dependantObj = {};
            if (req.body.firstName) { dependantObj.first_name = req.body.firstName; }
            if (req.body.lastName) { dependantObj.last_name = req.body.lastName; }
            if (req.body.dateOfBirth) { dependantObj.date_of_birth = req.body.dateOfBirth; }
            if (req.body.relationship) { dependantObj.relationship = req.body.relationship; }
            if (req.body.isShared) { dependantObj.is_shared = req.body.isShared; }

            return dependantModel.update(dependantId,dependantObj).then(function() {
                var resultObj = {};
                resultObj.firstName = firstName;
                resultObj.lastName = lastName;
                resultObj.dateOfBirth = dateOfBirth;
                resultObj.relationship = relationship;
                resultObj.isShared = isShared;

                res.status(200).json(resultObj);

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
 DELETE /tax_return/:taxReturnId/dependant/:dependantId

 Params:
 taxReturnId and dependantId

 RESPONSE:
 200 OK
 *******************************************************************************/
exports.deleteDependant = function (req, res, next) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('dependantId', 'Please provide a dependantId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    const dependantId = parseInt(req.params.dependantId),
        taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        // check that dependantId exists
        return dependantModel.deleteById(dependantId, taxReturnId).then(function() {
            res.status(200).send('OK');

            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(req.user);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.getDependantsById = function (req, res, next) {
    req.checkParams('id', 'Please provide a taxReturn Id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.id);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return dependantModel.getAllById(taxReturnId).then(function(dependantArr) {
            if (!dependantArr) {
                return res.status(404).send();
            }
            return res.status(200).send(dependantArr);
        }).catch(function(err) {
            next(err);
        });
    });
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
exports.findDependantById = function (req, res, next) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkParams('dependantId', 'Please provide a dependantId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        var dependantId = parseInt(req.params.dependantId);
        return dependantModel.findById(dependantId).then(function(dependantObj) {
            if (!dependantObj) {
                return res.status(404).send();
            }
            return res.status(200).send(dependantObj);
        }).catch(function(err) {
            next(err);
        });
    });
};


/*******************************************************************************
 ENDPOINT
 POST /tax_return/:id/dependant/:id

 Params:
 taxReturnId and dependantId

 RESPONSE:
 200 OK

 *******************************************************************************/
exports.linkExistingDependants = function (req, res, next) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId id').isInt();
    req.checkParams('dependantId', 'Please provide a dependantId id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var dependantId = parseInt(req.params.dependantId);
    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        // check that dependantId exists
        return dependantModel.findById(dependantId).then(function(dependantObj) {
            if ((!dependantObj) || (dependantObj.length === 0)) {
                return res.status(404).send({ msg: 'Invalid dependant' });
            }
            // check that taxReturnId exists
            return taxReturnModel.findById(taxReturnId).then(function(taxReturnObj) {
                if ((!taxReturnObj) || (taxReturnObj.length === 0)) {
                    return res.status(404).send({ msg: 'Invalid taxReturn' });
                }
                var dependantTaxReturnObj = {};
                dependantTaxReturnObj.dependantId = dependantId;
                dependantTaxReturnObj.taxReturnId = taxReturnId;
                return dependantModel.createAssociation(dependantTaxReturnObj).then(function() {
                    res.status(200).send("OK");
                    // update the last User activity of the logged in user
                    userModel.updateLastUserActivity(req.user);
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
exports.getAvailableTaxReturnStatuses = function (req, res, next) {
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    // check that dependantId exists
    return taxReturnModel.getTaxReturnStatuses()
    .then(function(resultsArr) {
        return res.status(200).json(resultsArr);
    }).catch(function(err) {
        next(err);
    });
};

/*******************************************************************************
 ENDPOINT
 GET /tax_return/:id/answerscsv

 Params:
 taxReturnId

 RESPONSE:
 CSV download containing all questions and answers for this tax return id

 *******************************************************************************/
exports.getAnswersAsCSV = function (req, res, next) {
    req.checkParams('taxReturnId', 'Please provide a taxReturnId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var taxReturnId = parseInt(req.params.taxReturnId);
    return taxReturnModel.hasAccess(req.user, taxReturnId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return taxReturnModel.getQuestionAnswersCsv(taxReturnId).then(function(resultArr) {
            if ((!resultArr) || (resultArr.length === 0)) {
                return res.status(404).send();
            }

            res.setHeader('Content-disposition', 'attachment; filename=tax_return_' + taxReturnId + '_answers.csv');
            res.set('Content-Type', 'text/csv');
            return res.csv(resultArr);
        }).catch(function(err) {
            next(err);
        });
    });
};

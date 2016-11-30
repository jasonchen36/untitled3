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
var Question = require('../models/question.model');
var Answer = require('../models/answer.model');
var Address = require('../models/address.model');
var Dependant = require('../models/dependant.model');
var Document = require('../models/document.model');
var validator = require('express-validator');
// var Checklist = require('../models/checklist.model');

// boilerplate
var _ = require('underscore');
var moment = require('moment');
var dateFormat = "YYYY-MM-DD";
var config = require('../config/config');

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
        var accountId = req.body.accountId;
        var productId = req.body.productId;
        var firstName = req.body.firstName;

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
                        var taxReturnObj = {};
                        taxReturnObj.accountId = accountId;
                        taxReturnObj.productId = productId;
                        taxReturnObj.firstName = firstName;

                        return TaxReturn.create(taxReturnObj).then(function(taxReturnId) {
                            var resultObj = {};
                            resultObj.accountId = accountId;
                            resultObj.productId = productId;
                            resultObj.taxReturnId = taxReturnId;

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
    req.checkParams('id', 'Please provide a taxReturnId').isInt();
    req.checkBody('accountId', 'Please provide a accountId').isInt();
    req.checkBody('productId', 'Please provide a productId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var taxReturnId = req.params.id;
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
                        var taxReturnObj = {};
                        if (req.body.firstName) { taxReturnObj.first_name = req.body.firstName; }
                        if (req.body.lastName) { taxReturnObj.last_name = req.body.lastName; }
                        if (req.body.provinceOfResidence) { taxReturnObj.province_of_redidence = req.body.provinceOfResidence; }
                        if (req.body.dateOfBirth) { taxReturnObj.date_of_birth = req.body.dateOfBirth; }
                        if (req.body.canadianCitizen) { taxReturnObj.canadian_citizen = req.body.canadianCitizen; }
                        if (req.body.authorizeCra) { taxReturnObj.authorize_cra = req.body.authorizeCra; }

                        return TaxReturn.update(taxReturnId, taxReturnObj).then(function(taxReturnId) {
                            var resultObj = {};
                            resultObj.accountId = accountId;
                            resultObj.productId = productId;
                            resultObj.taxReturnId = taxReturnId;

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
POST /tax_return/:id/answers

Params:
taxReturnId

INPUT BODY:
[
{
  "questionId":  33,
  "taxReturnId": 44,
  "text": "Yes"
}
]

RESPONSE:
200 OK
*******************************************************************************/
exports.createAnswer = function (req, res) {
  req.checkBody('questionId', 'Please provide a questionId').isInt();
  req.checkBody('taxReturnId', 'Please provide a taxReturnId').isInt();
  req.checkBody('text', 'Please provide an answer').notEmpty();
  req.checkParams('id', 'Please provide a taxReturnId').isInt();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var questionId = req.body.questionId;
      var taxReturnId = req.body.taxReturnId;
      var text = req.body.text;

      // check that questionId exists
      Question.findById(questionId).then(function(question) {
          if ((!question) || (question.length === 0)) {
              res.status(404).send({ msg: 'Invalid questionID' });
          } else {
              // check that taxReturnId exists
              TaxReturn.findById(taxReturnId).then(function(TaxReturn) {
                  if ((!TaxReturn) || (TaxReturn.length === 0)) {
                      res.status(404).send({ msg: 'Invalid TaxReturnID' });
                  } else {
                      var answerObj = {};
                      answerObj.questionId = questionId;
                      answerObj.taxReturnId = taxReturnId;
                      answerObj.text = text;

                      return Answer.create(answerObj).then(function(answerId) {
                          var resultObj = {};
                          resultObj.questionId = questionId;
                          resultObj.taxReturnId = taxReturnId;
                          resultObj.answerId = answerId;

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
      var answerId = req.params.answerId;
      Answer.findById(answerId).then(function(answer) {
          if (answer) {
              res.status(200).send(answer);
          } else {
              res.status(404).send();
          }
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
exports.listAnswers = function (req, res) {
  req.checkParams('id', 'Please provide a taxReturnId').isInt();

  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var id = req.params.id;
      Answer.findById(id).then(function(answers) {
          if (answers) {
              res.status(200).send(answers);
          } else {
              res.status(404).send();
          }
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

      var addressObj = {};
      addressObj.addressLine1 = addressLine1;
      addressObj.addressLine2 = addressLine2;
      addressObj.city = city;
      addressObj.province = province;
      addressObj.postalCode = postalCode;

      return Address.create(addressObj).then(function(addressObjId) {
          var resultObj = {};
          resultObj.addressLine1 = addressLine1;
          resultObj.addressLine2 = addressLine2;
          resultObj.city = city;
          resultObj.province = province;
          resultObj.postalCode = postalCode;

          res.status(200).json(resultObj);
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
      var city = req.body.city;
      var province = req.body.province;
      var postalCode = req.body.postalCode;

      var addressObj = {};
      if (req.body.addressLine1) { addressObj.address_line1 = req.body.addressLine1; }
      if (req.body.addressLine2) { addressObj.address_line2 = req.body.addressLine2; }
      if (req.body.city) { addressObj.city = req.body.city; }
      if (req.body.province) { addressObj.providence = req.body.province; }
      if (req.body.postalCode) { addressObj.postal_code = req.body.postalCode; }

      return Address.update(addressLine1, addressObj).then(function(addressObjId) {
          var resultObj = {};
          resultObj.addressLine1 = addressLine1;
          resultObj.addressLine2 = addressLine2;
          resultObj.city = city;
          resultObj.province = province;
          resultObj.postalCode = postalCode;

          res.status(200).json(resultObj);
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
      var addressId = req.params.addressId;
      Address.findById(addressId).then(function(address) {
          if (address) {
              res.status(200).send(address);
          } else {
              res.status(404).send();
          }
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
    var addressId = req.params.addressId;
    var taxReturnId = req.params.taxReturnId;
      // check that addressId exists
      Address.findById(addressId).then(function(address) {
          if ((!address) || (address.length === 0)) {
              res.status(404).send({ msg: 'Invalid address' });
          } else {
              // check that taxReturnId exists
              TaxReturn.findById(taxReturnId).then(function(taxReturn) {
                  if ((!taxReturn) || (taxReturn.length === 0)) {
                      res.status(404).send({ msg: 'Invalid taxReturn' });
                  } else {
                      var addressTaxReturnObj = {};
                      addressTaxReturnObj.addressId = addressId;
                      addressTaxReturnObj.taxReturnId = taxReturnId;

                      return Address.createAssociation(addressTaxReturnObj).then(function() {


                          res.status(200).send("OK");
                      });
                  }
              });
          }
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
  "dateOfBirth": "08/07/1988",
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

      var dependantObj = {};
      dependantObj.firstName = firstName;
      dependantObj.lastName = lastName;
      dependantObj.dateOfBirth = dateOfBirth;
      dependantObj.relationship = relationship;

      return Dependant.create(dependantObj).then(function(dependantObjId) {
          var resultObj = {};
          resultObj.firstName = firstName;
          resultObj.lastName = lastName;
          resultObj.dateOfBirth = dateOfBirth;
          resultObj.relationship = relationship;

          res.status(200).json(resultObj);
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
  "dateOfBirth": "08/07/1988",    Optional
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
      var dependantId = req.params.dependantId;
      var taxReturnId = req.params.taxReturnId;
      var isValidDate = moment(dateOfBirth, dateFormat, true).isValid();
      if(!isValidDate){
        res.status(400).send({msg: "Invalid date format. Expected date format is " + dateFormat});
        res.end();
        return;
      }
      // check that dependantId exists
      Dependant.findById(dependantId).then(function(dependant) {
          if ((!dependant) || (dependant.length === 0)) {
              res.status(404).send({ msg: 'Dependant not found' });
          } else {
                      var dependantObj = {};
                      if (req.body.firstName) { dependantObj.first_name = req.body.firstName; }
                      if (req.body.lastName) { dependantObj.last_name = req.body.lastName; }
                      if (req.body.dateOfBirth) { dependantObj.date_of_birth = req.body.dateOfBirth; }
                      if (req.body.relationship) { dependantObj.relationship = req.body.relationship; }
                      if (req.params.taxReturnId) { dependantObj.tax_return_id = req.params.taxReturnId; }

                      return Dependant.update(dependantId,dependantObj).then(function() {
                          var resultObj = {};
                          resultObj.firstName = firstName;
                          resultObj.lastName = lastName;
                          resultObj.dateOfBirth = dateOfBirth;
                          resultObj.relationship = relationship;
                          resultObj.taxReturnId = taxReturnId;

                          res.status(200).json(resultObj);
                      });
                  }
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
      var dependantId = req.params.dependantId;
      Dependant.findById(dependantId).then(function(dependant) {
          if (dependant) {
              res.status(200).send(dependant);
          } else {
              res.status(404).send();
          }
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
    var dependantId = req.params.dependantId;
    var taxReturnId = req.params.taxReturnId;
      // check that dependantId exists
      Dependant.findById(dependantId).then(function(dependant) {
          if ((!dependant) || (dependant.length === 0)) {
              res.status(404).send({ msg: 'Invalid dependant' });
          } else {
              // check that taxReturnId exists
              TaxReturn.findById(taxReturnId).then(function(taxReturn) {
                  if ((!taxReturn) || (taxReturn.length === 0)) {
                      res.status(404).send({ msg: 'Invalid taxReturn' });
                  } else {
                      var dependantTaxReturnObj = {};
                      dependantTaxReturnObj.dependantId = dependantId;
                      dependantTaxReturnObj.taxReturnId = taxReturnId;
                      return Dependant.createAssociation(dependantTaxReturnObj).then(function() {
                          res.status(200).send("OK");
                      });
                  }
              });
          }
      });
  }
};

/*******************************************************************************
ENDPOINT
GET /tax_return/:id/checklist

Params:
taxReturnId

RESPONSE:
[
 {"checklistId": 4,
  "name": "T5",
  "documents": [
    {
    "documentId": 4,
    "name": "filename.txt",
    "url": "taxplan.com",
    "thumbnailUrl": "taxplan.com/taxplan.jpg"
    },
    {
    "documentId": 5,
    "name": "filename2.txt",
    "url": "taxplan.com",
    "thumbnailUrl": "taxplan.com/taxplan2.jpg"
    }
  ]
 }
]
*******************************************************************************/
// exports.findChecklist = function (req, res) {
//     req.checkParams('id', 'Please provide an integer id').isInt();
//
//     var errors = req.validationErrors();
//     if (errors) {
//         res.status(400).send(errors);
//     } else {
//         var id = req.params.id;
//         Checklist.findById(id).then(function(checklist) {
//             if (checklist) {
//                 res.status(200).remove(checklist);
//             } else {
//                 res.status(404).send();
//             }
//         });
//   }
// };

/*******************************************************************************
ENDPOINT
POST /tax_return/:id/document

Params:
taxReturnId

INPUT BODY:
{
  "name": "file.doc",
  "url": "taxplan.com/file.doc",
  "thumbnail_url": "taxplan.com/filename.jpg"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.createDocument = function (req, res) {
// Michael to add implementation
};

/*******************************************************************************
ENDPOINT
DELETE /tax_return/:id/document/:id

Params:
taxReturnId and documentId

RESPONSE:
200 OK
*******************************************************************************/
exports.deleteDocumentById = function (req, res) {
  req.checkParams('id', 'Please provide an integer id').isInt();

  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var id = req.params.id;
      Document.findById(id).then(function(document) {
          if (document) {
              res.status(200).remove(document);
          } else {
              res.status(404).send();
          }
      });
  }
};

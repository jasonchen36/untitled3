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
    req.checkParams('id', 'Please provide an id').isInt();
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

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
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
POST /tax_return/:id/answers

INPUT BODY:
[
{
  questionId:  33,
  taxReturnId: 44,
  text: "Yes"
}
]

RESPONSE:
200 OK
*******************************************************************************/
exports.createAnswer = function (req, res) {
  req.checkBody('questionId', 'Please provide a questionId').isInt();
  req.checkBody('taxReturnId', 'Please provide a taxReturnId').isInt();
  req.checkBody('text', 'Please provide an answer').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var questionId = req.body.questionId;
      var taxReturnId = req.body.taxReturnId;
      var answer = req.body.answer;

      // check that accountId exists
      Question.findById(questionId).then(function(question) {
          if ((!question) || (question.length === 0)) {
              res.status(404).send({ msg: 'Invalid questionID' });
          } else {
              // check that productId exists
              TaxReturn.findById(taxReturnId).then(function(TaxReturn) {
                  if ((!TaxReturn) || (TaxReturn.length === 0)) {
                      res.status(404).send({ msg: 'Invalid TaxReturnID' });
                  } else {
                      var answerObj = {};
                      answerObj.questionId = questionId;
                      answerObj.taxReturnId = taxReturnId;
                      answerObj.answer = answer;

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

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  text: "Yes"
}
*******************************************************************************/
exports.findAnswerById = function (req, res) {
  req.checkParams('id', 'Please provide an integer id').isInt();

  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var id = req.params.id;
      Answer.findById(id).then(function(answer) {
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

INPUT BODY:
{
  taxReturnId: 44,
}

RESPONSE:
[
  { questionId: 33,
    answerId: 44,
   text: "Y" },
  { questionId: 34,
  answerId: 44,
   text: "N" }
]
*******************************************************************************/
exports.listAnswers = function (req, res) {
  req.checkParams('id', 'Please provide an integer id').isInt();

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
{
  addressId: 44
}
*******************************************************************************/
exports.createAddress = function (req, res) {
  req.checkBody('addressLine1', 'Please provide a street address').notEmpty();
  req.checkBody('city', 'Please provide a city').notEmpty();
  req.checkBody('province', 'Please provide a province').notEmpty();
  req.checkBody('postalCode', 'Please provide a postal code').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var addressLine1 = req.body.addressLine1;
      var addressLine2 = req.body.addressLine2;
      var city = req.body.city;
      var province = req.body.province;
      var postalCode = req.body.postalCode;

      // check that addressLine1 exists
      Address.findById(addressLine1).then(function(addressLine1) {
          if ((!addressLine1) || (addressLine1.length === 0)) {
              res.status(404).send({ msg: 'Invalid addressLine1' });
          } else {
              // check that city exists
              Address.findById(city).then(function(city) {
                  if ((!city) || (city.length === 0)) {
                      res.status(404).send({ msg: 'Invalid city' });
                  } else {
                    // check that province exists
                    Address.findById(province).then(function(province) {
                        if ((!province) || (province.length === 0)) {
                            res.status(404).send({ msg: 'Invalid province' });
                        } else {
                          // check that postalCode exists
                          Address.findById(postalCode).then(function(postalCode) {
                              if ((!postalCode) || (postalCode.length === 0)) {
                                  res.status(404).send({ msg: 'Invalid postalCode' });
                              } else {
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
              });
          }
      });
  }
};

/*******************************************************************************
ENDPOINT
PUT /tax_return/:id/address/

INPUT BODY:
{
  addressId: 44,
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
  req.checkBody('addressLine1', 'Please provide a street address').notEmpty();
  req.checkBody('city', 'Please provide a city').notEmpty();
  req.checkBody('province', 'Please provide a province').notEmpty();
  req.checkBody('postalCode', 'Please provide a postal code').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var addressLine1 = req.body.addressLine1;
      var addressLine2 = req.body.addressLine2;
      var city = req.body.city;
      var province = req.body.province;
      var postalCode = req.body.postalCode;

      // check that addressLine1 exists
      Address.findById(addressLine1).then(function(addressLine1) {
          if ((!addressLine1) || (addressLine1.length === 0)) {
              res.status(404).send({ msg: 'Invalid addressLine1' });
          } else {
              // check that city exists
              Address.findById(city).then(function(city) {
                  if ((!city) || (city.length === 0)) {
                      res.status(404).send({ msg: 'Invalid city' });
                  } else {
                    // check that province exists
                    Address.findById(province).then(function(province) {
                        if ((!province) || (province.length === 0)) {
                            res.status(404).send({ msg: 'Invalid province' });
                        } else {
                          // check that postalCode exists
                          Address.findById(postalCode).then(function(postalCode) {
                              if ((!postalCode) || (postalCode.length === 0)) {
                                  res.status(404).send({ msg: 'Invalid postalCode' });
                              } else {
                      var addressObj = {};
                      if (req.body.addressLine1) { addressObj.address_line1 = req.body.addressLine1; }
                      if (req.body.addressLine2) { addressObj.address_line2 = req.body.addressLine2; }
                      if (req.body.city) { addressObj.city = req.body.city; }
                      if (req.body.province) { addressObj.providence = req.body.province; }
                      if (req.body.postalCode) { addressObj.postal_code = req.body.postalCode; }

                      return Address.update(addressId, addressObj).then(function(addressObjId) {
                          var resultObj = {};
                          resultObj.addressLine1 = addressLine1;
                          resultObj.addressLine2 = addressLine2;
                          resultObj.city = city;
                          resultObj.province = province;
                          resultObj.postalCode = postalCode;

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
  req.checkParams('id', 'Please provide an integer id').isInt();

  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var id = req.params.id;
      Address.findById(id).then(function(address) {
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

INPUT BODY:

RESPONSE:
200 OK
*******************************************************************************/
exports.linkExistingAddresses = function (req, res) {
    var id = req.params.id;
    res.status(200).send("OK");
};

/*******************************************************************************
ENDPOINT
POST /tax_return/:id/dependent

INPUT BODY:
{
  taxReturnId:  44,
  firstName: "Jason",
  lastName: "Chen",
  dateOfBirth: "08/07/1988",
  relationship: "son"
}

RESPONSE:
200 OK
{
  dependentId: 4
}
*******************************************************************************/
exports.createDependent = function (req, res) {
  req.checkBody('taxReturnId', 'Please provide a taxReturnId').isInt();
  req.checkBody('firstName', 'Please provide a firstName').notEmpty();
  req.checkBody('lastName', 'Please provide a lastName').notEmpty();
  req.checkBody('dateOfBirth', 'Please provide a dateOfBirth').notEmpty();
  req.checkBody('relationship', 'Please provide a relationship').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var taxReturnId = req.body.taxReturnId;
      var firstName = req.body.firstName;
      var lastName = req.body.lastName;
      var dateOfBirth = req.body.dateOfBirth;
      var relationship = req.body.relationship;

      // check that taxReturnId exists
      Dependent.findById(taxReturnId).then(function(taxReturnId) {
          if ((!taxReturnId) || (taxReturnId.length === 0)) {
              res.status(404).send({ msg: 'Invalid taxReturnId' });
          } else {
              // check that firstName exists
              Dependent.findById(firstName).then(function(firstName) {
                  if ((!firstName) || (firstName.length === 0)) {
                      res.status(404).send({ msg: 'Invalid firstName' });
                  } else {
                    // check that lastName exists
                    Dependent.findById(lastName).then(function(lastName) {
                        if ((!lastName) || (lastName.length === 0)) {
                            res.status(404).send({ msg: 'Invalid lastName' });
                        } else {
                          // check that dateOfBirth exists
                          Dependent.findById(dateOfBirth).then(function(dateOfBirth) {
                              if ((!dateOfBirth) || (dateOfBirth.length === 0)) {
                                  res.status(404).send({ msg: 'Invalid dateOfBirth' });
                              } else {
                                // check that relationship exists
                                Dependent.findById(relationship).then(function(relationship) {
                                    if ((!relationship) || (relationship.length === 0)) {
                                        res.status(404).send({ msg: 'Invalid relationship' });
                                    } else {
                      var dependentObj = {};
                      dependentObj.taxReturnId = taxReturnId;
                      dependentObj.firstName = firstName;
                      dependentObj.lastName = lastName;
                      dependentObj.dateOfBirth = dateOfBirth;
                      dependentObj.relationship = relationship;

                      return Dependent.create(dependentObj).then(function(dependentObjId) {
                          var resultObj = {};
                          resultObj.taxReturnId = taxReturnId;
                          resultObj.firstName = firstName;
                          resultObj.lastName = lastName;
                          resultObj.dateOfBirth = dateOfBirth;
                          resultObj.relationship = relationship;

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
PUT /tax_return/:id/dependent/:id

INPUT BODY:
{
  dependentId: 4,     Mandatory
  taxReturnId:  "44",    Mandatory
  firstName: "Jason",    Optional
  lastName: "Chen",       Optional
  dateOfBirth: "08/07/1988",    Optional
  relationship: "son"        Optional
}

RESPONSE:
200 OK
*******************************************************************************/
exports.updateDependent = function (req, res) {
  req.checkBody('taxReturnId', 'Please provide a taxReturnId').isInt();
  req.checkBody('firstName', 'Please provide a firstName').notEmpty();
  req.checkBody('lastName', 'Please provide a lastName').notEmpty();
  req.checkBody('dateOfBirth', 'Please provide a dateOfBirth').notEmpty();
  req.checkBody('relationship', 'Please provide a relationship').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var taxReturnId = req.body.taxReturnId;
      var firstName = req.body.firstName;
      var lastName = req.body.lastName;
      var dateOfBirth = req.body.dateOfBirth;
      var relationship = req.body.relationship;

      // check that taxReturnId exists
      Dependent.findById(taxReturnId).then(function(taxReturnId) {
          if ((!taxReturnId) || (taxReturnId.length === 0)) {
              res.status(404).send({ msg: 'Invalid taxReturnId' });
          } else {
              // check that firstName exists
              Dependent.findById(firstName).then(function(firstName) {
                  if ((!firstName) || (firstName.length === 0)) {
                      res.status(404).send({ msg: 'Invalid firstName' });
                  } else {
                    // check that lastName exists
                    Dependent.findById(lastName).then(function(lastName) {
                        if ((!lastName) || (lastName.length === 0)) {
                            res.status(404).send({ msg: 'Invalid lastName' });
                        } else {
                          // check that dateOfBirth exists
                          Dependent.findById(dateOfBirth).then(function(dateOfBirth) {
                              if ((!dateOfBirth) || (dateOfBirth.length === 0)) {
                                  res.status(404).send({ msg: 'Invalid dateOfBirth' });
                              } else {
                                // check that relationship exists
                                Dependent.findById(relationship).then(function(relationship) {
                                    if ((!relationship) || (relationship.length === 0)) {
                                        res.status(404).send({ msg: 'Invalid relationship' });
                                    } else {
                      var dependentObj = {};
                      if (req.body.taxReturnId) { dependentObj.tax_return_id = req.body.taxReturnId; }
                      if (req.body.firstName) { dependentObj.first_name = req.body.firstName; }
                      if (req.body.lastName) { dependentObj.last_name = req.body.lastName; }
                      if (req.body.dateOfBirth) { dependentObj.date_of_birth = req.body.dateOfBirth; }
                      if (req.body.relationship) { dependentObj.relationship = req.body.relationship; }

                      return Dependent.update(dependentId,dependentObj).then(function(dependentObjId) {
                          var resultObj = {};
                          resultObj.taxReturnId = taxReturnId;
                          resultObj.firstName = firstName;
                          resultObj.lastName = lastName;
                          resultObj.dateOfBirth = dateOfBirth;
                          resultObj.relationship = relationship;

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
GET /tax_return/:id/dependent/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  taxReturnId:  44,
  firstName: "Jason",
  lastName: "Chen",
  dateOfBirth: "08/07/1988",
  relationship: "son"
}
*******************************************************************************/
exports.findDependentById = function (req, res) {
  req.checkParams('id', 'Please provide an integer id').isInt();

  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var id = req.params.id;
      Dependent.findById(id).then(function(dependent) {
          if (dependent) {
              res.status(200).send(dependent);
          } else {
              res.status(404).send();
          }
      });
  }
};


/*******************************************************************************
ENDPOINT
POST /tax_return/:id/dependent/:id

INPUT BODY:

RESPONSE:
200 OK

*******************************************************************************/
exports.linkExistingDependents = function (req, res) {
    var id = req.params.id;

    res.status(200).send("OK");
};

/*******************************************************************************
ENDPOINT
GET /tax_return/:id/checklist

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
[
 {checklistId: 4,
  name: "T5",
  documents: [
    {
    documentId: 4,
    name: "filename.txt",
    url: "taxplan.com",
    thumbnailUrl: "taxplan.com/taxplan.jpg"
    },
    {
    documentId: 5,
    name: "filename2.txt",
    url: "taxplan.com",
    thumbnailUrl: "taxplan.com/taxplan2.jpg"
    }
  ]
 }
]
*******************************************************************************/
exports.findChecklist = function (req, res) {
    req.checkParams('id', 'Please provide an integer id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var id = req.params.id;
        Checklist.findById(id).then(function(checklist) {
            if (checklist) {
                res.status(200).remove(checklist);
            } else {
                res.status(404).send();
            }
        });
  }
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
  req.checkBody('name', 'Please provide a name').isInt();
  req.checkBody('url', 'Please provide a url').isInt();
  req.checkBody('thumbnailUrl', 'Please provide a thumbnailUrl').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
      res.status(400).send(errors);
  } else {
      var name = req.body.name;
      var url = req.body.url;
      var thumbnailUrl = req.body.thumbnailUrl;

      // check that name exists
      Document.findById(name).then(function(name) {
          if ((!name) || (name.length === 0)) {
              res.status(404).send({ msg: 'Invalid name' });
          } else {
              // check that url exists
              Document.findById(url).then(function(url) {
                  if ((!url) || (url.length === 0)) {
                      res.status(404).send({ msg: 'Invalid url' });
                  } else {
                    // check that thumbnailUrl exists
                    Document.findById(thumbnailUrl).then(function(thumbnailUrl) {
                        if ((!thumbnailUrl) || (url.length === 0)) {
                            res.status(404).send({ msg: 'Invalid thumbnailUrl' });
                        } else {
                      var DocumentObj = {};
                      DocumentObj.name = name;
                      DocumentObj.url = url;
                      DocumentObj.thumbnailUrl = thumbnailUrl;

                      return Document.create(documentObj).then(function(documentId) {
                          var resultObj = {};
                          resultObj.name = name;
                          resultObj.url = url;
                          resultObj.thumbnailUrl  = thumbnailUrl;

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
DELETE /tax_return/:id/document/:id

INPUT BODY:
None. req.params.id is the only input (no body)

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

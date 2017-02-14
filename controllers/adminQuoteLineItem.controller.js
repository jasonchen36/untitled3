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
var quoteModel = require('../models/quote.model');
var productModel = require('../models/product.model');
var accountModel = require('../models/account.model');
var userModel = require('../models/user.model');
var taxReturnModel = require('../models/tax_return.model');
var adminQuoteLineItemModel = require('../models/adminQuoteLineItem.model');
var logger = require('../services/logger.service');
var cacheService = require('../services/cache.service');
var stringHelper = require('../helpers/stringHelper');


var validateTaxReturnId = function(taxReturnId, validationErrors) {
    return taxReturnModel.checkIdExists(taxReturnId).then(function(isValid) {
        if (!isValid) {
            validationErrors.push({taxReturnId: taxReturnId,
                                      error: 'taxReturnId = ' + taxReturnId + ' does not exist'});
        }
    }).catch(function(err) {
        next(err);
    });
};
/*******************************************************************************
ENDPOINT
POST /quote/:quoteId/adminQuoteLineItem

Params:
quoteId

INPUT BODY:
{
  taxReturnId: 104,
  text: 'line item text',
  value: 10.00
}

RESPONSE:
200 OK
 ******************************************************************************/
 exports.create = function (req, res, next) {
    req.checkParams('quoteId', 'Please provide a quoteId').isInt();
 //   req.checkBody('taxReturnId', 'Please provide a taxReturnId').isInt();
    req.checkBody('text', 'Please provide a text description').notEmpty();
    req.checkBody('value', 'Please provide a value').notEmpty();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var adminQuoteLineItemObj = {};
    adminQuoteLineItemObj.quoteId = parseInt(req.params.quoteId);
    
    adminQuoteLineItemObj.text = req.body.text;
    adminQuoteLineItemObj.value = req.body.value;
    if ((req.body.notes) && (req.body.notes.length !==0)) {
        adminQuoteLineItemObj.notes = req.body.notes;
    }

    var validationPromises = [];
    var validationErrors = [];

    if(req.body.taxReturnId) {
      adminQuoteLineItemObj.taxReturnId = parseInt(req.body.taxReturnId);
          validationPromises.push(validateTaxReturnId(adminQuoteLineItemObj.taxReturnId, validationErrors));
    }

    Promise.all(validationPromises).then(function() {
       if (validationErrors && validationErrors.length > 0) {
           return res.status(400).send(validationErrors);
       }

        return adminQuoteLineItemModel.hasAccess(req.user, adminQuoteLineItemObj.quoteId).then(function(allowed) {
            if (!allowed) {
                return res.status(403).send();
            }
            return adminQuoteLineItemModel.create(adminQuoteLineItemObj).then(function() {
                res.status(200).send();
            }).catch(function(err) {
                next(err);
            });
        });
    });
};


/*******************************************************************************
ENDPOINT
GET /quote/:quoteId/adminQuoteLineItem/adminQuoteLineItemId

Params:
id

RESPONSE:
{
}

*******************************************************************************/
exports.getById = function (req, res, next) {
    req.checkParams('quoteId', 'Please provide a quoteId').isInt();
    req.checkParams('adminQuoteLineItemId', 'Please provide a adminQuoteLineItemId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var quoteId = parseInt(req.params.quoteId);
    var adminQuoteLineItemId = parseInt(req.params.adminQuoteLineItemId);
    return adminQuoteLineItemModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        return adminQuoteLineItemModel.findById(adminQuoteLineItemId).then(function(adminQuoteLineItemQbj) {
            if (!adminQuoteLineItemQbj) {
                return res.status(404).send();
            }
            return res.status(200).send(adminQuoteLineItemQbj);
        }).catch(function(err) {
            next(err);
        });
    });
};

/*******************************************************************************
 ENDPOINT
 PUT /quote/:id/adminQuoteLineItem/:adminQuoteLineItemId

 Params:
 quoteId and adminQuoteLineItemId

 INPUT BODY:
{
  taxReturnId: 104,
  text: 'line item text',
  value: 10.00
}

 RESPONSE:
 200 OK
 *******************************************************************************/
exports.updateById = function (req, res, next) {
    req.checkParams('quoteId', 'Please provide a quoteId').isInt();
    req.checkParams('adminQuoteLineItemId', 'Please provide a adminQuoteLineItemId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var quoteId = parseInt(req.params.quoteId);
    var adminQuoteLineItemId = parseInt(req.params.adminQuoteLineItemId);
    if ((req.body.taxReturnId) && (req.body.taxReturnId.length !==0)) {
        var taxReturnId = req.body.taxReturnId;
    }
    if ((req.body.text) && (req.body.text.length !==0)) {
        var text = req.body.text;
    }
    if ((req.body.value) && (req.body.value.length !==0)) {
        var value = req.body.value;
    }
    if ((req.body.notes) && (req.body.notes.length !==0)) {
        var notes = req.body.notes;
    }

    return adminQuoteLineItemModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }
        // check that lineItemId exists
        return adminQuoteLineItemModel.findById(adminQuoteLineItemId).then(function(adminQuoteLineItem) {
            if ((!adminQuoteLineItem) || (adminQuoteLineItem.length === 0)) {
                return res.status(404).send({ msg: 'Line item not found' });
            }
            var adminQuoteLineItemObj = {};
            if (taxReturnId) { adminQuoteLineItemObj.text = taxReturnId; }
            if (text) { adminQuoteLineItemObj.text = text; }
            if (value) { adminQuoteLineItemObj.value = value; }
            if (notes) { adminQuoteLineItemObj.notes = notes; }

            return adminQuoteLineItemModel.update(adminQuoteLineItemId,adminQuoteLineItemObj).then(function() {
                var resultObj = {};
                resultObj.id = adminQuoteLineItemId;
                resultObj.quoteId = quoteId;
                if (taxReturnId) { resultObj.taxReturnId = taxReturnId; }
                if (text) { resultObj.text = text; }
                if (value) { resultObj.value = value; }
                if (notes) { resultObj.notes = notes; }

                res.status(200).json(resultObj);
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
DELETE /quote/:quoteId/adminQuoteLineItem/:adminQuoteLineItemId

Params:
quoteId and adminQuoteLineItemId

RESPONSE:
200 OK or 404
*******************************************************************************/
exports.deleteById = function (req, res, next) {
    req.checkParams('quoteId', 'Please provide an integer quoteId').isInt();
    req.checkParams('adminQuoteLineItemId', 'Please provide an integer adminQuoteLineItemId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var quoteId = parseInt(req.params.quoteId);
    return adminQuoteLineItemModel.hasAccess(req.user, quoteId).then(function(allowed) {
        if (!allowed) {
            return res.status(403).send();
        }

        var adminQuoteLineItemId = parseInt(req.params.adminQuoteLineItemId);
        return adminQuoteLineItemModel.findById(adminQuoteLineItemId).then(function(adminQuoteLineItemObj) {
            if (!adminQuoteLineItemObj) {
                return res.status(404).send();
            }
            return adminQuoteLineItemModel.deleteById(quoteId, adminQuoteLineItemId).then(function() {
                res.status(200).send('Ok');
            }).catch(function(err) {
                next(err);
            });
        }).catch(function(err) {
            next(err);
        });
    });
};

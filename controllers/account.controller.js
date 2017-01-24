/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var config = require('../config/config');
var _ = require('underscore');
var validator = require('express-validator');
var accountModel = require('../models/account.model');
var logger = require('../services/logger.service');


/*******************************************************************************
ENDPOINT
POST /account

INPUT BODY:
{
  "name":  "Michael",
  "productId":  12345
}

RESPONSE:
200 OK
*******************************************************************************/
exports.create = function (req, res, next) {
    req.checkBody('name', 'Please provide a name').notEmpty();
    req.checkBody('productId', 'Please provide a productId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var accountObj = {};
    accountObj.name = req.body.name;
    accountObj.pushNotifications = req.body.pushNotifications;
    accountObj.emailNotifications = req.body.emailNotifications;
    accountObj.taxProId = req.body.taxProId;
    return accountModel.create(accountObj).then(function(insertId) {
        return accountModel.findById(insertId).then(function(accountObj) {
            if ((!accountObj) || (accountObj.length === 0)) {
                return res.status(500).send("Internal Error");
            }
            var resultObj = {
                accountId: accountObj.id,
                name: accountObj.name,
                pushNotifications: accountObj.pushNotifications,
                emailNotifications: accountObj.emailNotifications,
                taxProId: accountObj.taxProId
            };
            return res.status(200).send(resultObj);
        }).catch(function(err) {
            next(err);
        });
    }).catch(function(err) {
        next(err);
    });
};

/*******************************************************************************
ENDPOINT
GET /account/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  userId: 913,
  name: "Frank"
}
*******************************************************************************/
exports.findById = function (req, res, next) {
    req.checkParams('id', 'Please provide an Account Id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var accountId = parseInt(req.params.id);

    return accountModel.findById(accountId).then(function(accountObj) {
        if ((!accountObj) || (accountObj.length === 0)) {
            return res.status(404).send();
        }
        var resultObj = {};
        resultObj.accountId = accountObj.id;
        resultObj.name = accountObj.name;
        resultObj.taxReturns = accountObj.taxReturns;
        resultObj.quotes = accountObj.quotes;
        resultObj.pushNotifications = accountObj.pushNotifications;
        resultObj.emailNotifications = accountObj.emailNotifications;
        resultObj.taxProId = accountObj.taxProId;

        return res.status(200).send(resultObj);
    }).catch(function(err) {
        next(err);
    });
};

/*******************************************************************************
ENDPOINT
PUT /account/:id

INPUT BODY:
{
  "name":  "Michael",
  "productId":  12345
}

RESPONSE:
200 OK
*******************************************************************************/

exports.update = function (req, res, next) {
    req.checkParams('id', 'Please provide an accountId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var accountId = parseInt(req.params.id);

    var keys = ['name', 'push_notifications', 'email_notifications', 'taxpro_id'];

    return accountModel.findById(accountId).then(function(accountObj) {
        if ((!accountObj) || (accountObj.length === 0)) {
            return res.status(404).send();
        }

        var params = [];
        if ((req.body.name) && (req.body.name.length > 0)) {
            params['name'] = req.body.name;
        }
        if ((req.body.pushNotifications) && (req.body.pushNotifications.length > 0)) {
            if (req.body.pushNotifications.toUpperCase() === 'YES') {
                params['push_notifications'] = 'Yes';
            } else {
                if (req.body.pushNotifications.toUpperCase() === 'NO') {
                    params['push_notifications'] = 'No';
                }
            }
        }
        if ((req.body.emailNotifications) && (req.body.emailNotifications.length > 0)) {
            if (req.body.emailNotifications.toUpperCase() === 'YES') {
                params['email_notifications'] = 'Yes';
            } else {
                if (req.body.emailNotifications.toUpperCase() === 'NO') {
                    params['email_notifications'] = 'No';
                }
            }
        }
        if ((req.body.taxproId) && (req.body.taxproId.length > 0)) {
            params['taxpro_id'] = req.body.taxproId;
        }


        _.each(params, function(value, key) {
            user[key] = value;
        });

        return accountModel.updateById(accountId, params)
        .then(function() {
            return accountModel.findById(accountId);
        })
        .then(function(account) {
            if (!account) {
                return res.status(404).send();
            }
            return res.status(200).send(account);
        }).catch(function(err) {
            next(err);
        });
    }).catch(function(err) {
        next(err);
    });
};

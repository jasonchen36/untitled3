/*jslint node: true */

'use strict';

// account controller

/**
 * Module dependencies.
 */
var logger = require('../services/logger.service');
var Account = require('../models/account.model');
var validator = require('express-validator');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');

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
exports.create = function (req, res) {
    req.checkBody('name', 'Please provide a name').notEmpty();
    req.checkBody('productId', 'Please provide a productId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var accountObj = {};
        accountObj.name = req.body.name;
        accountObj.pushNotifications = req.body.pushNotifications;
        accountObj.emailNotifications = req.body.emailNotifications;
        accountObj.taxProId = req.body.taxProId;
        return Account.create(accountObj).then(function(insertId) {
            return Account.findById(insertId).then(function(account) {
                if ((!account) || (account.length === 0)) {
                    res.status(500).send("Internal Error");
                } else {
                    var jsonData = {
                        accountId: account.id,
                        name: account.name,
                        pushNotifications: account.pushNotifications,
                        emailNotifications: account.emailNotifications,
                        taxProId: account.taxProId
                    };
                    res.status(200).send(jsonData);
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
GET /account/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
{
  userId: 913,
  name: "Frank"
}
*******************************************************************************/
exports.findById = function (req, res) {
    req.checkParams('id', 'Please provide an Account Id').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var id = parseInt(req.params.id);

        return Account.findById(id).then(function(account) {
            if ((!account) || (account.length === 0)) {
                res.status(404).send();
            } else {
                var accountObj = {};
                accountObj.accountId = account.id;
                accountObj.name = account.name;
                accountObj.taxReturns = account.taxReturns;
                accountObj.quotes = account.quotes;
                accountObj.pushNotifications = account.pushNotifications;
                accountObj.emailNotifications = account.emailNotifications;
                accountObj.taxProId = account.taxProId;

                res.status(200).send(accountObj);
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
PUT /account/:id

INPUT BODY:
{
  "name":  "Michael",
  "productId":  12345
}

RESPONSE:
200 OK
*******************************************************************************/

exports.update = function (req, res) {
    req.checkParams('id', 'Please provide an accountId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var accountId = parseInt(req.params.id);
        var keys = ['name', 'push_notifications', 'email_notifications', 'taxpro_id'];

        return Account.findById(accountId).then(function(account) {
            if ((!account) || (account.length === 0)) {
                res.status(404).send();
                return;
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

            return Account.updateById(accountId, params)
            .then(function() {
                return Account.findById(accountId);
            })
            .then(function(account) {
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
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

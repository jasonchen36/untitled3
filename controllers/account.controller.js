/*jslint node: true */

'use strict';

// account controller

/**
 * Module dependencies.
 */
var logger = require('../services/logger.service');
var account = require('../models/account.model');
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
        account.create(accountObj).then(function(insertId) {
            account.findById(insertId).then(function(account) {
                if ((!account) || (account.length === 0)) {
                    res.status(500).send("Internal Error");
                } else {
                    var jsonData = {
                        accountId: account.id,
                        name: account.name
                    };
                    res.status(200).send(jsonData);
                }
            });
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
        var id = req.params.id;

        account.findById(id).then(function(account) {
            if ((!account) || (account.length === 0)) {
                res.status(404).send();
            } else {
                var accountObj = {};
                accountObj.accountId = account.id;
                accountObj.name = account.name;

                res.status(200).send(accountObj);
            }
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
    req.checkBody('name', 'Please provide a name').notEmpty();
    req.checkBody('productId', 'Please provide a productId').isInt();
    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var accountObj = {};
        accountObj.name = req.body.name;
        account.create(accountObj).then(function(insertId) {
            account.findById(insertId).then(function(account) {
                if ((!account) || (account.length === 0)) {
                    res.status(500).send("Internal Error");
                } else {
                    var jsonData = {
                        accountId: account.id,
                        name: account.name
                    };
                    res.status(200).send(jsonData);
                }
            });
        });
    }
};

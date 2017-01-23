/*jslint node: true */

'use strict';
/**
 * Module dependencies.
 */
var config = require('../config/config');
var logger = require('../services/logger.service');
var Categories = require('../models/categories.model');
var _ = require('underscore');

/*******************************************************************************
ENDPOINT
GET /categories

RESPONSE:

[
  {
    "id": 1,
    "name": "Income",
    "displaytext": "Please add the following income information?",
    "secondarytext": null,
    "created_at": "2016-11-16T23:56:04.000Z",
    "updated_at": "2016-11-17T22:15:44.000Z"
  },
  {
    "id": 2,
    "name": "Credits",
    "displaytext": "Hi % do you have these credits:",
    "secondarytext": null,
    "created_at": "2016-11-16T23:56:11.000Z",
    "updated_at": "2016-11-17T22:15:45.000Z"
  }
]

*******************************************************************************/
exports.list = function (req, res) {
    return Categories.list().then(function(categoriesArr) {
        if (categoriesArr) {
            return res.status(200).send(categoriesArr);
        } else {
            return res.status(404).send();
        }
    }).catch(function(err) {
        next();
    });
};

/*******************************************************************************
 ENDPOINT
 GET /categories/:id

 RESPONSE:

 [
 {
   "id": 2,
   "name": "Credits",
   "displaytext": "Hi % do you have these credits:",
   "secondarytext": null,
   "created_at": "2016-11-16T23:56:11.000Z",
   "updated_at": "2016-11-17T22:15:45.000Z"
 }
 ]

 *******************************************************************************/

exports.getCategoryById = function (req, res, next){
    req.checkParams('id', 'Please provide a category id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        return Categories.getCategoryById(req.params.id).then(function(categoryObj){
            if (categoryObj) {
                return res.status(200).send(categoryObj);
            } else {
                return res.status(404).send();
            }
        }).catch(function(err) {
            next();
        });
    }
};

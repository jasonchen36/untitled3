/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var config = require('../config/config');
var _ = require('underscore');
var questionModel = require('../models/question.model');
var logger = require('../services/logger.service');
var stringHelper = require('../helpers/stringHelper');

/*******************************************************************************
ENDPOINT
GET /questions/product/:id/category/:id

INPUT BODY:
None. req.params.id is the only input (no body)

RESPONSE:
[
  {
    "question_id": 79,
    "product_id": 10,
    "created_at": "2016-11-17T22:55:14.000Z",
    "updated_at": "2016-11-17T22:55:14.000Z",
    "id": 79,
    "category_id": 2,
    "text": "I take public transit regularly",
    "instructions": "You can claim cost of monthly public transit passes or passes or longer duration such as an annual pass for travel within Canada on public transit.",
    "type": "Choice",
    "has_multiple_answers": 0
  },
  {
    "question_id": 80,
    "product_id": 10,
    "created_at": "2016-11-17T22:55:14.000Z",
    "updated_at": "2016-11-17T22:55:14.000Z",
    "id": 80,
    "category_id": 2,
    "text": "My child(ren) is involved in the arts or sports ",
    "instructions": "",
    "type": "Choice",
    "has_multiple_answers": 0
  }
]
*******************************************************************************/
exports.findByCategoryId = function(req, res, next) {
    req.checkParams('productId', 'Please provide a product id').isInt();
    req.checkParams('categoryId', 'Please provide a category id').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var productId = parseInt(req.params.productId);
    var categoryId = parseInt(req.params.categoryId);
    return questionModel.findByProductIdCategoryId(productId, categoryId).then(function(questionArr) {
        if (!questionArr) {
            return res.status(404).send();
        }
        _.forEach(questionArr, function(questionObj) {
           questionObj.text = stringHelper.cleanString(questionObj.text);
           questionObj.instructions = stringHelper.cleanString(questionObj.instructions);
           questionObj.category_name = stringHelper.cleanString(questionObj.category_name);
           questionObj.category_displaytext = stringHelper.cleanString(questionObj.category_displaytext);
           questionObj.category_secondarytext = stringHelper.cleanString(questionObj.category_secondarytext);
        });
        return res.status(200).send(questionArr);
    }).catch(function(err) {
        next(err);
    });
};

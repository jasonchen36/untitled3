/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
//var db = require('../services/db');
var logger = require('../services/logger.service');
var Account = require('../models/account.model');
var Product = require('../models/product.model');
var Question = require('../models/question.model');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');

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
exports.findByCategoryId = function(req, res) {
    req.checkParams('productId', 'Please provide a product id').isInt();
    req.checkParams('categoryId', 'Please provide a category id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var productId = req.params.productId;
        var categoryId = req.params.categoryId;
        return Question.findByProductIdCategoryId(productId, categoryId).then(function(question) {
            if (question) {
                res.status(200).send(question);
            } else {
                res.status(404).send();
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(400).send({msg: err.message});
            return;
        });
    }
};

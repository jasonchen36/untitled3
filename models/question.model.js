/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Question = {
    findById: function(questionId) {
        if ((!questionId) || (questionId.length === 0)) {
            return Promise.reject(new Error('No questionId specified!'));
        }
        var questionSql = 'SELECT * FROM questions WHERE id = ?';
        return db.knex.raw(questionSql, [questionId]).then(function(questionSqlResults) {
            return questionSqlResults[0][0];
        });
    },

    create: function(questionObj) {
        if ((!questionObj.categoryId) || (questionObj.categoryId.length === 0)) {
            return Promise.reject(new Error('No questionId specified!'));
        }
        if ((!questionObj.text) || (questionObj.text.length === 0)) {
            return Promise.reject(new Error('No question specified!'));
        }
        if ((!questionObj.instructions) || (questionObj.instructions.length === 0)) {
            return Promise.reject(new Error('No instructions specified!'));
        }
        if ((!questionObj.type) || (questionObj.type.length === 0)) {
            return Promise.reject(new Error('No type specified!'));
        }
        if ((!questionObj.hasMultipleAnswers) || (questionObj.hasMultipleAnswers.length === 0)) {
            return Promise.reject(new Error('No multiple answers option specified!'));
        }

        var questionInsertSql = 'INSERT INTO questions (category_id, text, instructions, type, has_multiple_answers) VALUES(?, ?, ?, ?, ?)';
        var questionInsertSqlParams = [
            questionObj.categoryId,
            questionObj.text,
            questionObj.instructions,
            questionObj.type,
            questionObj.hasMultipleAnswers
        ];
        return db.knex.raw(questionInsertSql, questionInsertSqlParams).then(function(questionInsertSqlResults) {
            var questionId = questionInsertSqlResults[0].insertId;
            return Promise.resolve(questionId);
        });
    },

    update: function(id, questionObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No questionId specified!'));
        }

        return db.knex('questions').update(questionObj).where('id', id);
    },

    findByProductIdCategoryId: function(productId, categoryId) {
      if ((!productId) || (productId.length === 0)) {
          return Promise.reject(new Error('No productId specified!'));
      }
      if ((!categoryId) || (categoryId.length === 0)) {
          return Promise.reject(new Error('No categoryId specified!'));
      }


      var questionSql = 'SELECT \
                           pq.*, \
                           q.*, \
                           c.name AS category_name, \
                           c.displaytext AS category_displaytext, \
                           c.secondarytext AS category_secondarytext \
                         FROM products_questions AS pq \
                         JOIN questions AS q ON q.id = pq.question_id AND q.category_id = ? \
                         JOIN categories AS c ON c.id = q.category_id \
                         WHERE pq.product_id = ? \
                         ORDER BY sort_order';
      return db.knex.raw(questionSql, [categoryId, productId]).then(function(questionSqlResults) {
          return questionSqlResults[0];
      });
    },

    checkIdExists: function(id) {
        if (!id) {
            return Promise.resolve(false);
        }
        return this.findById(id).then(function(row) {
            if (row) {
                return true;
            } else {
                return false;
            }
        });
    },


    populateQuestions: function() {
        var questionsSql = 'SELECT * FROM `questions`';
        return db.knex.raw(questionsSql, []).then(function(questionsSqlResults) {
            return questionsSqlResults[0];
        });
    }
};

module.exports = Question;

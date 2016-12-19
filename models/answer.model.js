/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Answer = {
    findById: function(answerId) {
        if ((!answerId) || (answerId.length === 0)) {
            return Promise.reject(new Error('No answerId specified!'));
        }
        var answerSql = 'SELECT * FROM answers WHERE id = ?';
        return db.knex.raw(answerSql, [answerId]).then(function(answerSqlResults) {
            return answerSqlResults[0][0];
        });
    },

    create: function(answerObj) {
        if ((!answerObj.questionId) || (answerObj.questionId.length === 0)) {
            return Promise.reject(new Error('No questionId specified!'));
        }
        if ((!answerObj.taxReturnId) || (answerObj.taxReturnId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }
        if ((!answerObj.text) || (answerObj.text.length === 0)) {
            return Promise.reject(new Error('No answer specified!'));
        }

        var answerInsertSql = 'INSERT INTO answers \
                               (question_id, tax_return_id, text) \
                               VALUES(?, ?, ?)\n\
                               ON DUPLICATE KEY UPDATE \
                               id=LAST_INSERT_ID(id), question_id = ?, tax_return_id = ?, text = ?';
        var answerInsertSqlParams = [
            answerObj.questionId,
            answerObj.taxReturnId,
            answerObj.text,
            answerObj.questionId,
            answerObj.taxReturnId,
            answerObj.text
        ];
        return db.knex.raw(answerInsertSql, answerInsertSqlParams).then(function(answerInsertSqlResults) {
            var answerId = answerInsertSqlResults[0].insertId;
            return Promise.resolve(answerId);
        });
    },

    update: function(id, answerObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No answerId specified!'));
        }

        return db.knex('answers').update(answerObj).where('id', id);
    },

    listAnswers: function(taxReturnId, categoryId) {
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }

        var answerSql = '';
        var answerSqlParams = [];

        answerSql = 'SELECT \
                       a.id AS id, \
                       a.question_id AS question_id, \
                       a.tax_return_id AS tax_return_id, \
                       a.text AS text, \
                       a.created_at as created_at, \
                       a.updated_at as updated_at, \
                       q.category_id as category_id, \
                       q.text AS question_text, \
                       q.instructions AS instructions, \
                       q.type AS type, \
                       q.has_multiple_answers AS has_multiple_answers \
                     FROM questions AS q \
                     LEFT JOIN answers AS a ON a.question_id = q.id \
                     WHERE a.tax_return_id = ? OR ISNULL(a.tax_return_id)';
        answerSqlParams = [taxReturnId];

        if (categoryId) {
            answerSql = answerSql + ' AND q.category_id = ?';
            answerSqlParams.push(categoryId);
        }
        return db.knex.raw(answerSql, answerSqlParams).then(function(answerSqlSqlResults) {
            return answerSqlSqlResults[0];
        });
    }
};

module.exports = Answer;

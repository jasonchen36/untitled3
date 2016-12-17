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

    listAnswers: function(taxReturnId) {
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }

        var answerSql = 'SELECT * FROM answers WHERE tax_return_id = ?';
        return db.knex.raw(answerSql, [taxReturnId]).then(function(answerSqlSqlResults) {
            return answerSqlSqlResults[0];
        });
    }
};

module.exports = Answer;

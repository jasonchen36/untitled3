/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Answer = {
    findById: function(answerId) {
        if ((!answerId) || (Answer.length === 0)) {
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

        var answerInsertSql = 'INSERT INTO answers (question_id, tax_return_id, text) VALUES(?, ?, ?)';
        var answerInsertSqlParams = [
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

        return db.knex('answer').update(answerObj).where('id', id);
    }
};

module.exports = Answer;

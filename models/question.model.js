/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Question = {
    findById: function(questionId) {
        if ((!questionId) || (question.length === 0)) {
            return Promise.reject(new Error('No questionId specified!'));
        }
        var questionSql = 'SELECT * FROM question WHERE id = ?';
        return db.knex.raw(questionSql, [questionId]).then(function(questionSqlResults) {
            return questionSqlResults[0][0];
        });
    },

    create: function(questionObj) {
        if ((!questionObj.questionId) || (questionObj.questionId.length === 0)) {
            return Promise.reject(new Error('No questionId specified!'));
        }
        if ((!questionObj.taxReturnId) || (questionObj.taxReturnId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }
        if ((!questionObj.text) || (questionObj.text.length === 0)) {
            return Promise.reject(new Error('No question specified!'));
        }

        var questionInsertSql = 'INSERT INTO question (question_id, tax_return_id, text) VALUES(?, ?, ?)';
        var questionInsertSqlParams = [
            questionObj.questionId,
            questionObj.taxReturnId,
            questionObj.text
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

        return db.knex('question').update(questionObj).where('id', id);
    }
};

module.exports = question;

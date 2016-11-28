/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Question = {
    findById: function(questionId) {
        if ((!questionId) || (Question.length === 0)) {
            return Promise.reject(new Error('No questionId specified!'));
        }
        var questionSql = 'SELECT * FROM question WHERE id = ?';
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

        var questionInsertSql = 'INSERT INTO question (category_id, text, instructions, type, has_multiple_answers) VALUES(?, ?, ?, ?, ?)';
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

        return db.knex('question').update(questionObj).where('id', id);
    }
};

module.exports = Question;

/*jslint node: true */

'use strict';

var db = require('../services/db');
var crypto = require('crypto');
var _ = require('lodash');
var logger = require('../services/logger.service');
var config = require('../config/config');


var Note = {
    create: function(noteObj) {
        if (!noteObj.user_id || !noteObj.note || !noteObj.note_taker_id) {
          return Promise.reject(new Error('No user, note or note taker id specified.'));
        }

        var sql = 'INSERT INTO notes (user_id, note_taker_id, note) VALUES (?, ?, ?)';
        var sqlParams = [
          noteObj.user_id,
          noteObj.note_taker_id,
          noteObj.note];

        return db.knex.raw(sql, sqlParams)
          .then(function(results) {
            return results[0];
          });
    },
    findAllByUserId: function(userId) {
        var sql = 'SELECT * FROM notes WHERE user_id = ?';
        var sqlParams = [userId];

        return db.knex.raw(sql, sqlParams).then(function(results) {
            return(results[0]);
        });
    },
    markAsDone: function(noteId,userId,markAsDone) {
      markAsDone = markAsDone === false ? 0 : 1;

      var sql = 'UPDATE notes SET done = ? WHERE id = ? AND user_id = ?';
      var sqlParams = [markAsDone,noteId,userId];

      return db.knex.raw(sql,sqlParams)
        .then(function(results) {
            return results[0].affectedRows;
        });
    },
    deleteById: function(id, userId) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject(new Error('deleteById() No id specified!'));
        }
        var userDeleteSql = 'DELETE FROM notes WHERE id = ? AND user_id = ?';
        return db.knex.raw(userDeleteSql, [id, userId])
          .then(function(results) {
              return results[0].affectedRows;
          });
    }
};


module.exports = Note;

/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Message = {
    findAllById: function(id) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject('No id specified!');
        }
        var messageSql = 'SELECT * FROM messages WHERE client_id = ? or from_id = ?';
        return db.knex.raw(messageSql, [id, id]).then(function(messageSqlResults) {
            return(messageSqlResults[0]);
        });
    },

    findOneById: function(messageId, clientId, isAdmin) {
        if ((!messageId) || (messageId.length === 0)) {
          return Promise.reject('No messageId specified!');
        }
        if ((!isAdmin) && ((!clientId) || (clientId.length === 0))) {
          return Promise.reject('No clientId specified!');
        }
        var messageSql = '';
        var messageSqlParams = [];
        if (isAdmin) {
            messageSql = 'SELECT * FROM messages WHERE id = ?';
            messageSqlParams = [messageId];
        } else {
            messageSql = 'SELECT * FROM messages WHERE id = ? and client_id = ?';
            messageSqlParams = [messageId, clientId];
        }
        return db.knex.raw(messageSql, messageSqlParams).then(function(messageSqlResults) {
            return(messageSqlResults[0][0]);
        });
    },

    create: function(messageObj) {
        if ((!messageObj.client) || (messageObj.client.length === 0)) {
          return Promise.reject('No client specified!');
        }
        if ((!messageObj.from) || (messageObj.from.length === 0)) {
          return Promise.reject('No from specified!');
        }

        var messageInsertSql = 'INSERT INTO messages (status, body, subject, client_id, fromname, from_id) VALUES(?, ?, ?, ?, ?, ?)';
        var messageInsertSqlParams = [
          messageObj.status,
          messageObj.body,
          messageObj.subject,
          messageObj.client,
          messageObj.fromname,
          messageObj.from
//          messageObj.date
        ];
        return db.knex.raw(messageInsertSql, messageInsertSqlParams).then(function(messageInsertSqlResults) {
          return messageInsertSqlResults[0][0];
        });
    },


    setReadStatusById: function(id) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject('No id specified!');
        }

        var messageSql = 'UPDATE messages SET status="read" WHERE id = ?';
        return db.knex.raw(messageSql, [id]);
    }
};

module.exports = Message;

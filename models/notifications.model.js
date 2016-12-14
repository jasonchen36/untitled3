/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Notifications = {
    create: function(notificationObj) {
        if ((!notificationObj.user_id) || (notificationObj.user_id.length === 0)) {
          return Promise.reject('No user_id specified!');
        }
        if ((!notificationObj.message) || (notificationObj.message.length === 0)) {
          return Promise.reject('No message specified!');
        }

        var notificationInsertSql = 'INSERT INTO notifications (user_id, message, is_read) VALUES(?, ?, 0)';
        var notificationInsertSqlParams = [
          notificationObj.user_id,
          notificationObj.message
        ];
        return db.knex.raw(notificationInsertSql, notificationInsertSqlParams).then(function(notificationInsertSqlResults) {
          return notificationInsertSqlResults[0][0];
        });
    },

    listAll: function(userId) {
        var notificationsSql = 'SELECT * FROM notifications WHERE user_id = ?';
        return db.knex.raw(notificationsSql, [userId]).then(function(notificationsSqlResults) {
            return(notificationsSqlResults[0]);
        });
    },

    listUnread: function(userId) {
        var notificationsSql = 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0';
        return db.knex.raw(notificationsSql, [userId]).then(function(notificationsSqlResults) {
            return(notificationsSqlResults[0]);
        });
    },

    findById: function(userId, id, isAdmin) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var notificationsSql = '';
        var notificationsSqlParams = [];
        if (isAdmin) {
            notificationsSql = 'SELECT * FROM notifications WHERE id = ?';
            notificationsSqlParams = [id];
        } else {
            notificationsSql = 'SELECT * FROM notifications WHERE user_id = ? AND id = ?';
            notificationsSqlParams = [userId, id];
        }
        return db.knex.raw(notificationsSql, notificationsSqlParams).then(function(notificationsSqlResults) {
            return(notificationsSqlResults[0][0]);
        });
    },

    setReadStatusById: function(id) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject('No id specified!');
        }

        var notificationsSql = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
        return db.knex.raw(notificationsSql, [id]);
    }
};


module.exports = Notifications;
/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Notifications = {
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
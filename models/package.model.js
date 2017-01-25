/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');
var _ = require('lodash');;
var logger = require('../services/logger.service');

var Package = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var packageSql = 'SELECT * FROM packages WHERE id = ?';
        return db.knex.raw(packageSql, [id]).then(function(packageResultObj) {
            return (packageResultObj[0][0]);
        });
    }
};

module.exports = Package;
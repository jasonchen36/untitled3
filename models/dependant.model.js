/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var dependant = {
    findById: function(dependantId) {
        if ((!dependantId) || (dependantId.length === 0)) {
            return Promise.reject(new Error('No dependantId specified!'));
        }
        var dependantSql = 'SELECT * FROM dependants WHERE id = ?';
        return db.knex.raw(dependantSql, [dependantId]).then(function(dependantSqlResults) {
            return dependantSqlResults[0][0];
        });
    },

    getAllById: function(taxReturnId) {
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }
        var dependantSql = 'SELECT * FROM dependants WHERE tax_return_id = ?';
        return db.knex.raw(dependantSql, [taxReturnId]).then(function(dependantSqlResults) {
            return dependantSqlResults[0];
        });
    },

    create: function(dependantObj) {
        if ((!dependantObj.firstName) || (dependantObj.firstName.length === 0)) {
            return Promise.reject(new Error('No firstName specified!'));
        }
        if ((!dependantObj.lastName) || (dependantObj.lastName.length === 0)) {
            return Promise.reject(new Error('No lastName specified!'));
        }
        if ((!dependantObj.dateOfBirth) || (dependantObj.dateOfBirth.length === 0)) {
            return Promise.reject(new Error('No dateOfBirth specified!'));
        }
        if ((!dependantObj.relationship) || (dependantObj.relationship.length === 0)) {
            return Promise.reject(new Error('No relationship specified!'));
        }

        var dependantInsertSql = 'INSERT INTO dependants (first_name, last_name, date_of_birth, relationship) VALUES(?, ?, ?, ?)';
        var dependantInsertSqlParams = [
            dependantObj.firstName,
            dependantObj.lastName,
            dependantObj.dateOfBirth,
            dependantObj.relationship
        ];
        return db.knex.raw(dependantInsertSql, dependantInsertSqlParams).then(function(dependantInsertSqlResults) {
            var dependantId = dependantInsertSqlResults[0].insertId;
            return Promise.resolve(dependantId);
        });
    },

    update: function(id, dependantObj) {
        console.log('this is the start');
        console.log(JSON.stringify(dependantObj));
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No dependantId specified!'));
        }

        return db.knex('dependants').update(dependantObj).where('tax_return_id', id);
    },
    createAssociation: function(dependantTaxReturnObj) {
        console.log(JSON.stringify(dependantTaxReturnObj));
        if ((!dependantTaxReturnObj.dependantId) || (dependantTaxReturnObj.dependantId.length === 0)) {
            return Promise.reject(new Error('No dependantId specified!'));
        }
        if ((!dependantTaxReturnObj.taxReturnId) || (dependantTaxReturnObj.taxReturnId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }
        var dependantTaxReturnInsertSql = 'INSERT IGNORE INTO tax_returns_dependants (tax_return_id, dependant_id) VALUES(?, ?)';
        return db.knex.raw(dependantTaxReturnInsertSql, [dependantTaxReturnObj.taxReturnId,dependantTaxReturnObj.dependantId]).then(function(dependantTaxReturnInsertSqlResults) {
            var dependantId = dependantTaxReturnInsertSqlResults[0].insertId;
            return Promise.resolve(dependantId);
        });
    }
};

module.exports = dependant;

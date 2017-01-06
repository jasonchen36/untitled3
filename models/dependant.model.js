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
        var dependantSql = 'SELECT DISTINCT(dependants.id), dependants.tax_return_id, dependants.first_name, dependants.last_name, dependants.date_of_birth, dependants.relationship, dependants.created_at, dependants.updated_at, dependants.is_shared  FROM dependants JOIN tax_returns_dependants ON dependants.id = tax_returns_dependants.dependant_id WHERE tax_returns_dependants.tax_return_id = ? OR dependants.tax_return_id = ?';
        return db.knex.raw(dependantSql, [taxReturnId,taxReturnId]).then(function(dependantSqlResults) {
            return dependantSqlResults[0];
        });
    },

    deleteById: function(dependantId, taxReturnId){
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }
        if ((!dependantId) || (dependantId.length === 0)) {
            return Promise.reject(new Error('No dependantId specified!'));
        }
        var dependantSql = 'DELETE FROM dependants WHERE tax_return_id = ? AND id = ? LIMIT 1';
        return db.knex.raw(dependantSql, [taxReturnId, dependantId]).then(function(dependantSqlResults) {
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
        if (dependantObj.isShared){
        var dependantInsertSql = 'INSERT INTO dependants (first_name, last_name, date_of_birth, relationship, is_shared) VALUES(?, ?, ?, ?, ?)';
        var dependantInsertSqlParams = [
            dependantObj.firstName,
            dependantObj.lastName,
            dependantObj.dateOfBirth,
            dependantObj.relationship,
            dependantObj.isShared
          ];
        } else {
        var dependantInsertSql = 'INSERT INTO dependants (first_name, last_name, date_of_birth, relationship) VALUES(?, ?, ?, ?)';
        var dependantInsertSqlParams = [
            dependantObj.firstName,
            dependantObj.lastName,
            dependantObj.dateOfBirth,
            dependantObj.relationship
          ];
        }
        return db.knex.raw(dependantInsertSql, dependantInsertSqlParams).then(function(dependantInsertSqlResults) {
            var dependantId = dependantInsertSqlResults[0].insertId;
            return Promise.resolve(dependantId);
        });
    },

    update: function(id, dependantObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No dependantId specified!'));
        }
        return db.knex('dependants').update(dependantObj).where('id', id);
    },
    createAssociation: function(dependantTaxReturnObj) {
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

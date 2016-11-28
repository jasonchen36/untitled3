/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var address = {
    findById: function(addressId) {
        if ((!addressId) || (addressId.length === 0)) {
            return Promise.reject(new Error('No addressId specified!'));
        }
        var addressSql = 'SELECT * FROM addresses WHERE id = ?';
        return db.knex.raw(addressSql, [addressId]).then(function(addressSqlResults) {
            return addressSqlResults[0][0];
        });
    },

    create: function(addressObj) {
        if ((!addressObj.addressLine1) || (addressObj.addressLine1.length === 0)) {
            return Promise.reject(new Error('No addressLine1 specified!'));
        }
        if ((!addressObj.city) || (addressObj.city.length === 0)) {
            return Promise.reject(new Error('No city specified!'));
        }
        if ((!addressObj.province) || (addressObj.province.length === 0)) {
            return Promise.reject(new Error('No province specified!'));
        }
        if ((!addressObj.postalCode) || (addressObj.postalCode.length === 0)) {
            return Promise.reject(new Error('No postalCode specified!'));
        }
        if (addressObj.addressLine2){
          var addressInsertSql = 'INSERT INTO addresses (address_line1, address_line2, city, providence, postal_code) VALUES(?, ?, ?, ?, ?)';
        } else {
          var addressInsertSql = 'INSERT INTO addresses (address_line1, city, providence, postal_code) VALUES(?, ?, ?, ?)';
        }
        var addressInsertSqlParams = [
            addressObj.addressLine1,
            addressObj.city,
            addressObj.province,
            addressObj.postalCode
        ];
        if (addressObj.addressLine2) {
          addressInsertSqlParams.push(addressObj.addressLine2);
        }
        return db.knex.raw(addressInsertSql, addressInsertSqlParams).then(function(addressInsertSqlResults) {
            var addressId = addressInsertSqlResults[0].insertId;
            return Promise.resolve(addressId);
        });
    },

    update: function(id, addressObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No addressId specified!'));
        }

        return db.knex('address').update(addressObj).where('id', id);
    }
};

module.exports = address;

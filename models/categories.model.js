/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Categories = {
    list: function() {


        var categoriesSql = 'SELECT * FROM categories';
        return db.knex.raw(categoriesSql, []).then(function(categoriesSqlResults) {
            return(categoriesSqlResults[0]);
        });
    },

    getCategoryById: function(categoryId){
      var categorySql = 'SELECT * FROM categories where id = ?';
        return db.knex.raw(categorySql, [categoryId]).then(function(categorySqlResult){
            return(categorySqlResult[0]);
        });
    }
};

module.exports = Categories;

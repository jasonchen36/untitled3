/*jslint node: true */

'use strict';

var db = require('../services/db');
var crypto = require('crypto');
var _ = require('lodash');

var User = {
    findAllCustomers: function() {
        var userSql = 'SELECT * FROM users WHERE role = "Customer"';
        return db.knex.raw(userSql, []).then(function(usersSqlResults) {
            return(usersSqlResults[0]);
        });
    },
    findAllCustomersFiltered: function(filters, taxProId) {

        // if taxpro not included, take from filter
        taxProId = taxProId ? taxProId : filters['taxPro'];

        if(!filters) {
          return findAllCustomers();
        }

        var sql = {sql:'SELECT * FROM users',params:[]};
     
        sql = concatenateSql(sql,joinUserPermissions(taxProId));

        sql = concatenateSql(sql,{sql:' WHERE 1=1',params:[]});

        sql = concatenateSql(sql, filterbyEmailAndName(filters));

        sql = concatenateSql(sql, filterByRole(filters));
      
        var possibleOrderByValues=[{key:'lastName',val:'last_name'},{key:'lastUpdated',val:'user_updated_at'}];

        sql = concatenateSql(sql, getOrderBySQL(filters,possibleOrderByValues));

        return db.knex.raw(sql.sql, sql.params).then(function(usersSqlResults) {
            return(usersSqlResults[0]);
        });
    },
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject(new Error('findById() No id specified!'));
        }
        var userSql = 'SELECT * FROM users WHERE id = ?';
        return db.knex.raw(userSql, [id]).then(function(userSqlResults) {
            return(userSqlResults[0][0]);
        });
    },

    deleteById: function(id) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject(new Error('deleteById() No id specified!'));
        }
        var userDeleteSql = 'DELETE FROM users WHERE id = ?';
        return db.knex.raw(userDeleteSql, [id]);
    },


    deleteByEmail: function(email) {
        if ((!email) || (email.length === 0)) {
          return Promise.reject(new Error('deleteByEmail() No email specified!'));
        }
        var userSql = 'DELETE FROM users WHERE email = ?';
        return db.knex.raw(userSql, [email]);
    },



    findByEmail: function(email) {
        if ((!email) || (email.length === 0)) {
          return Promise.reject(new Error('findUserByEmail() No email specified!'));
        }
        var userSql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
        return db.knex.raw(userSql, [email]).then(function(userSqlResults) {
            return(userSqlResults[0][0]);
        });
    },


    create: function(userObj) {
        if ((!userObj.provider) || (userObj.provider.length === 0)) {
          return Promise.reject(new Error('No provider specified!'));
        }
        if ((!userObj.role) || (userObj.role.length === 0)) {
          return Promise.reject(new Error('No role specified!'));
        }
        // ... other fields are validated by users.controller from req.body

        if (userObj.accountId) {
            var userInsertSql = 'INSERT INTO users (provider, role, hashed_password, salt, first_name, last_name, email, account_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?)';
        } else {
            var userInsertSql = 'INSERT INTO users (provider, role, hashed_password, salt, first_name, last_name, email) VALUES(?, ?, ?, ?, ?, ?, ?)';
        }
        var userInsertSqlParams = [
          userObj.provider,
          userObj.role,
//            userObj.username,
          userObj.hashed_password,
          userObj.salt,
          userObj.first_name,
          userObj.last_name,
          userObj.email
        ];
        if (userObj.accountId) {
            userInsertSqlParams.push(userObj.accountId);
        }

        return db.knex.raw(userInsertSql, userInsertSqlParams).then(function(userInsertSqlResults) {
          return userInsertSqlResults[0][0];
        });
    },

    /**
     * Is the user an Admin
     *
     * @param {Object} user
     */
    isAdmin: function(user) {
        return user.role === 'Admin';
    },

    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} salt
     * @param {String} plainText
     * @param {String} hashed_password
     * @return {Boolean}
     */
    authenticate: function(salt, plainText, hashed_password) {
        return this.encryptPassword(salt, plainText) === hashed_password;
    },

    /**
     * Make salt
     *
     * @return {String}
     */
    makeSalt: function() {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} salt
     * @param {String} password
     * @return {String}
     */
    encryptPassword: function(salt, password) {
        if (!password){
          throw new Error('encryptPassword() No password specified!');
        }
        if (!salt){
          throw new Error('encryptPassword() No salt specified!');
        }
        var saltBuffer = new Buffer(salt, 'base64');
        return crypto.pbkdf2Sync(password, saltBuffer, 10000, 64, 'SHA1').toString('base64');
    },

    /**
     * Create Reset Key for password reset
     *
     * @return {object} Hash Object
     */
    createResetKey: function() {
        return crypto.createHash('sha256').update(this.makeSalt()).digest('hex');
    },

    updateResetKey: function(userId, reset_key) {
        if ((!userId) || (userId.length === 0)) {
          return Promise.reject(new Error('updateResetKey() No userId specified!'));
        }
        if ((!reset_key) || (reset_key.length === 0)) {
          return Promise.reject(new Error('updateResetKey() No reset_key specified!'));
        }
        var updateUserSql = 'UPDATE users SET reset_key = ? WHERE id = ?';
        var updateUserSqlParams = [reset_key, userId];
        return db.knex.raw(updateUserSql, updateUserSqlParams);
    },

    updatePassword: function(userId, hashed_password, new_salt) {
        if ((!userId) || (userId.length === 0)) {
          return Promise.reject(new Error('updatePassword() No userId specified!'));
        }
        if ((!hashed_password) || (hashed_password.length === 0)) {
          return Promise.reject(new Error('updatePassword() No hashed_password specified!'));
        }
        if ((!new_salt) || (new_salt.length === 0)) {
          return Promise.reject(new Error('updatePassword() No new_salt specified!'));
        }
        var updateUserSql = 'UPDATE users SET reset_key = null, hashed_password = ?, salt = ? WHERE id = ?';
        var updateUserSqlParams = [hashed_password, new_salt, userId];
        return db.knex.raw(updateUserSql, updateUserSqlParams);
    },

    findByResetKey: function(reset_key) {
        if ((!reset_key) || (reset_key.length === 0)) {
          return Promise.reject(new Error('findByResetKey() No reset_key specified!'));
        }
        var userSql = 'SELECT * FROM users WHERE reset_key = ? LIMIT 1';
        return db.knex.raw(userSql, [reset_key]).then(function(userSqlResults) {
            return(userSqlResults[0][0]);
        });
    }

//    removeAccount: function(account) {
//        var accountIdPos = this.accounts.indexOf(account._id);
//        if (accountIdPos >= 0) {
//            this.accounts.splice(accountIdPos, 1);
//        }
//
//    }
};

/// Get OrderBySQL
/// filters = {orderBy:'lastName',orderAscending:'true'}
/// possibleOrderByValues = [{key:'lastName',val:'last_name'},{key:'updatedOn',val:'updated_'on}]
/// orderBy = 'key passed in with value to translate to a query on table
/// key = passed in key. val = column name
/// orderAscending = order by ascending or descending if ordered by.
var getOrderBySQL = function(filters,possibleOrderByValues) {
  var result = {sql:'',params:[],hasSql:false};

  var orderByVal = _.find(possibleOrderByValues, function(vals) { return vals.key===filters['orderBy']; });

  if ( filters['orderBy'] && orderByVal) {
      result.hasSql=true;
      result.sql+=' ORDER BY '+orderByVal.val;
 
      if ( filters['orderAscending'] ) {
          if(filters['orderAscending'] === 'false') {
              result.sql+=' DESC';
          } else {
              result.sql+=' ASC';
          }
      }
  }

  return result;
};

var joinUserPermissions = function(taxProId) {
    var result = {sql:'',params:[]};

    if(taxProId) {
      result.sql+=' JOIN users_taxpros ON customer_details.taxpro_id=users.id AND customer_details.taxpro_id=?'
      result.params = _.concat(result.params,taxProId);
      // show all users with all roles
    } else {
      result.sql+=' LEFT JOIN users_taxpros ON customer_details.taxpro_id=users.id'
    }

    return result;
};

var filterbyEmailAndName = function(filters) {
    var result = { sql:'',params:[]};

    // Filter email & last name on Q.
    if( filters['q'] ) {
        result.sql+=' AND ( email LIKE CONCAT("%",?,"%") OR last_name LIKE CONCAT("%",?,"%") OR first_name LIKE CONCAT("%",?,"%") OR CONCAT(first_name," ",last_name) LIKE CONCAT("%",?,"%")) ';
        results.params = _.concat(result.params,filters['q'],filters['q']);
    }

    return result;
};

var filterByRole = function(filters) {
    var result = { sql:'',params:[]};

    if( filters['role'] ) {
        result.sql+=' AND role = ?';
        result.params = _.concat(result.params,filters['role']);
    }

    return result;
};

/// concatenates the sql and params for sql results in format:
// {sql:'initial sql', params:['array of params']
var concatenateSql = function(initial,second) {
    var result = { sql:'',params:[]};

    result.sql+=initial.sql+second.sql;
    result.params = _.concat(initial.params, second.params);
    return result;
};

module.exports = User;

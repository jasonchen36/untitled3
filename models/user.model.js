/*jslint node: true */

'use strict';

var db = require('../services/db');
var crypto = require('crypto');
var _ = require('lodash');
var logger = require('../services/logger.service');
var config = require('../config/config');


var User = {
    hasAccess: function(userObj, userId) {
        if ((!userObj) || (userObj.length === 0)) return false;
        if ((!userId) || (userId.length === 0)) return false;

        if ((userObj.user_id === userId) ||
            (this.isAdmin(userObj)) ||
            (this.isTaxpro(userObj))) {
            return true;
        }
    },

    findAllCustomers: function() {
        var userSql = 'SELECT * FROM users WHERE role = "Customer"';
        return db.knex.raw(userSql, []).then(function(usersSqlResults) {
            return(usersSqlResults[0]);
        });
    },

    findAllCustomersFiltered: function(filters, taxProId, trx) {
      // if taxpro not included, take from filter
      var connection = trx ? trx : db.knex;
      var users=null;

      taxProId = taxProId ? taxProId : filters['taxPro'];

      if(!filters) {
        return findAllCustomers();
      }

      var sql = {sql:'SELECT users.* FROM users', params:[]};

      sql = concatenateSql(sql, filterByTaxProfileStatusUsingJoin(filters));

      sql = concatenateSql(sql, {sql:' WHERE 1=1',params:[]});

      sql = concatenateSql(sql, filterUserPermissions(taxProId));

      sql = concatenateSql(sql, filterbyEmailAndName(filters));

      sql = concatenateSql(sql, filterByRole(filters));

      var possibleOrderByValues=[{key:'lastName', val:'last_name'},{key:'lastUpdated', val:'user_updated_at'}];

      sql = concatenateSql(sql, getOrderBySQL(filters, possibleOrderByValues));

      return connection.raw(sql.sql, sql.params).then(function(usersSqlResults) {
        return(usersSqlResults[0]);
      }).then(function(results) {
        users = results;
        return getUsersStatuses(results, connection);
      }).then(function(statusResults) {
        return _.map(users, function(u) {
          var curU = _.cloneDeep(u);

          curU.statuses = _.filter(statusResults,
            function(s) {
              return s.user_id === curU.id;
          });

          return curU;
        });
      });
    },

    findById: function(id,trx) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject(new Error('findById() No id specified!'));
        }
        var userSql = 'SELECT users.* FROM users WHERE id = ?';
        var knexConnection = trx ? trx : db.knex;

        return knexConnection.raw(userSql, [id]).then(function(userSqlResults) {
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
          return userInsertSqlResults[0].insertId;
        });
    },

  updateById: function(userId, userObj) {
    return db.knex.transaction(function(trx) {
        return db.knex('users').transacting(trx).update(userObj).where('id',userId)
          .then(function(results) {
            return User.findById(userId,trx);
          })
          .then(function(results) {
            return Promise.all([Promise.resolve(results),trx.commit(results)]);
          })
          .catch(function(err) {
            return trx.rollback(err)
              .then(function() {
                return Promise.reject(err);
              });
          });
      }).then(function(results) {
        return results;
      });
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

    updatePassword: function(userId, accountId, hashed_password, new_salt) {

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
        return db.knex.raw(updateUserSql, updateUserSqlParams).then(function() {

            var userSql = 'SELECT migrated_user FROM users WHERE id = ?';
            return db.knex.raw(userSql, [userId]).then(function(userObj) {
                var migratedUser = userObj[0][0].migrated_user;
                if (migratedUser === 'Yes') {

                    // CARRY FORWARD ...
                    var oldProductId = config.api.oldProductId;
                    var newProductId = config.api.currentProductId;
                    var oldTaxReturnsSql = 'SELECT id FROM tax_returns WHERE account_id = ? AND product_id = ?';
                    return db.knex.raw(oldTaxReturnsSql, [accountId, oldProductId]).then(function(oldTaxReturnIds) {
                        var migrateTaxReturn = 'INSERT INTO tax_returns \
                        (SIN, middle_initial, prefix, first_name, last_name, date_of_birth, filer_type, account_id, product_id) \
                        SELECT SIN, middle_initial, prefix, first_name, last_name, date_of_birth, filer_type, ?, ? \
                        FROM tax_returns WHERE account_id = ? AND product_id = ? ORDER BY id';

                        var migrateTaxReturnParams = [accountId, newProductId, accountId, oldProductId];
                        return db.knex.raw(migrateTaxReturn, migrateTaxReturnParams).then(function() {
                            var newTaxReturnSql = 'SELECT id FROM tax_returns WHERE account_id = ? AND product_id = ? ORDER BY id';
                            return db.knex.raw(newTaxReturnSql, [accountId, newProductId]).then(function(newTaxReturnIds) {

                                var copyAddressPromise = function(oldTaxReturnId, newTaxReturnId) {
                                    var oldAddressesSql = 'SELECT addresses_id FROM addresses_tax_returns WHERE tax_return_id = ?';
                                    return db.knex.raw(oldAddressesSql, [oldTaxReturnId]).then(function(oldAddressObj) {
                                        var addressId = oldAddressObj.addresses_id;
                                        var insertAddressSql = 'INSERT INTO addresses_tax_returns (tax_return_id, address_id) VALUES (?, ?)';
                                        var insertAddressSqlParams = [newTaxReturnId, addressId];
                                        return db.knex.raw(insertAddressSql, insertAddressSqlParams);
                                    });
                                };

                                var addressPromises = [];
                                var i = 0;
                                for(i=0; i<oldTaxReturnIds.length; i++) {
                                    addressPromises.push(copyAddressPromise(oldTaxReturnIds[i], newTaxReturnIds[i]));
                                }

                                return Promise.all(addressPromises);
                            });
                        });
                    });
                }
            });
        });
    },

    findByResetKey: function(reset_key) {
        if ((!reset_key) || (reset_key.length === 0)) {
          return Promise.reject(new Error('findByResetKey() No reset_key specified!'));
        }
        var userSql = 'SELECT * FROM users WHERE reset_key = ? LIMIT 1';
        return db.knex.raw(userSql, [reset_key]).then(function(userSqlResults) {
            return(userSqlResults[0][0]);
        });
    },

    updateLastUserActivity: function(user,trx) {
      if(!user || !user.id) {
        logger.info("user is missing, cannot update for last user activity.");

        return Promise.resolve({});
      } else {
        var userId = user.id;
        trx = trx ? trx: db.knex;
        return trx.raw('UPDATE users SET last_user_activity=NOW() WHERE id=?',[userId]);
      }
    },

    isAdmin: function(userObj) {
        if ((userObj.role) && (userObj.role === 'Admin')) {
            return true;
        } else {
            return false;
        }
    },

    isTaxpro: function(userObj) {
        if ((userObj.role) && (userObj.role === 'TaxPro')) {
            return true;
        } else {
            return false;
        }
    },

    isValidRole: function(role) {
        if ((role) && ((role === 'Admin') || (role === 'Customer') || (role === 'TaxPro')) ) {
            return true;
        } else {
            logger.debug('INVALID ROLE: ' + role);
            return false;
        }
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

var filterUserPermissions = function(taxProId) {
    var result = {sql:'',params:[]};

    if(taxProId) {
      result.sql+=' AND users.taxpro_id = ?'
      result.params = _.concat(result.params,taxProId);
      // show all users with all roles
    }

    return result;
};

var filterbyEmailAndName = function(filters) {
    var result = { sql:'',params:[]};

    // Filter email & last name on Q.
    if( filters['q'] ) {
        result.sql+=' AND ( email LIKE CONCAT("%",?,"%") OR last_name LIKE CONCAT("%",?,"%") OR first_name LIKE CONCAT("%",?,"%") OR CONCAT(first_name," ",last_name) LIKE CONCAT("%",?,"%")) ';
        result.params = _.concat(result.params, filters['q'], filters['q'], filters['q'], filters['q']);
    }

    return result;
};

var filterByTaxProfileStatusUsingJoin = function(filters) {
    var result = { sql:'',params:[]};

    if( filters['status'] && _.parseInt(filters['status'])>=0 ) {
        result.sql+=' JOIN (SELECT DISTINCT u.id, tr.status_id FROM users as u JOIN tax_returns as tr ON tr.account_id=u.account_id WHERE tr.status_id=? ) AS userswithStatus ON userswithStatus.id = users.id';
        result.params = _.concat(result.params,filters['status']);
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

var getUsersStatuses = function(users,trx) {
  if(users.length>5000) {
    return Promise.reject(new Error("Too many users to get statuses for. Please page your data"));
  } else if (users.length ===0) {
    return Promise.resolve([]);
  }

  var connection = trx ? trx : db.knex;
  var userIds = _.map(users,function(u) { return u.id });


  var sql = 'SELECT u.id as user_id, tR.account_id, tR.id as tax_return_id, s.id as status_id, s.name, s.display_text, tR.account_id, tR.first_name, tR.last_name';
  sql+=' FROM tax_returns as tR JOIN status as s ON tR.status_id=s.id JOIN users as u ON u.account_id=tR.account_id WHERE u.role="Customer" AND u.id IN ('+userIds.join(',')+')';

  var sqlParams=[];

  return connection.raw(sql, sqlParams)
    .then(function(results) {
      return results[0];
    });
};

module.exports = User;

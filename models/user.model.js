/*jslint node: true */

var db = require('../services/db');
var crypto = require('crypto');

var User = {
    findAllCustomers: function() {
        var userSql = 'SELECT * FROM users WHERE NOT role = "Customer"';
        return db.knex.raw(userSql, []).then(function(usersSqlResults) {
            return(usersSqlResults[0]);
        });
    },

    findById: function(id) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject('findById() No id specified!');
        }
        var userSql = 'SELECT * FROM users WHERE id = ?';
        return db.knex.raw(userSql, [id]).then(function(userSqlResults) {
            return(userSqlResults[0][0]);
        });
    },

    deleteById: function(id) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject('deleteById() No id specified!');
        }
        var userDeleteSql = 'DELETE FROM users WHERE id = ?';
        return db.knex.raw(userDeleteSql, [id]);
    },


    deleteByEmail: function(email) {
        if ((!email) || (email.length === 0)) {
          return Promise.reject('deleteByEmail() No email specified!');
        }
        var userSql = 'DELETE users WHERE email = ? LIMIT 1';
        return db.knex.raw(userSql, [email]);
    },

    updatePasswordById: function(id, password) {
        if ((!id) || (id.length === 0)) {
          return Promise.reject('updatePasswordById() No id specified!');
        }
        if ((!password) || (id.password === 0)) {
          return Promise.reject('updatePasswordById() No password specified!');
        }
        var userSql = 'UPDATE users SET password = ? WHERE id = ?';
        return db.knex.raw(userSql, [password, id]);
    },


    findByEmail: function(email) {
        if ((!email) || (email.length === 0)) {
          return Promise.reject('findUserByEmail() No email specified!');
        }
        var userSql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
        return db.knex.raw(userSql, [email]).then(function(userSqlResults) {
            return(userSqlResults[0][0]);
        });
    },


    create: function(userObj) {
        if ((!userObj.provider) || (userObj.provider.length === 0)) {
          return Promise.reject('No provider specified!');
        }
        if ((!userObj.role) || (userObj.role.length === 0)) {
          return Promise.reject('No role specified!');
        }
        // ... other fields are validated by users.controller from req.body

        var userInsertSql = 'INSERT INTO users (provider, role, hashed_password, salt, first_name, last_name, email) VALUES(?, ?, ?, ?, ?, ?, ?)';
        var userInsertSqlParams = [
          userObj.provider,
          userObj.role,
//          userObj.username,
          userObj.hashed_password,
          userObj.salt,
          userObj.first_name,
          userObj.last_name,
          userObj.email
        ];
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
        return crypto.pbkdf2Sync(password, saltBuffer, 10000, 64).toString('base64');
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
          return Promise.reject('updateResetKey() No userId specified!');
        }
        if ((!reset_key) || (reset_key.length === 0)) {
          return Promise.reject('updateResetKey() No reset_key specified!');
        }
        var updateUserSql = 'UPDATE users SET reset_key = ? WHERE id = ?';
        var updateUserSqlParams = [reset_key, userId];
        return db.knex.raw(updateUserSql, updateUserSqlParams);
    },

    updatePassword: function(userId, hashed_password, new_salt) {
        if ((!userId) || (userId.length === 0)) {
          return Promise.reject('updatePassword() No userId specified!');
        }
        if ((!hashed_password) || (hashed_password.length === 0)) {
          return Promise.reject('updatePassword() No hashed_password specified!');
        }
        if ((!new_salt) || (new_salt.length === 0)) {
          return Promise.reject('updatePassword() No new_salt specified!');
        }
        var updateUserSql = 'UPDATE users SET reset_key = null, hashed_password = ?, salt = ? WHERE id = ?';
        var updateUserSqlParams = [hashed_password, new_salt, userId];
        return db.knex.raw(updateUserSql, updateUserSqlParams);
    },

    findByResetKey: function(reset_key) {
        if ((!reset_key) || (reset_key.length === 0)) {
          return Promise.reject('findByResetKey() No reset_key specified!');
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

module.exports = User;
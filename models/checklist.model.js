var config = require('../config/config.js');
var Promise = require('bluebird');
var logger = require('../services/logger.service');
var db = require('../services/db');
var _ = require('lodash');
var moment = require('moment');
var momentTz = require('moment-timezone');

var API_TIMEZONE = config.api.timezone;
var API_DATE_OUTPUT_FORMAT = config.api.dateOutputFormat;

var Checklist = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var checklistSql = 'SELECT * FROM checklist_items WHERE id = ?';
        return db.knex.raw(checklistSql, [id]).then(function(checklistSqlResults) {
            if ((checklistSqlResults[0][0]) && (checklistSqlResults[0][0].date)) {
                var utcCreatedAt = checklistSqlResults[0][0].created_at;
                checklistSqlResults[0][0].createdAt = momentTz(utcCreatedAt, API_TIMEZONE).format(API_DATE_OUTPUT_FORMAT);
            }
            return(checklistSqlResults[0][0]);
        });
    },

    getCheckListForAccountIdProductId: function(accountId, productId) {
        if ((!accountId) || (accountId.length === 0)) {
            return Promise.reject('No accountId specified!');
        }

        if ((!productId) || (productId.length === 0)) {
            return Promise.reject('No productId specified!');
        }

        var checklistSQL = 'SELECT DISTINCT cr.checklist_item_id, ci.name FROM answers AS a \
                            JOIN checklist_rules AS cr \
                                 ON a.question_id = cr.question_id \
                                 AND a.text = cr.value \
                            JOIN checklist_items AS ci \
                                 ON ci.id = cr.checklist_item_id \
                            WHERE a.tax_return_id IN( \
                                 SELECT id FROM tax_returns \
                                 WHERE account_id = ? and product_id = ?);';
        return db.knex.raw(checklistSQL, [accountId, productId]).then(function(checklistSQLResults) {
            var checklistArr = [];
            if (checklistSQLResults[0]) { // allow for undefined
                checklistArr = checklistSQLResults[0];
            } else {
                checklistArr = [];
                var resultObj = {};
                resultObj.checklist = [];
                resultObj.additionalDocuments = [];
            }

            var documentsSql = 'SELECT d.*, tr.product_id, tr.account_id, tr.status_id, tr.first_name, tr.last_name \
                                    FROM documents AS d \
                                LEFT JOIN tax_returns AS tr ON tr.id = d.tax_return_id \
                                WHERE d.tax_return_id IN( \
                                    SELECT id FROM tax_returns \
                                    WHERE account_id = ? and product_id = ?)';
            return db.knex.raw(documentsSql, [accountId, productId]).then(function(documentsSqlResults) {
                var dbDocs = documentsSqlResults[0];
                var documents = [];
                var docObj = {};
                _.forEach(dbDocs, function(dbDoc) {
                    docObj = {};
                    docObj.documentId = dbDoc.id;
                    docObj.quoteId = dbDoc.quote_id;
                    docObj.taxReturnId = dbDoc.tax_return_id;
                    docObj.firstName = dbDoc.first_name;
                    docObj.lastName = dbDoc.last_name;
                    docObj.checkListItemId = dbDoc.checklist_item_id;
                    docObj.name = dbDoc.name;
                    var utcCreatedAt = dbDoc.created_at;
                    docObj.createdAt = momentTz(utcCreatedAt, API_TIMEZONE).format(API_DATE_OUTPUT_FORMAT);
                    docObj.url = config.thumbnail.baseUploadUrl + dbDoc.url;
                    docObj.thumbnailUrl = config.thumbnail.baseThumbnailUrl + dbDoc.thumbnail_url;
                    documents.push(docObj);
                });
                var filerSql = 'SELECT DISTINCT\
                                  cr.checklist_item_id, \
                                  ci.name, tr.id, \
                                  tr.first_name, \
                                  tr.last_name \
                                FROM answers AS a \
                                JOIN checklist_rules AS cr \
                                  ON a.question_id = cr.question_id \
                                  AND a.text = cr.value \
                                JOIN checklist_items AS ci \
                                  ON ci.id = cr.checklist_item_id \
                                JOIN tax_returns AS tr \
                                  ON tr.id = a.tax_return_id \
                                WHERE a.tax_return_id IN( \
                                   SELECT id FROM tax_returns \
                                    WHERE account_id = ? and product_id = ?)';
                return db.knex.raw(filerSql, [accountId, productId]).then(function(filerSqlResults) {
                    var dbFilers = filerSqlResults[0];

                    _.forEach(checklistArr, function(checklistItem) {
                        thisCheckListItemId = checklistItem.checklist_item_id;
                        checklistItem.documents = _.filter(documents, function(o) {
                            return o.checkListItemId === thisCheckListItemId;
                        });
                        checklistItem.filers = _.filter(dbFilers, function(o) {
                            return o.checklist_item_id === thisCheckListItemId;
                        });
                        _.forEach(checklistItem.filers, function(filerObj) {
                            delete filerObj.checklist_item_id;
                            delete filerObj.name;
                            delete filerObj.id;
                        });
                    });

                    resultObj = {};
                    resultObj.checklistitems = checklistArr;
                    resultObj.additionalDocuments = _.filter(documents, function(o) {
                        return (o.checkListItemId === null || o.checkListItemId === 0); // no checklistItemId
                    });
                    return(resultObj);
                });
            });
        });
    },

    checkIdExists: function(id) {
        if (!id) {
            return Promise.resolve(false);
        }
        return this.findById(id).then(function(row) {
            if (row) {
                return true;
            } else {
                return false;
            }
        });
    }
};

module.exports = Checklist;
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

    getCheckListForQuoteId: function(quoteId) {
        if ((!quoteId) || (quoteId.length === 0)) {
            return Promise.reject(new Error('No quoteId specified!'));
        }

        var checklistSQL = 'SELECT DISTINCT cr.checklist_item_id, ci.name, ci.description FROM answers AS a \
                            JOIN checklist_rules AS cr \
                                 ON a.question_id = cr.question_id \
                                 AND a.text = cr.value \
                            JOIN checklist_items AS ci \
                                 ON ci.id = cr.checklist_item_id \
                            WHERE a.tax_return_id IN( \
                                 SELECT DISTINCT tr.id FROM quote AS q \
                                 JOIN tax_returns AS tr ON tr.account_id = q.account_id AND tr.product_id = q.product_id \
                                 WHERE q.id = ?);';
        return db.knex.raw(checklistSQL, [quoteId]).then(function(checklistSQLResults) {
            var checklistArr = [];
            if (checklistSQLResults[0]) { // allow for undefined
                checklistArr = checklistSQLResults[0];
            } else {
                checklistArr = [];
                var resultObj = {};
                resultObj.checklist = [];
                resultObj.additionalDocuments = [];
            }

            var documentsSql = 'SELECT DISTINCT d.*, tr.product_id, tr.account_id, tr.status_id, tr.first_name, tr.last_name \
                                FROM documents AS d \
                                JOIN quote as q on d.quote_id = q.id \
                                LEFT JOIN tax_returns AS tr ON tr.id = d.tax_return_id \
                                WHERE q.id = ? and d.tax_return_id is not null \
                                union \
                                SELECT DISTINCT d.*, tr.product_id, tr.account_id, tr.status_id, tr.first_name, tr.last_name \
                                FROM documents as d \
                                JOIN quote as q on d.quote_id = q.id \
                                JOIN tax_returns AS tr ON tr.account_id = q.account_id AND tr.product_id = q.product_id \
                                WHERE q.id = ? AND d.tax_return_id is null \
                                group by d.checklist_item_id, q.id, d.created_at;';
            return db.knex.raw(documentsSql, [quoteId, quoteId]).then(function(documentsSqlResults) {
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
                                  ci.name, ci.description, tr.id, \
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
                                  SELECT DISTINCT tr.id FROM quote AS q \
                                  JOIN tax_returns AS tr ON tr.account_id = q.account_id AND tr.product_id = q.product_id \
                                  WHERE q.id = ?);';
                return db.knex.raw(filerSql, [quoteId]).then(function(filerSqlResults) {
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
var config = require('../config/config.js');
var Promise = require('bluebird');
var logger = require('../services/logger.service');
var db = require('../services/db');
var _ = require('lodash');



var Checklist = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var quoteSql = 'SELECT * FROM checklist_items WHERE id = ?';
        return db.knex.raw(quoteSql, [id]).then(function(quoteSqlResults) {
            return(quoteSqlResults[0][0]);
        });
    },

    getCheckListForQuoteId: function(quoteId) {
        if ((!quoteId) || (quoteId.length === 0)) {
            return Promise.reject('No quoteId specified!');
        }

        var checklistSQL = 'SELECT DISTINCT cr.checklist_item_id, ci.name FROM answers AS a \
                            JOIN checklist_rules AS cr \
                                 ON a.question_id = cr.question_id \
                                 AND a.text = cr.value \
                            JOIN checklist_items AS ci \
                                 ON ci.id = cr.checklist_item_id \
                            WHERE a.tax_return_id IN( \
                                 SELECT tax_return_id FROM quotes_tax_returns \
                                 WHERE quote_id = ?);';
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

            var documentsSql = 'SELECT * FROM documents AS d \
                                JOIN tax_returns AS tr ON tr.id = d.tax_return_id \
                                WHERE d.quote_id = ?;';
            return db.knex.raw(documentsSql, [quoteId]).then(function(documentsSqlResults) {
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
                    docObj.url = config.thumbnail.baseUploadUrl + dbDoc.url;
                    docObj.thumbnailUrl = config.thumbnail.baseThumbnailUrl + dbDoc.thumbnail_url;
                    documents.push(docObj);
                });
                var filerSql = 'SELECT \
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
                                   SELECT tax_return_id FROM quotes_tax_returns \
                                   WHERE quote_id = ?)';
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
console.log('filerObj = ' + JSON.stringify(filerObj, null, 2));
                            delete filerObj.checklist_item_id;
                            delete filerObj.name;
                            delete filerObj.id;
                        });
                    });

                    resultObj = {};
                    resultObj.checklistitems = checklistArr;
                    resultObj.additionalDocuments = _.filter(documents, function(o) {
                        return o.checkListItemId === null; // no checklistItemId
                    });;
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
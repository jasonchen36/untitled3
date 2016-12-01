var config = require('../config/config.js');
var Promise = require('bluebird');
var logger = require('../services/logger.service');
var db = require('../services/db');
var _ = require('lodash');


// move the code below to tax return controller
/*******************************************************************************
ENDPOINT
GET /tax_return/:id/checklist

INPUT BODY:
{
  taxReturnId: 44,
}

RESPONSE:
{
  checklist: [
    {
      checklist_item_id: 93,
      name: "T4A"
    },
    {
      checklist_item_id: 91,
      name: "T5007"
    }
  ],
  documents: [
    {
      documentId: 4,
      name: "filename.txt",
      url: "http://localhost/uploads/taxplan.com",
      thumbnailUrl: "http://localhost/thumb/taxplan.jpg"
    },
    {
      documentId: 5,
      name: "filename2.txt",
      url: "http://localhost/uploads/taxplan.com",
      thumbnailUrl: "http://localhost/thumb/taxplan2.jpg"
    }
  ]
}
*******************************************************************************/

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

    getCheckListForTaxReturn: function(taxReturnId) {
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject('No taxReturnId specified!');
        }

        var checklistSQL = 'SELECT cr.checklist_item_id, ci.name FROM answers AS a \
                            JOIN checklist_rules AS cr \
                                 ON a.question_id = cr.question_id \
                                 AND a.text = cr.value \
                            JOIN checklist_items AS ci \
                                 ON ci.id = cr.checklist_item_id \
                            WHERE a.tax_return_id = ?;';
        return db.knex.raw(checklistSQL, [taxReturnId]).then(function(checklistSQLResults) {
            var responseObj = {};
            if (checklistSQLResults[0][0] > 0) { // allow for undefined
                responseObj.checklist = checklistSQLResults[0][0];
            } else {
                responseObj.checklist = [];
            }

            var documentsSQL = 'SELECT * FROM documents AS d \
                                JOIN tax_returns_documents AS td \
                                ON td.document_id = d.id \
                                WHERE td.tax_return_id = ?;';
            return db.knex.raw(documentsSQL, [taxReturnId]).then(function(documentsSQLResults) {
                var dbDocs = documentsSQLResults[0];
                var documents = [];
                var docObj = {};
                _.forEach(dbDocs, function(dbDoc) {
                    docObj = {};
                    docObj.documentId = dbDoc.id;
                    docObj.name = dbDoc.name;
                    docObj.url = config.thumbnail.baseUploadUrl + dbDoc.url;
                    docObj.thumbnailUrl = config.thumbnail.baseThumbnailUrl + dbDoc.thumbnail_url;
                    documents.push(docObj);
                });
                responseObj.documents = documents;
                return(responseObj);
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
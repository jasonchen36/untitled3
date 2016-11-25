/*jslint node: true */

'use strict';

// account controller

/**
 * Module dependencies.
 */
var logger = require('../services/logger.service');
var Document = require('../models/document.model');
var TaxReturnDocument = require('../models/tax_return_document.model');
var validator = require('express-validator');
var util = require('util');
var path = require('path');
var _ = require('underscore');
var config = require('../config/config');
var thumbnailService = require('../services/thumbnailService');

/*******************************************************************************
ENDPOINT
POST /document

INPUT BODY:
{
  taxReturnId:    123,
  uploadFileName: "T4.pdf"
}

RESPONSE:
200 OK
*******************************************************************************/
exports.create = function (req, res) {
    console.dir(req.file);
    console.log(req.body.taxReturnId);

    var sourcePath = req.file.path;
    var fileName = path.basename(sourcePath);
    var destPath = config.thumbnail.destPath + '/' + fileName;

    var documentObj = {};
    documentObj.name = req.file.originalname;
    documentObj.url = fileName;
    documentObj.thumbnailUrl = fileName;
    return Document.create(documentObj).then(function(insertId) {
        var taxReturnDocumentObj = {};
        taxReturnDocumentObj.tax_return_id = req.body.taxReturnId;
        taxReturnDocumentObj.document_id = insertId;
        return TaxReturnDocument.create(taxReturnDocumentObj).then(function(insertId) {
            res.writeHead(200, {'content-type': 'text/plain'});
            res.write('received upload:\n\n');
            res.end(util.inspect({
                taxReturnId: req.body.taxReturnId,
                file: req.file
            }));
            return thumbnailService.resize(sourcePath, destPath, config.thumbnail.width);
        });
    });
};


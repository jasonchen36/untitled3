/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var config = require('../config/config');
var _ = require('underscore');
var userModel = require('../models/user.model');
var noteModel = require('../models/note.model');
var db = require('../services/db');
var logger = require('../services/logger.service');

/*******************************************************************************
ENDPOINT
POST /admin/users/:userId/notes

INPUT BODY:
{
  "message": "note text",                    MANDATORY (note text)
}

AUTH TOKEN IS REQUIRED

RESPONSE:
200 OK
*******************************************************************************/
exports.create = function (req, res, next) {
     
    if(!userModel.isAdminOrTaxpro(req.user)) {
      return res.status(403).send('Forbidden');
    }


    var noteTaker = req.user;
    var userId = parseInt(req.params.userId);

    var messageObj = {};
    messageObj.user_id = userId;
    messageObj.note = req.body.message;
    messageObj.note_taker_id = parseInt(req.user.id);
    

    return userModel.hasPermissionsForUserId(noteTaker,userId)
      .then(function(hasPermissions) {
        if(!hasPermissions) {
          var permissionError = new Error('Does not have permissions');
            permissionError.name='permissionError';
            return Promise.reject(permissionError);
        } else {
          return noteModel.create(messageObj);
        }
      })
      .then(function(result) {
        if (!result) {
            return res.status(404).send();
        }
        return res.status(200).send(result);
      })
      .catch(function(err) {
          if(err && err.name=='permissionError') {
            return res.status(403).send('Forbidden');
          } else {
            next(err);
          }
    });
};

/*******************************************************************************
ENDPOINT
GET /messages/:client

INPUT BODY:

RESPONSE:
200 OK
*******************************************************************************/
exports.list = function (req, res, next) {

    if(!userModel.isAdminOrTaxpro(req.user)) {
      return res.status(403).send('Forbidden');
    }

    var userId = parseInt(req.params.userId);
    var noteTaker = req.user;

    return userModel.hasPermissionsForUserId(noteTaker,userId)
      .then(function(hasPermissions) {
        if(!hasPermissions) {
          var permissionError = new Error('Does not have permissions');
            permissionError.name='permissionError';
            return Promise.reject(permissionError);
        } else {
          return noteModel.findAllByUserId(userId)
        }
      }).then(function(result) {
        if (!result) {
            return res.status(404).send();
        }
        return res.status(200).send({'notes':result});
    }).catch(function(err) {
          if(err && err.name=='permissionError') {
            return res.status(403).send('Forbidden');
          } else {
            next(err);
          }
    });


};

/*******************************************************************************
ENDPOINT
GET /messages/:id

INPUT BODY:
NONE - ONLY AUTH TOKEN IS REQUIRED

RESPONSE:
{
  "id": 7,
  "status": "new",
  "body": "admin test message body",
  "subject": "admin test message",
  "client_id": 57,
  "fromname": "test_admin test_admin",
  "from_id": 1,
  "date": "2016-11-28T18:25:52.000Z"
}

200 OK
*******************************************************************************/
exports.markAsDone = function (req, res, next) {

    if(!userModel.isAdminOrTaxpro(req.user)) {
      return res.status(403).send('Forbidden');
    }

    var userId = parseInt(req.params.userId);
    var noteTaker = req.user;

    var noteId = parseInt(req.params.noteId);
    var done = req.body.done===false ? false: true;

    return userModel.hasPermissionsForUserId(noteTaker,userId)
      .then(function(hasPermissions) {
        if(!hasPermissions) {
          var permissionError = new Error('Does not have permissions');
            permissionError.name='permissionError';
            return Promise.reject(permissionError);
        } else {
          return noteModel.markAsDone(noteId, userId,done);
        }
      }).then(function(result) {
        if (!result) {
            return res.status(404).send();
        }
        return res.status(200).json(result);
    }).catch(function(err) {
          if(err && err.name=='permissionError') {
            return res.status(403).send('Forbidden');
          } else {
            next(err);
          }
    });
};


exports.del = function (req, res, next) {
    if(!userModel.isAdminOrTaxpro(req.user)) {
      return res.status(403).send('Forbidden');
    }

    var noteId =parseInt( req.params.noteId);
    var userId = parseInt(req.params.userId);
    var noteTaker = req.user;

    return userModel.hasPermissionsForUserId(noteTaker,userId)
      .then(function(hasPermissions) {
        if(!hasPermissions) {
          var permissionError = new Error('Does not have permissions');
            permissionError.name='permissionError';
            return Promise.reject(permissionError);
        } else {
          return noteModel.deleteById(noteId, userId)
        }
      }).then(function(result) {
        if (!result) {
            return res.status(404).send();
        }
        return res.status(200).send({affectedRows:result});
    }).catch(function(err) {
          if(err && err.name=='permissionError') {
            return res.status(403).send('Forbidden');
          } else {
            next(err);
          }
    });
};

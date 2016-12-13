/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var config = require('../config/config');
var logger = require('../services/logger.service');
var Notifications = require('../models/notifications.model');

/*******************************************************************************
ENDPOINT
GET /notifications

INPUT BODY:
NONE - ONLY AUTH TOKEN IS REQUIRED

RESPONSE:
[
  {
    "id": 1,
    "user_id": 28,
    "message": "text message",
    "is_read": 1,
    "created_at": "2016-12-13T03:41:01.000Z",
    "updated_at": "2016-12-13T03:56:06.000Z"
  },
  {
    "id": 2,
    "user_id": 28,
    "message": "text message2",
    "is_read": 0,
    "created_at": "2016-12-13T03:42:28.000Z",
    "updated_at": "2016-12-13T03:52:06.000Z"
  }
]

*******************************************************************************/
exports.listAll = function (req, res) {
      var userId = req.user.id;
      Notifications.listAll(userId).then(function(notifications) {
          if (notifications) {
              res.status(200).send(notifications);
          } else {
              res.status(404).send();
          }
        });
};

/*******************************************************************************
ENDPOINT
GET /notifications/unread

INPUT BODY:
NONE - ONLY AUTH TOKEN IS REQUIRED

RESPONSE:
[
  {
    "id": 2,
    "user_id": 28,
    "message": "text message2",
    "is_read": 0,
    "created_at": "2016-12-13T03:42:28.000Z",
    "updated_at": "2016-12-13T03:52:06.000Z"
  }
]

*******************************************************************************/
exports.listUnread = function (req, res) {
      var userId = req.user.id;
      Notifications.listUnread(userId).then(function(notifications) {
          if (notifications) {
              res.status(200).send(notifications);
          } else {
              res.status(404).send();
          }
        });
};

/*******************************************************************************
ENDPOINT
GET /notifications/:id

INPUT BODY:
NONE - ONLY AUTH TOKEN IS REQUIRED

RESPONSE:
{
  "id": 1,
  "user_id": 28,
  "message": "text message",
  "is_read": 1,
  "created_at": "2016-12-13T03:41:01.000Z",
  "updated_at": "2016-12-13T03:56:06.000Z"
}

*******************************************************************************/
exports.findById = function (req, res) {
    if (!req.user) {
        res.status(409).send('no user in request!');
    }
    req.checkParams('id', 'Please provide a notification id').isInt();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var isAdmin = false;
        if (req.user.role === 'Admin') { // Admins can read any users messages
            isAdmin = true;
        } else {
            isAdmin = false;
        }

        var id = req.params.id;
        var userId = req.user.id;
        Notifications.findById(userId, id, isAdmin).then(function(notification) {
            if (!notification) {
                res.status(404).send();
                return;
            }

            // change is_read status of notification if this user is intended recipient
            // i.e. admins can read notifications for others without updating is_read status
             if ((isAdmin) && (userId !== usernotification.user_id)) { // admin reading another users message - do not mark read
                res.status(200).send(notification);
            } else {
                if ((notification.is_read === 0) && (userId === notification.user_id)) {  // user (including admin) reading own notification - always mark read

                    Notifications.setReadStatusById(id).then(function() {
                        res.status(200).send(notification);
                    });
                } else {
                    res.status(200).send(notification);
                }
            }
        });
    }
};
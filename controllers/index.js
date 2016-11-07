/*jslint node: true */

'use strict';

var config = require('../config/config');

exports.index = function(req, res) {
    res.json({
        user: req.user ? JSON.stringify(req.user) : 'null'
    });
};

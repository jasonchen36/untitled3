/*jslint node: true */

var config = require('../config/config');
var logger = require('./logger.service');
var mysql = require('mysql');


var knex = require('knex')({
    client: config.database.client,
    connection: config.database.connection
});
if (config.database.debugSQL === true) {
  knex.on( 'query', function( queryData ) {
    if ((queryData.bindings) && ((queryData.bindings).length > 0)) {
      logger.debug('%s:\n%s\n%s', queryData.sql, JSON.stringify(queryData.bindings, null, 2) );
    } else {
      logger.debug('%s:\n%s', queryData.sql );
    }
  });
}
var versionStr = '';
knex.raw('SHOW VARIABLES LIKE "version_comment"').then(function(rows) {
    versionStr = rows[0][0].Value;

    knex.raw('SHOW VARIABLES LIKE "version"').then(function(rows) {
        versionStr = versionStr + ' ' + rows[0][0].Value;
        logger.info('MySQL Version:           ' + versionStr);
        logger.info('MySQL DB:                ' + config.database.connection.database);
        logger.info('DB host:                 ' + config.database.connection.host);
        logger.info('DB port:                 ' + config.database.connection.port);

        knex.raw('SHOW VARIABLES LIKE "innodb_file_per_table%"').then(function(rows) {
            logger.info('innodb_file_per_table:   ' + rows[0][0].Value);

             knex.raw('SHOW VARIABLES LIKE "innodb_file_format%"').then(function(rows) {
                logger.info('innodb_file_format:      ' + rows[0][0].Value);
            });
        });
    });
});

exports.knex = knex;


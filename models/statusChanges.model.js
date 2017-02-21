/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');
var _ = require('lodash');
var userModel = require('./user.model');
var logger = require('../services/logger.service');
var cacheService = require('../services/cache.service');

var StatusChanges = {
    list: function() {
      // TODO: this still executes the sql.  Shouldn't we remove the call altogether if the cache hits?
      return cacheService.getCachedOrCall('status_changes_list', getStatusChanges)
      .then(function(result) {
        return result;
      });
    },
    getStateChangesForState: function(id,role) {
      return this.list()
        .then(function(results) {
          return filterStateChangesForState(results, id, role);
      });
    },
    addStatusChangesToTaxReturn: function(taxReturn, role,includeAPIOnlyOptions) {
      var statusId = taxReturn.status.id;

      return this.list()
        .then(function(statusList) {

          taxReturn.statusChanges = filterStateChangesForState(statusList, statusId, role, includeAPIOnlyOptions);

          return taxReturn;
        });
    },
    addStatusChangesToAccountTaxReturns: function(account, role, includeAPIOnlyOptions) {

      return this.list()
        .then(function(statusList) {
          var taxReturns = account.taxReturns;
          taxReturns = _.map(taxReturns, function(taxReturn) {
            var statusId = taxReturn.status.id;
            taxReturn.statusChanges = filterStateChangesForState(statusList, statusId, role,includeAPIOnlyOptions);
            return taxReturn;
          });

          account.taxReturns = taxReturns;

          return account;
        });
    },
    allowableStatusChangeForTaxReturn: function(initialStatusId, endStatusId, role,includeAPIOnlyOptions) {
      return this.list()
        .then(function(statusList) {

          const statusChanges = filterStateChangesForState(statusList, initialStatusId, role, includeAPIOnlyOptions);

          return _.some(statusChanges,(sc) => { return sc.end_status_id === endStatusId   }) ;
        });
    },
};

var getStatusChanges = function() {
  var sql = "SELECT * FROM status_changes";

  return db.knex.raw(sql)
    .then(function(results) {
      return results[0];
    });
}

var filterStateChangesForState = function(listOfStateChanges,id,role,includeAPIOnlyOptions) {

  return _.filter(listOfStateChanges, function(result) {
    return result.initial_status_id===id && result.role===role && (includeAPIOnlyOptions || result.through_api_only===0);
  });
};


module.exports = StatusChanges;

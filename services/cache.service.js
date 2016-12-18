var nodeCache = require('node-cache'),
    logger = require('../services/logger.service'),
    path = require('path'),
    scriptName = path.basename(__filename),
    Promise = require('bluebird');
    _ = require('lodash');


var config = {
  ttl : 15 * 60
};
var cache ;
exports.init = function(cacheConfiguration){
  return new Promise(function(resolve , reject) {

    try {
      config = _.merge(config, cacheConfiguration);
      cache = new nodeCache({ stdTTL: config.ttl });
      resolve();
    }
    catch(exception){
      logger.error(scriptName, 'couldn\'t initialize cache service : ' + JSON.stringify(exception ));
      reject(exception);
    }

  });

};

/**
 * Returns a promise that resolves into the value of that key in the cache if it exists
 * and is rejected if the key is not found, or there was an error
 * @param key
 */
exports.get = function(key,getKeyPromise) {
  return new Promise(function(resolve,reject){
    cache.get(key, function( err, value ){
      if( !err ){
        if(value == undefined){
          logger.debug(scriptName,'key : ' + key + ' not found in cache, resolving ' );
          Promise.resolve(getKeyPromise).then(function(newValue){
            // Don't wait for callback on set, because on 'get' we don't
            // explicitely care on a failure here, we should continue instead.
            // TODO: possibly handle the possible error, for logging.
            cache.set(key,newValue);
            resolve(newValue);
          }).catch(function(err) {
            reject(err);
          });
        }else{
          resolve(value);
        }
      } else {
        reject(err);
      }
    });
  });
};

exports.getCachedOrCallbackOnMiss = function(key,promiseCallback) {
  return exports.getCached(key).then(function(result) {
    if(result== undefined) {
      throw new Error('Cache miss error');
    } else {
      return result;
    }
  }).catch(function(err) {
    if(promiseCallback) {
      return promiseCallback()
        .then(function(result) {
          cache.set(key,result);
          return result;
        });
    } else {
      return Promise.reject(err);
    }
  });
};


// Returns  of the value only if cached, does not try to resolve if cache is missed.
exports.getCached = function(key) {
   return new Promise(function(resolve,reject){
    cache.get(key, function( err, value ){
      if( !err ){
        resolve(value);
      }else {
        // reject normal err?
        reject(err);
      }
    });
  });
};

exports.set = function(key,value) {
  return new Promise(function(resolve,reject){
    cache.set(key,value,config.ttl, function( err, success ){
      if( !err && success ){
        resolve(value);
      }
      else {
        // reject normal err?
        reject(err);
      }
    });
  });
};

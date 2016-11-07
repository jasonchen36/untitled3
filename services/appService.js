/**
 * Created by moejay on 15-12-24.
 */

var mongoose = require('mongoose'),
    AppSetting = mongoose.model('AppSetting'),
    migrator = require('../../db/migrate');

var KEY_MAINTENANCE = "mainteneance";
var KEY_DB_VERSION = "db_version";


exports.upgradeDbToLatest = function(callback){
    getCurrentDbVersion(function(err, currentDbVersion){
        setMaintenanceMode({
            isMaintenanceModeOn : true
        },function(err){
            if (err)
            {
                callback(err);
                return;
            }
            migrator.upgrade(currentDbVersion, function(err, newDbVersion){
                if (err)
                {
                    callback(err);
                    return;
                }
                setCurrentDbVersion({dbVersion : newDbVersion},function(err){
                    setMaintenanceMode({isMaintenanceModeOn : false });
                    if (err)
                    {
                        callback(err);
                        return;
                    }
                    callback(null);
                });

            });
        });

    });

};



var getCurrentDbVersion  = exports.getCurrentDbVersion  = function(callback){
    AppSetting.findOne({key : KEY_DB_VERSION}, function(err,versionSetting){
        if (err)
        {
            callback(err);
            return;
        }
        if (versionSetting !== undefined){

            callback(null,( versionSetting ? versionSetting.value : 0 ));
        }
        else{
            callback(null, 0);
        }
    });
};

/**
 * Sets the site's maintenance mode
 * @param options  | Object , { dbVersion : Integer }
 * @param callback
 */
var setCurrentDbVersion = exports.setCurrentDbVersion = function(options, callback) {
    AppSetting.update({
        key : KEY_DB_VERSION
    }, {
        $set : {
            value : options.dbVersion
        }
    },{
        upsert : true
    }, function(err){
        if (undefined !== callback)
        {
            callback(err);
            return;
        }

        callback();
    });
};

/**
 * Get the site's maintenance mode
 * @param callback
 */
var getMaintenanceMode = exports.getMaintenanceMode = function(options, callback) {
    AppSetting.findOne({key : KEY_MAINTENANCE}, callback);
};
/**
 * Sets the site's maintenance mode
 * @param options  | Object , { isMaintenanceModeOn : Bool }
 * @param callback
 */
var setMaintenanceMode = exports.setMaintenanceMode = function(options, callback) {
    AppSetting.update({
        key : KEY_MAINTENANCE
    }, {
        $set : {
            value : options.isMaintenanceModeOn
        }
    },{
        upsert : true
    }, function(err){
        if (undefined !== callback)
        {
            if (err)
                callback(err);
            else
                callback(null);
        }

    });
};
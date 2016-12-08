var Promise = require('bluebird');
var im = Promise.promisifyAll(require('imagemagick'));
var logger = require('../services/logger.service');
var fs = require('fs');
var isWin = /^win/.test(process.platform);
if (isWin === true) {
    logger.info('Windows platform detected, altering default imagemagick convert.path');
    im.convert.path = 'C:\\Program Files\\ImageMagick-7.0.3-Q16\\magick';
    im.identify.path = 'C:\\Program Files\\ImageMagick-7.0.3-Q16\\magick';
}



exports.resize = function(sourcePath, destinationPath, newWidth) {
    if (fileExists(sourcePath)) {
        return im.identifyAsync(sourcePath).then(function() {
            return im.resizeAsync({
                srcPath: sourcePath,
                dstPath: destinationPath,
                width: newWidth
            }).catch(function(err) {
                return Promise.reject(new Error(err));
            });
        }).catch(function(err) {
            // not a supported image format
            return Promise.resolve();
        });
    } else {
      return Promise.reject(new Error('File does not exist'));
    }
};

function fileExists(path) {
    try  {
        return fs.statSync(path).isFile();
    }
    catch (e) {
        if (e.code == 'ENOENT') { // no such file or directory. File really does not exist
            logger.error('File does not exist: %s', path);
            return false;
        }

        console.log("Exception fs.statSync (" + path + "): " + e);
        throw e; // something else went wrong, we don't have rights, ...
    }
}
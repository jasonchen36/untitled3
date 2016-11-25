var Promise = require('bluebird');
var im = Promise.promisifyAll(require('imagemagick'));
var logger = require('../services/logger.service');
var isWin = /^win/.test(process.platform);
if (isWin === true) {
    logger.info('Windows platform detected, altering defauly imagemagick convert.path');
    im.convert.path = 'C:\\Program Files\\ImageMagick-7.0.3-Q16\\magick';
}



exports.resize = function(sourcePath, destinationPath, newWidth) {
    return im.resizeAsync({
        srcPath: sourcePath,
        dstPath: destinationPath,
        width: newWidth
    }).catch(function(err) {
        return Promise.reject(new Error(err));
    });
};
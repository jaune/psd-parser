var _fs = require('fs'),
    _util = require('util'),
    _events = require('events');


var LocalFileParser = function () {
    this.fd = null;
};

/**
 * @override
 *
 * @param next
 * @param length
 * @param position
 */
LocalFileParser.prototype.createCursor = function (position, length, next) {
    var me = this;
    var buffer = new Buffer(length);

    _fs.read(this.fd, buffer, 0, length, position, function (error, bytesRead, buffer) {
        if (error) return me.emit('error', error);
        if (bytesRead !== length) return me.emit('error', new Error('bytesRead (' + bytesRead + ') !== length (' + length + ')'));

        next(new BufferCursor(buffer));
    });
};

LocalFileParser.prototype.openFile = function (path, next) {
    var me = this;

    _fs.open(path, 'r', function (error, fd) {
        if (error) return me.emit('error', error);

        me.fd = fd;

        me.emit('File');
        next();
    });
};

/**
 * @override
 *
 * @param path
 * @param next
 */
LocalFileParser.prototype.parse = function (path, next) {
    var me = this;

    this.openFile(path, function () {
        me.parseFileHeaderSection();
    });


};

module.exports = LocalFileParser;

var _util = require('util');

var AbstractParser = require('./AbstractParser.js');
var DataViewCursor = require('./DataViewCursor.js');

/**
 * @extends AbstractParser
 * @constructor
 */
var DataViewParser = function () {
    this.data = null;

    AbstractParser.apply(this, arguments);
};

_util.inherits(DataViewParser, AbstractParser);

/**
 * @override
 *
 * @param data
 * @param next
 */
DataViewParser.prototype.parse = function (data, next) {
    this.data = data;

    this.parseFileHeaderSection();
};


/**
 * @override
 *
 * @param next
 * @param length
 * @param position
 */
DataViewParser.prototype.createCursor = function (position, length, next) {
    var cursor = new DataViewCursor(this.data, position, length);
    next(cursor);
};

module.exports = DataViewParser;
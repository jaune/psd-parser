var DataViewCursor = function (data, offset, length) {

    this.offset = offset;
    this.length = length;

    /**
     * @private
     * @type DataView
     */
    this.data = data;
};

DataViewCursor.prototype.readString16 = function () {
    var characters = [];

    var i, l;
    for (i = this.offset, l = this.offset + this.length; i < l; i +=2) {
        characters.push(this.data.getUint16(i, false));
    }

    return String.fromCharCode.apply(null, characters);
};

DataViewCursor.prototype.readString8 = function () {
    var characters = [];

    var i, l;
    for (i = this.offset, l = this.offset + this.length; i < l; i++) {
        characters.push(this.data.getUint8(i));
    }

    return String.fromCharCode.apply(null, characters);
};



DataViewCursor.prototype.readFloat64 = function () {//TODO
    var value = this.data.getFloat64(this.offset);
    this.offset += 8;
    return value;
};

DataViewCursor.prototype.moveFrom = function (value) {
    this.offset += value;
};

DataViewCursor.prototype.readUInt8 = function () {
    var value = this.data.getUint8(this.offset);
    this.offset += 1;
    return value;
};

DataViewCursor.prototype.readInt8 = function () {
    var value = this.data.getInt8(this.offset);
    this.offset += 1;
    return value;
};

DataViewCursor.prototype.readUInt16 = function () {
    var value = this.data.getUint16(this.offset, false);
    this.offset += 2;
    return value;
};

DataViewCursor.prototype.readInt16 = function () {
    var value = this.data.getInt16(this.offset, false);
    this.offset += 2;
    return value;
};

DataViewCursor.prototype.readUInt32 = function () {
    var value = this.data.getUint32(this.offset, false);
    this.offset += 4;
    return value;
};

DataViewCursor.prototype.readInt32 = function () {
    var value = this.data.getInt32(this.offset, false);
    this.offset += 4;
    return value;
};

module.exports = DataViewCursor;
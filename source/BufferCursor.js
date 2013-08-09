var BufferCursor = function (buffer) {
    this.offset = 0;
    this.length = buffer.length;

    /**
     * @private
     * @type Buffer
     */
    this.buffer = buffer;
};

BufferCursor.prototype.moveFrom = function (value) {
    this.offset += value;
};

BufferCursor.prototype.readUInt8 = function () {
    var value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
};

BufferCursor.prototype.readInt8 = function () {
    var value = this.buffer.readInt8(this.offset);
    this.offset += 1;
    return value;
};

BufferCursor.prototype.readUInt16 = function () {
    var value = this.buffer.readUInt16BE(this.offset);
    this.offset += 2;
    return value;
};

BufferCursor.prototype.readInt16 = function () {
    var value = this.buffer.readInt16BE(this.offset);
    this.offset += 2;
    return value;
};

BufferCursor.prototype.readUInt32 = function () {
    var value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
};

BufferCursor.prototype.readInt32 = function () {
    var value = this.buffer.readInt32BE(this.offset);
    this.offset += 4;
    return value;
};

module.exports = BufferCursor;
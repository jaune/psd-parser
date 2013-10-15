/**
 *
 * @param cursor
 * @constructor
 */

var TextEngineDataTokenizer = function (cursor) {
    this.cursor = cursor;

    this.stack = [];

    this.value = null;
};

TextEngineDataTokenizer.prototype.pushState = function (state) {
    this.stack.push(state);
};

TextEngineDataTokenizer.prototype.popState = function () {
    var state = this.stack.pop();
    return state;
};

TextEngineDataTokenizer.prototype.peekState = function () {
    var l = this.stack.length;
    if (l === 0) {
        return null;
    }
    return this.stack[l - 1];
};

TextEngineDataTokenizer.prototype.next = function () {
    var state = this.peekState();
    if (state === null) {
        return null;
    }
    this.value = null;
    return this['next' + state]();
};

TextEngineDataTokenizer.prototype.nextObject = function () {
    var cursor = this.cursor;
    var c = cursor.readUInt8();

    while ((c === 0x0a) || (c === 0x09)) {
        c = cursor.readUInt8();
    } // white space

    if (c === 0x2f) { // /
        var text = '';
        c = cursor.readUInt8();
        while (!((c === 0x0a) || (c === 0x09) || (c === 0x20))) {
            text += String.fromCharCode(c);
            c = cursor.readUInt8();
        }
        this.value = text;
        this.pushState('Property');
        return 'PropertyName';
    } else if (c === 0x3e) { // >>
        c = cursor.readUInt8();
        if (c === 0x3e) {
            this.popState();
            return '>>';
        } else {
            console.debug('---*---');
            return null;
        }
    } else {
        console.debug('---*---', c);
        return null;
    }
};

TextEngineDataTokenizer.prototype.nextAny = function () {
    var cursor = this.cursor;
    var c = cursor.readUInt8();

    return this.readAny(c);
};

TextEngineDataTokenizer.prototype.readAny = function (c) {
    var cursor = this.cursor;
    var v;

    while ((c === 0x0a) || (c === 0x09) || (c === 0x20)) {
        c = cursor.readUInt8();
    } // white space

    if (c === 0x3c) { // <<
        c = cursor.readUInt8();
        if (c === 0x3c) {
            this.pushState('Object');
            return '<<';
        } else {
            console.debug('---*---');
            return null;
        }
    } else if (c === 0x28) { // (
        this.value = this.readString();
        return 'String';
    } else if (c === 0x74 || c === 0x66) { // true / false
        this.value = this.readBoolean(c);
        return 'Boolean';
    } else if ((c >= 0x30 && c <= 0x30 + 9) || (c === 0x2e) || (c === 0x2d)) { // 0-9 . -
        this.value = this.readNumber(c);
        return 'Number';
    } else if (c == 0x5b) { // [
        this.pushState('Array');
        return '[';
    } else {

        console.debug('---*---', c.toString(16), this.stack);

        throw new Error();
        return null;
    }
};

TextEngineDataTokenizer.prototype.nextProperty = function () {
    this.popState();
    return this.nextAny();
};


TextEngineDataTokenizer.prototype.readBoolean = function (c) {
    if (c === 0x74) {
        this.cursor.moveFrom(3);
        return true;
    } else {
        this.cursor.moveFrom(4);
        return false;
    }
};

TextEngineDataTokenizer.prototype.readNumber = function (c) {
    var cursor = this.cursor;
    var value = '';

    while (!((c === 0x0a) || (c === 0x09) || (c === 0x20))) {
        value += String.fromCharCode(c);
        c = cursor.readUInt8();
    }

    return Number(value);
};

TextEngineDataTokenizer.prototype.nextArray = function () {
    var cursor = this.cursor;
    var c = cursor.readUInt8();

    while ((c === 0x0a) || (c === 0x09) || (c === 0x20)) {
        c = cursor.readUInt8();
    } // white space

    if (c === 0x5d) { // ]
        this.popState();
        return ']';
    }

    return this.readAny(c);
};

TextEngineDataTokenizer.prototype.readString = function () {
    var cursor = this.cursor;
    var c = cursor.readUInt16();
    var value = '';

    if (c !== 0xfeff) {
        console.debug('---*---');
        return null;
    }

    c = cursor.readUInt16();

    while (!(c === 0x290a)) {
        value += String.fromCharCode(c);
        c = cursor.readUInt16();
    }

    return value;
};

module.exports = TextEngineDataTokenizer;

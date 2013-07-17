var _fs = require('fs'),
    _path = require('path'),
    _buffer = require('buffer'),
    _util = require('util'),
    _events = require('events');

var Buffer = _buffer.Buffer;

var Parser = function () {
    this.fd = null;

    _events.EventEmitter.call(this);
};
_util.inherits(Parser, _events.EventEmitter);

Parser.COLOR_MODE_BITMAP = 0;
Parser.COLOR_MODE_GRAYSCALE = 1;
Parser.COLOR_MODE_INDEXED = 2;
Parser.COLOR_MODE_RGB = 3;
Parser.COLOR_MODE_CMYK = 4;
Parser.COLOR_MODE_MULTICHANNEL = 5;
Parser.COLOR_MODE_DUOTONE = 6;
Parser.COLOR_MODE_LAB = 7;


Parser.COLOR_MODE_TEXT_BITMAP = 'Bitmap';
Parser.COLOR_MODE_TEXT_GRAYSCALE = 'Grayscale';
Parser.COLOR_MODE_TEXT_INDEXED = 'Indexed';
Parser.COLOR_MODE_TEXT_RGB = 'RGB';
Parser.COLOR_MODE_TEXT_CMYK = 'CMYK';
Parser.COLOR_MODE_TEXT_MULTICHANNEL = 'Multichannel';
Parser.COLOR_MODE_TEXT_DUOTONE = 'Duotone';
Parser.COLOR_MODE_TEXT_LAB = 'Lab';

Parser.prototype.parse = function (path, next) {
    var me = this;

    this.openFile(path, function (error) {
        if (error) return next(error);

        me.parseFileHeaderSection(function (error, section) {
            if (error) return next(error);

            me.parseColorModeDataSection(section._length, function (error, section) {
                if (error) return next(error);

                me.parseImageResourcesSection(section._position + section._length, function (error, section) {
                    if (error) return next(error);

                    me.parseLayerAndMaskInformationSection(section._position + section._length, function (error, section) {
                        if (error) return next(error);

                        me.parseImageDataSection(section._position + section._length, function (error, section) {
                            if (error) return next(error);

                            me.emit('Sections');
                            next();
                        });
                    });
                });
            });
        });
    });
};

Parser.prototype.openFile = function (path, next) {
    var me = this;

    _fs.open(path, 'r', function (error, fd) {
        if (error) return next(error);

        me.fd = fd;

        me.emit('File');
        next();
    });
};

Parser.prototype.parseSection = function (position, length, next) {
    var buffer = new Buffer(length);

    _fs.read(this.fd, buffer, 0, length, position, function (error, bytesRead, buffer) {
        if (error) return next(error);
        if (bytesRead !== length) return next('bytesRead (' + bytesRead + ') !== length (' + length + ')');

        next(null, new Cursor(buffer));
    });
};

Parser.prototype.parseImageDataSection = function (position, next) {
    var me = this;

    this.parseSection(position, 2, function (error, cursor) {
        if (error) return next(error);

        var section = {
            _position: position,
            _length: null,
            compression_method: cursor.readUInt16()
        };

        me.emit('ImageDataSection', section);
        next(null, section);
    });
};

Parser.prototype.parseLayerAndMaskInformationSection = function (position, next) {
    var me = this;

    this.parseSection(position, 4, function (error, cursor) {
        if (error) return next(error);

        var length = cursor.readUInt32();
        var section = {
            _position: position,
            _length: 4 + length,
            length: length
        };

        me.emit('LayerAndMaskInformationSection', section);
        next(null, section);
    });
};

Parser.prototype.parseColorModeDataSection = function (position, next) {
    var me = this;

    this.parseSection(position, 4, function (error, cursor) {
        if (error) return next(error);

        var length = cursor.readUInt32();
        var section = {
            _position: position,
            _length: 4 + length,
            length: length
        };

        me.emit('ColorModeDataSection', section);
        next(null, section);
    });
};

Parser.prototype.parseImageResourcesSection = function (position, next) {
    var me = this;

    this.parseSection(position, 4, function (error, cursor) {
        if (error) return next(error);

        var length = cursor.readUInt32();
        var section = {
            _position: position,
            _length: 4 + length,
            length: length
        };

        me.emit('ImageResourcesSection', section);
        next(null, section);
    });
};

Parser.prototype.parseFileHeaderSection = function (next) {
    var me = this;

    this.parseSection(0, 26, function (error, cursor) {
        if (error) return next(error);

        var signature = String.fromCharCode(
            cursor.readUInt8(),
            cursor.readUInt8(),
            cursor.readUInt8(),
            cursor.readUInt8()
        );
        var version = cursor.readUInt16();

        if (signature !== '8BPS') return next('invalid format: wrong signature');
        if (version !== 1) return next('invalid format: wrong version');

        cursor.moveFrom(6); // Reserved

        var section = {
            _position: 0,
            _length: 26,
            signature: signature,
            version: version,
            channels: cursor.readUInt16(),
            height: cursor.readUInt32(),
            width: cursor.readUInt32(),
            depth: cursor.readUInt16(),
            color_mode: cursor.readUInt16()
        };
        //TODO var color_mode_text = ;

        me.emit('FileHeaderSection', section);
        next(null, section);
    });
};

var Cursor = function (buffer) {
    this.offset = 0;
    this.buffer = buffer;
};

Cursor.prototype.rewind = function () {
    this.offset = 0;
};

Cursor.prototype.moveFrom = function (value) {
    this.offset += value;
};

Cursor.prototype.readUInt8 = function () {
    var value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
};

Cursor.prototype.readUInt16 = function () {
    var value = this.buffer.readUInt16BE(this.offset);
    this.offset += 2;
    return value;
};

Cursor.prototype.readUInt32 = function () {
    var value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
};


var parser = new Parser();

parser.parse(_path.join(__dirname, 'resource', '960-grid-template-v1.psd'), function (error) {
    if (error) throw error;

    console.log('done !');
});

parser.on('ColorModeDataSection', function (section) {
    console.log('===ColorModeDataSection===');
    console.log(_util.inspect(section));
});

parser.on('FileHeaderSection', function (section) {
    console.log('===FileHeaderSection===');
    console.log(_util.inspect(section));
});

parser.on('ImageResourcesSection', function (section) {
    console.log('===ImageResourcesSection===');
    console.log(_util.inspect(section));
});

parser.on('LayerAndMaskInformationSection', function (section) {
    console.log('===LayerAndMaskInformationSection===');
    console.log(_util.inspect(section));
});

parser.on('ImageDataSection', function (section) {
    console.log('===ImageDataSection===');
    console.log(_util.inspect(section));
});

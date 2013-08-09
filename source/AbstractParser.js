var _util = require('util'),
    _events = require('events');

var Section = require('./Section.js'),
    TextEngineDataTokenizer = require('./TextEngineDataTokenizer.js'),
    TextEngineDataParser = require('./TextEngineDataParser.js');



/**
 *
 * @class
 * @constructor
 */
var AbtractParser = function () {
    this.layers = [];
    this.layers_count = null;

    _events.EventEmitter.call(this);

    var me = this;

    this.on('FileHeaderSection', function (section) {
        me.parseColorModeDataSection(section.getNextSiblingPosition());
    });

    this.on('ColorModeDataSection', function (section) {
        me.parseImageResourcesSection(section.getNextSiblingPosition());
    });

    this.on('ImageResourcesSection', function (section) {
        me.parseLayerAndMaskInformationSection(section.getNextSiblingPosition());
    });

    this.on('LayerAndMaskInformationSection', function (section) {
        me.parseImageDataSection(section.getNextSiblingPosition());
    });

    this.on('LayerAndMaskInformationSection', function (section) {
        me.parseLayerInformation(section.getFirstChildPosition());
    });

    this.on('LayerInformation', function (section) {
        //me.parseAdditionalLayerInformation(section.getNextSiblingPosition());
    });

    this.on('LayerInformation', function (section) {
        me.layers_count = section.attributes.layers_count;
        me.parseLayerRecord(section.getFirstChildPosition());
    });

    this.on('LayerRecord', function (section) {
        me.layers.push(section);
        if (me.layers.length < me.layers_count) {
            me.parseLayerRecord(section.getNextSiblingPosition());
        }
    });

    this.on('LayerRecord', function (section) {
        me.parseLayerMaskAdjustmentLayerData(section.getFirstChildPosition(), section);
    });

    this.on('LayerMaskAdjustmentLayerData', function (section) {
        me.parseLayerBlendingRangesData(section.getNextSiblingPosition(), section.parent);
    });

    this.on('LayerBlendingRangesData', function (section) {
        var position = section.getNextSiblingPosition();

        this.createCursor(position, 1, function (cursor) {
            var l = cursor.readUInt8(),
                padded = l + (4 - (l % 4));
            me.createCursor(position + 1, l, function (cursor) {
                var layer = section.parent;
                layer.attributes.layer_name = cursor.readString8();
                me.emit('LayerRecordName', layer);
                me.parseAdditionalLayerInformation(position + padded, layer);
            });
        });

    });

    this.on('AdditionalLayerInformation', function (section) {
        var parent = section.parent;
        var position = section.getNextSiblingPosition();

        if (parent && (parent.name === 'LayerRecord')) {
            if ((position < (parent.position + parent.length))) {
                me.parseAdditionalLayerInformation(position, parent);
            } else {
                me.emit('Layer', parent);
            }
        }
    });

    this.on('AdditionalLayerInformation', function (section) {
        var parent = section.parent;
        var position = section.getFirstChildPosition();
        var key = section.attributes.key;

        switch (key) {
            case 'luni':
                me.parseUnicodeLayerName(position, parent);
                break;
            case 'fxrp':
                me.parseReferencePoint(position, parent);
                break;
            case 'lclr':
                me.parseSheetColorSetting(position, parent);
                break;
            case 'lspf':
                me.parseProtectedSetting(position, parent);
                break;
            case 'lsct':
                me.parseSectionDividerSetting(position, parent);
                break;
            case 'lyid':
                me.parseLayerID(position, parent);
                break;
            case 'lnsr':
                me.parseLayerNameSourceSetting(position, parent);
                break;
            case 'lyvr':
                me.parseLayerVersion(position, parent);
                break;
            case 'knko':
                me.parseKnockoutSetting(position, parent);
                break;
            case 'infx':
                me.parseBlendInteriorElements(position, parent);
                break;
            case 'clbl':
                me.parseBlendClippingElements(position, parent);
                break;
            case 'TySh':
                me.parseTypeToolObjectSetting(position, parent);
                break;
            default:
                console.debug(key);
        }
    });
};
_util.inherits(AbtractParser, _events.EventEmitter);

AbtractParser.COLOR_MODE_BITMAP = 0;
AbtractParser.COLOR_MODE_GRAYSCALE = 1;
AbtractParser.COLOR_MODE_INDEXED = 2;
AbtractParser.COLOR_MODE_RGB = 3;
AbtractParser.COLOR_MODE_CMYK = 4;
AbtractParser.COLOR_MODE_MULTICHANNEL = 5;
AbtractParser.COLOR_MODE_DUOTONE = 6;
AbtractParser.COLOR_MODE_LAB = 7;

AbtractParser.COLOR_MODE_TEXT_BITMAP = 'Bitmap';
AbtractParser.COLOR_MODE_TEXT_GRAYSCALE = 'Grayscale';
AbtractParser.COLOR_MODE_TEXT_INDEXED = 'Indexed';
AbtractParser.COLOR_MODE_TEXT_RGB = 'RGB';
AbtractParser.COLOR_MODE_TEXT_CMYK = 'CMYK';
AbtractParser.COLOR_MODE_TEXT_MULTICHANNEL = 'Multichannel';
AbtractParser.COLOR_MODE_TEXT_DUOTONE = 'Duotone';
AbtractParser.COLOR_MODE_TEXT_LAB = 'Lab';


AbtractParser.prototype.parseDescriptorStructure = function (position, next) {
    var me = this;
    var p = position;
    var offset = 0;

    me.createCursor(p, 4, function (cursor) {
        var l = cursor.readInt32();

        p += cursor.length;
        offset += cursor.length;

        me.createCursor(p, l * 2, function (cursor) {
            var classIDName = cursor.readString16(); // ???

            p += cursor.length;
            offset += cursor.length;

            me.parseDescriptorKey(p, function (classID, o) {

                p += o;
                offset += o;

                me.createCursor(p, 4, function (cursor) {
                    var item_count = cursor.readInt32();

                    offset += cursor.length;
                    p += cursor.length;


                    var descriptor = {
                        classIDName: classIDName,
                        classID: classID,
                        item_count: item_count,
                        items: {}
                    };

                    me.parseDescriptorStructureItem(p, descriptor, function (p) {
                        next(descriptor, p - position);
                    });
                });
            });
        });
    });
};

AbtractParser.prototype.parseDescriptorStructureItem = function (position, descriptor, next) {
    var me = this;
    var p = position;

    var next_item = function (p) {
        var l = Object.keys(descriptor.items).length;
        if (l < descriptor.item_count) {
            me.parseDescriptorStructureItem(p, descriptor, next);
        } else {
            next(p);
        }
    };

    this.parseDescriptorKey(position, function (key, o) {

        p += o;
        me.createCursor(p, 4, function (cursor) {
            var type = String.fromCharCode(
                cursor.readUInt8(),
                cursor.readUInt8(),
                cursor.readUInt8(),
                cursor.readUInt8()
            );

            p += cursor.length;
            var k = key.trim();

            switch (type) {
                case 'TEXT':
                    me.parseUnicodeString(p, function (value, o) {
                        p += o;
                        descriptor.items[k] = value;
                        next_item(p);
                    });
                    break;
                case 'enum':
                case 'Objc':
                case 'GlbO':
                    me.parseDescriptorKey(p, function (id, o) {
                        p += o;
                        me.parseDescriptorKey(p, function (value, o) {
                            p += o;
                            descriptor.items[k] = {
                                id: id,
                                value: value
                            };
                            next_item(p);
                        });
                    });
                    break;
                case 'long':
                    me.createCursor(p, 4, function (cursor) {
                        p += cursor.length;
                        descriptor.items[k] = cursor.readInt32();
                        next_item(p);
                    });
                    break;
                case 'doub':
                    me.createCursor(p, 8, function (cursor) {
                        p += cursor.length;
                        descriptor.items[k] = cursor.readFloat64();
                        next_item(p);
                    });
                    break;
                case 'tdta':
                    me.createCursor(p, 4, function (cursor) {
                        p += cursor.length;
                        var l = cursor.readInt32();
                        descriptor.items[k] = me.readRawData(p, l);
                        p += l
                        next_item(p);
                    });
                    break;
                default:
                    console.debug(k, type);
            }
        });
    });
};

var RawData = function (position, length) {
    this.position = position;
    this.length = length;
    this.data = null;
};

AbtractParser.prototype.readRawData = function (position, length) {
    return new RawData(position, length);
};

AbtractParser.prototype.parseTypeToolObjectSetting = function (position, layer) {
    var me = this;
    var p = position;

    this.createCursor(position, 2 + (6 * 8) + 2 + 4, function (cursor) {
        var version = cursor.readInt16();

        if (version !== 1) {
            me.emit('error', new Error('invalid version: wrong type tool object setting version. Expected `1`, given `' + version + '`'));
        }

        var transform = [
            cursor.readFloat64(),
            cursor.readFloat64(),
            cursor.readFloat64(),
            cursor.readFloat64(),
            cursor.readFloat64(),
            cursor.readFloat64()
        ];

        var descriptor_version = cursor.readInt16();

        if (descriptor_version !== 50) {
            me.emit('error', new Error('invalid version: wrong type tool object setting descriptor version. Expected `50`, given `' + descriptor_version + '`'));
        }

        p += cursor.length;

        var section = new Section('TypeToolObjectSetting', position, {
            version: version,
            descriptor_version: descriptor_version,
            transform: transform
        });
        section.parent = layer;

        me.parseDescriptorStructure(p, function (descriptor, offset) {

            p += offset;

            section.attributes.text = descriptor;

            me.createCursor(p, 2 + 4, function (cursor) {
                p += cursor.length;

                var version = cursor.readInt16();

                if (version !== 1) {
                    me.emit('error', new Error('invalid version: wrong type tool object setting warp version. Expected `1`, given `' + version + '`'));
                }

                var descriptor_version = cursor.readInt32();

                if (descriptor_version !== 16) {
                    me.emit('error', new Error('invalid version: wrong type tool object setting warp descriptor version. Expected `16`, given `' + descriptor_version + '`'));
                }


                me.parseDescriptorStructure(p, function (descriptor, offset) {
                    p += offset;

                    section.attributes.warp = descriptor;

                    me.createCursor(p, 4 * 8, function (cursor) {

                        section.attributes.rectangle = [
                            cursor.readFloat64(),
                            cursor.readFloat64(),
                            cursor.readFloat64(),
                            cursor.readFloat64()
                        ];

                        me.parseTextEngineData(section.attributes.text.items.EngineData, function (data) {
                            section.attributes.text.items.EngineData.data = data;

                            me.commit(section);
                        });
                    });
                });
            });
        });
    });
};


AbtractParser.prototype.parseTextEngineData = function (data, next) {
    this.createCursor(data.position, data.length, function (cursor) {

        var tokenizer = new TextEngineDataTokenizer(cursor);
        var parser = new TextEngineDataParser();

        next(parser.parse(tokenizer));

    });
};




AbtractParser.prototype.parseDescriptorKey = function (position, next) {
    var me = this;
    var p = position;

    me.createCursor(p, 4, function (cursor) {
        var l = cursor.readInt32();
        if (l === 0) {
            l = 4;
        }
        p += cursor.length;
        me.createCursor(p, l, function (cursor) {
            next(cursor.readString8(), 4 + cursor.length);
        });
    });
};


AbtractParser.prototype.parseBlendClippingElements = function (position, layer) {
    //TODO
};

AbtractParser.prototype.parseBlendInteriorElements = function (position, layer) {
    //TODO
};

AbtractParser.prototype.parseKnockoutSetting = function (position, layer) {
    this.createCursor(position, 4, function (cursor) {
        layer.attributes.knockout_setting = (cursor.readInt8() !== 0);
    });
};

AbtractParser.prototype.parseLayerVersion = function (position, layer) {
    this.createCursor(position, 4, function (cursor) {
        layer.attributes.layer_version = cursor.readInt32();
    });
};

AbtractParser.prototype.parseLayerNameSourceSetting = function (position, layer) {
    this.createCursor(position, 4, function (cursor) {
        layer.attributes.layer_name_source_setting = cursor.readUInt32();
    });
};

AbtractParser.prototype.parseLayerID = function (position, layer) {
    this.createCursor(position, 4, function (cursor) {
        layer.attributes.layer_id = cursor.readUInt32();
    });
};

AbtractParser.prototype.parseSectionDividerSetting = function (position, layer) {
    //TODO
};

AbtractParser.prototype.parseProtectedSetting = function (position, layer) {
    this.createCursor(position, 4, function (cursor) {
        layer.attributes.protected_setting = cursor.readUInt32();
    });
};

AbtractParser.prototype.parseSheetColorSetting = function (position, layer) {
    this.createCursor(position, 4 * 2, function (cursor) {
        layer.attributes.sheet_color_setting = [
            cursor.readUInt16(),
            cursor.readUInt16(),
            cursor.readUInt16(),
            cursor.readUInt16()
        ];
    });
};

AbtractParser.prototype.parseReferencePoint = function (position, layer) {
    this.createCursor(position, 2 * 8, function (cursor) {
        layer.attributes.reference_point = [cursor.readFloat64(), cursor.readFloat64()];
    });
};

AbtractParser.prototype.parseUnicodeLayerName = function (position, layer) {
    this.parseUnicodeString(position, function (value, o) {
        layer.attributes.unicode_layer_name = value;
    });
};

AbtractParser.prototype.parseUnicodeString = function (position, next) {
    var me = this;

    this.createCursor(position, 4, function (cursor) {
        var l = cursor.readInt32() * 2;
        me.createCursor(position + 4, l, function (cursor) {
            next(cursor.readString16(), 4 + l);
        });
    });
};

AbtractParser.prototype.parseLayerRecord = function (position) {
    var me = this;
    var length = 0;

    this.createCursor(position, (4 * 4) + 2, function (cursor) {

        length += cursor.length;

        var attributes = {
            rectangle: {
                'top': cursor.readInt32(),
                'left': cursor.readInt32(),
                'bottom': cursor.readInt32(),
                'right': cursor.readInt32()
            },
            channels: null,
            blend_signature: null,
            blend_mode: null,
            opacity: null,
            clipping: null,
            flags: null,
            extra_length: null
        };
        var channels_count = cursor.readInt16();

        me.createCursor(position + (4 * 4) + 2, (channels_count * 6) + 4 + 4 + 1 + 1 + 1 + 1 + 4, function (cursor) {

            length += cursor.length;

            var i, channels = [];
            for (i = 0; i < channels_count; i++) {
                channels.push({
                    id: cursor.readInt16(),
                    data: cursor.readUInt32()
                });
            }
            attributes.channels = channels;

            attributes.blend_signature = String.fromCharCode(
                cursor.readUInt8(),
                cursor.readUInt8(),
                cursor.readUInt8(),
                cursor.readUInt8()
            );

            if (attributes.blend_signature !== '8BIM') {
                me.emit('error', new Error('invalid format: wrong blend signature. Expected `8BIM`, given `' + attributes.blend_signature + '`'));
                return;
            }

            attributes.blend_mode = String.fromCharCode( //TODO text ???
                cursor.readUInt8(),
                cursor.readUInt8(),
                cursor.readUInt8(),
                cursor.readUInt8()
            );

            attributes.opacity = cursor.readUInt8();
            attributes.clipping = cursor.readUInt8(); //TODO unsigned ???
            attributes.flags = cursor.readUInt8();  //TODO text ???

            cursor.moveFrom(1); //TODO Filler ???

            attributes.extra_length = cursor.readUInt32(); //TODO unsigned ???

            var section = new Section('LayerRecord', position, attributes);

            section.firstChildOffset = length;
            section.length = length + attributes.extra_length;

            me.commit(section);
        });

    });
};

AbtractParser.prototype.parseLayerBlendingRangesData = function (position, parent) {
    var me = this;

    this.createCursor(position, 4, function (cursor) {

        var length = cursor.readInt32(); //TODO unsigned ???
        var section = new Section('LayerBlendingRangesData', position, {
            length: length
        });

        section.length = 4 + length;
        section.parent = parent;

        me.commit(section);
    });
};

AbtractParser.prototype.parseLayerMaskAdjustmentLayerData = function (position, parent) {
    var me = this;

    this.createCursor(position, 4, function (cursor) {

        var length = cursor.readInt32(); //TODO unsigned ???
        var section = new Section('LayerMaskAdjustmentLayerData', position, {
            length: length
        });

        section.length = 4 + length;
        section.parent = parent;

        me.commit(section);
    });
};


AbtractParser.prototype.parseAdditionalLayerInformation = function (position, parent) {
    var me = this;
    var buffer_length = 4 + 4 + 4;

    this.createCursor(position, buffer_length, function (cursor) {

        var signature = String.fromCharCode(
            cursor.readUInt8(),
            cursor.readUInt8(),
            cursor.readUInt8(),
            cursor.readUInt8()
        );

        if (!(signature === '8BIM' || signature === '8B64')) {

            return me.emit('error', new Error('invalid format: wrong signature. `' + signature + '` [0x'+position.toString(16)+']'));
        }

        var key = String.fromCharCode(
            cursor.readUInt8(),
            cursor.readUInt8(),
            cursor.readUInt8(),
            cursor.readUInt8()
        );

        var length = cursor.readInt32();

        var section = new Section('AdditionalLayerInformation', position, {
            length: length,
            signature: signature,
            key: key
        }, parent);

        section.length = buffer_length + length;
        section.firstChildOffset = buffer_length;

        me.commit(section);
    });

};

AbtractParser.prototype.parseLayerInformation = function (position) {
    var me = this;

    this.createCursor(position, 6, function (cursor) {
        var length = cursor.readInt32();

        length = length + (2 - (length % 2));

        var layers_count = cursor.readInt16();
        var section = new Section('LayerInformation', position, {
            length: length,
            layers_count: Math.abs(layers_count)
        });

        section.length = 6 + length;

        section.firstChildOffset = 6;

        me.commit(section);
    });
};

/*
 AbtractParser.prototype.parseGlobalLayerMaskInformation = function (position) {
 var me = this;
 var buffer_length = 4 + 2 + 8 + 2 + 1;

 console.log('GlobalLayerMaskInformation: '+position.toString(16));

 this.createCursor(position, buffer_length, function (cursor) {

 var length = cursor.readInt32();

 var section = new Section('GlobalLayerMaskInformation', position, {
 length: length,
 overlay_color_space: cursor.readInt16(),
 color_components: [ //TODO unsigned ???
 cursor.readUInt16(),
 cursor.readUInt16(),
 cursor.readUInt16(),
 cursor.readUInt16()
 ],
 opacity: cursor.readUInt16(),
 kind: cursor.readInt8()
 });

 section.length = buffer_length + length;
 section.firstChildOffset = buffer_length;


 console.dir(section);


 me.commit(section);
 });
 };
 */


AbtractParser.prototype.parseImageDataSection = function (position) {
    var me = this;

    this.createCursor(position, 2, function (cursor) {

        me.commit(new Section('ImageDataSection', position, {
            compression_method: cursor.readUInt16()
        }))

    });
};

AbtractParser.prototype.parseLayerAndMaskInformationSection = function (position) {
    var me = this;

    this.createCursor(position, 4, function (cursor) {
        var length = cursor.readUInt32();
        var section = new Section('LayerAndMaskInformationSection', position, {
            length: length
        });

        section.length = 4 + length;
        section.firstChildOffset = 4;

        me.commit(section);
    });
};

AbtractParser.prototype.parseColorModeDataSection = function (position) {
    var me = this;

    this.createCursor(position, 4, function (cursor) {
        var length = cursor.readUInt32();
        var section = new Section('ColorModeDataSection', position, {
            length: length
        });

        section.length = 4 + length;

        me.commit(section);
    });
};

AbtractParser.prototype.parseImageResourcesSection = function (position) {
    var me = this;

    this.createCursor(position, 4, function (cursor) {

        var length = cursor.readUInt32();
        var section = new Section('ImageResourcesSection', position, {
            length: length
        });

        section.length = 4 + length;

        me.commit(section);
    });
};

AbtractParser.prototype.parseFileHeaderSection = function () {
    var me = this;

    this.createCursor(0, 26, function (cursor) {

        var signature = String.fromCharCode(
            cursor.readUInt8(),
            cursor.readUInt8(),
            cursor.readUInt8(),
            cursor.readUInt8()
        );
        var version = cursor.readUInt16();

        if (signature !== '8BPS') return me.emit('error', new Error('invalid format: wrong signature'));
        if (version !== 1) return me.emit('error', new Error('invalid format: wrong version'));

        cursor.moveFrom(6); // Reserved

        var section = new Section('FileHeaderSection', 0, {
            signature: signature,
            version: version,
            channels: cursor.readUInt16(),
            height: cursor.readUInt32(),
            width: cursor.readUInt32(),
            depth: cursor.readUInt16(),
            color_mode: cursor.readUInt16()
            //TODO var color_mode_text = ;
        });

        section.length = 26;

        me.commit(section);
    });
};

AbtractParser.prototype.commit = function (section) {
    this.emit(section.name, section);
};


/**
 * @abstract
 *
 * @param data
 * @param next
 */
AbtractParser.prototype.parse = function (data, next) {
};

/**
 * @abstract
 *
 * @param position
 * @param length
 * @param next
 */
AbtractParser.prototype.createCursor = function (position, length, next) {
};

module.exports = AbtractParser;




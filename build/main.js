(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Parser = require('./source').DataViewParser;

var dropzone = document.getElementById('dropzone');
var fontlist = document.getElementById('fontlist');

dropzone.addEventListener('dragenter', dragEnterHandler, false);
dropzone.addEventListener('dragover', dragOverHandler, false);
dropzone.addEventListener('drop', dropHandler, false);

function dragEnterHandler(event) {
    if (event.dataTransfer.types.indexOf('Files') === 0) {
        event.preventDefault();
    }
}

function dragOverHandler(event) {
    if (event.dataTransfer.types.indexOf('Files') === 0) {
        event.dataTransfer.dropEffect = 'move';
        event.preventDefault();
    }
}

function requestFontProvider (family, li) {
    (function () {
        var google_family = family.replace(/([a-z])([A-Z])/g, '$1+$2');
        var google_api_url = 'http://www.google.com/fonts/specimen/'+google_family+'';

        var yql = 'use "http://yqlblog.net/samples/data.html.cssselect.xml" as data.html.cssselect; select * from data.html.cssselect where url="'+google_api_url+'" and css=".styles .fontitem .identifier"';
        $.ajax({
            url: 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(yql) + '&format=json&callback=?',
            dataType: 'jsonp',
            crossDomain: 'true',
            success: function(data) {
                if (data.query.results && data.query.results.results) {
//                                            li.style.display = 'block';
                    li.innerHTML += ' <a target="_blank" href="'+google_api_url+'">Google Fonts</a>';
                }
            }
        });
    })();

    (function () {
        var squirrel_family = family.replace(/([a-z])([A-Z])/g, '$1-$2');

        var squirrel_api_url = 'http://www.fontsquirrel.com/api/familyinfo/'+squirrel_family;
        var squirrel_use_url = 'http://www.fontsquirrel.com/fonts/'+squirrel_family;

        var yql = 'select * from json where url="'+squirrel_api_url+'" or url="http://www.fontsquirrel.com/api/familyinfo/'+family+'"';

        $.ajax({
            url: 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(yql) + '&format=json&callback=?',
            dataType: 'jsonp',
            crossDomain: 'true',
            success: function(data) {
                if (data.query.results && data.query.results.json) {
                    console.debug(data.query.results.json);
//                                            li.style.display = 'block';
                    li.innerHTML += ' <a target="_blank" href="'+squirrel_use_url+'">Font Squirrel</a>';
                }
            }
        });
    })();

    (function () {
        var typekit_family = family.replace(/([a-z])([A-Z])/g, '$1-$2');

        var typekit_family_url = 'https://typekit.com/fonts/'+typekit_family;

        var yql = 'use "http://yqlblog.net/samples/data.html.cssselect.xml" as data.html.cssselect; select * from data.html.cssselect where url="'+typekit_family_url+'" and css=".font-variations dt"';

        $.ajax({
            url: 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(yql) + '&format=json&callback=?',
            dataType: 'jsonp',
            crossDomain: 'true',
            success: function(data) {
                if (data.query.results && data.query.results.results) {
//                                            li.style.display = 'block';
                    li.innerHTML += ' <a target="_blank" href="'+typekit_family_url+'">typekit</a>';
                }
            }
        });
    })();
}

function dropHandler(event) {
    if (event.dataTransfer.types.indexOf('Files') === 0) {
        event.preventDefault();

        var files = event.dataTransfer.files, i, l;
        for (i = 0, l = files.length; i < l; i++) {
            var file = files.item(i);
            var reader = new FileReader();

            reader.addEventListener('load', function (event) {
                var parser = new Parser();
/*
                parser.on('Layer', function (layer) {
                    // console.debug(layer.attributes.layer_name);
                });

 */

                var fonts = {};
                fontlist.innerHTML = '';

                parser.on('TypeToolObjectSetting', function (section) {
                    section.attributes.text.items.EngineData.data.ResourceDict.FontSet.forEach(function (font) {
                        if (!fonts.hasOwnProperty(font.Name)) {

                            if (font.Name === 'AdobeInvisFont') {
                                return;
                            }

                            var li = document.createElement('LI');
                            //li.innerHTML = font.Name +' '+ JSON.stringify(font) +' ';
                            li.innerHTML = font.Name;
                            // li.style.display = 'none';


                            var re = /^([a-z]+)(\-([a-z]*))*$/i;

                            var matches = re.exec(font.Name);

                            if (matches) {
                                requestFontProvider(matches[1], li);
                            }

                            fontlist.appendChild(li);

                        }
                        fonts[font.Name] = font.Name;
                    });
                });

                parser.parse(new DataView(reader.result), function () {
                    console.debug('done !');
                });

            }, false);

            reader.readAsArrayBuffer(file);
        }
    }
}

},{"./source":19}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
/**
 * The buffer module from node.js, for the browser.
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install buffer`
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":4,"ieee754":5}],4:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var ZERO   = '0'.charCodeAt(0)
	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	module.exports.toByteArray = b64ToByteArray
	module.exports.fromByteArray = uint8ToBase64
}())

},{}],5:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.once = noop;
process.off = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],9:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],10:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("D:\\GitHub\\psd-parser\\node_modules\\browserify\\node_modules\\insert-module-globals\\node_modules\\process\\browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":9,"D:\\GitHub\\psd-parser\\node_modules\\browserify\\node_modules\\insert-module-globals\\node_modules\\process\\browser.js":8,"inherits":7}],11:[function(require,module,exports){
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




},{"./Section.js":15,"./TextEngineDataParser.js":16,"./TextEngineDataTokenizer.js":17,"events":6,"util":10}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
},{"./AbstractParser.js":11,"./DataViewCursor.js":12,"util":10}],14:[function(require,module,exports){
(function (Buffer){
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

}).call(this,require("buffer").Buffer)
},{"buffer":3,"events":6,"fs":2,"util":10}],15:[function(require,module,exports){
var Section = function (name, position, attributes, parent) {
    this.name = name;
    this.position = position;
    this.length = null;
    this.attributes = attributes || {};
    this.parent = parent || null;
    this.firstChildOffset = null
};

Section.prototype.getNextSiblingPosition = function () {
    if (this.length === null) {
        return null;
    }
    return this.position + this.length;
};

Section.prototype.getFirstChildPosition = function () {
    if (this.firstChildOffset === null) {
        return null;
    }
    return this.position + this.firstChildOffset;
};

module.exports = Section;
},{}],16:[function(require,module,exports){
var TokenBag = require('./TokenBag.js');

/**
 *
 * @constructor
 */
var TextEngineDataParser = function () {
    this.stack = new TokenBag();
    this.input = new TokenBag();
};


TextEngineDataParser.prototype.reduceObject = function () {
    var stack = this.stack;
    var value = {};

    while (stack.peekToken() !== '<<') {
        stack.popToken();
        if (stack.token !== 'Property') {

            throw new Error('Expected `Property`, given `'+stack.token+'` ');
        }
        value[stack.value.name] = stack.value.value;
    }

    stack.popToken();
    if (stack.token !== '<<') {
        throw new Error('Expected `<<`, given `'+stack.token+'` ');
    }

    this.input.pushToken('Object', value);
};

TextEngineDataParser.prototype.reduceProperty = function () {
    var stack = this.stack;
    var value = {};

    stack.popToken();
    value.value = stack.value;
    stack.popToken();
    value.name = stack.value;

    this.input.pushToken('Property', value);
};

TextEngineDataParser.prototype.reduceArray = function () {
    var stack = this.stack;
    var value = [];

    while (stack.peekToken() !== '[') {
        stack.popToken();
        value.unshift(stack.value);
    }

    stack.popToken();
    if (stack.token !== '[') {
        throw new Error();
    }

    this.input.pushToken('Array', value);
};

TextEngineDataParser.prototype.process = function () {

    var t = this.input.token;
    var v = this.input.value;

    switch (t) {
        case '>>':
            this.reduceObject();
            break;
        case ']':
            this.reduceArray();
            break;
        case 'String':
        case 'Boolean':
        case 'Object':
        case 'Number':
        case 'Array':
            if (this.stack.peekToken() === 'PropertyName') {
                this.stack.pushToken(t, v);
                this.reduceProperty();
            } else {
                this.stack.pushToken(t, v);
            }
            break;
        default:
            this.stack.pushToken(t, v);
    }
};

TextEngineDataParser.prototype.parse = function (tokenizer) {

    var token = tokenizer.nextAny();

    this.input.pushToken(token, tokenizer.value);

    while (this.input.peekToken() !== null) {
        this.input.popToken();

        this.process();

        if (this.input.peekToken() === null) {
            token = tokenizer.next();
            if (token) {
                this.input.pushToken(token, tokenizer.value);
            }
        }
    }

    return this.stack.value_stack.pop();
};

module.exports = TextEngineDataParser;
},{"./TokenBag.js":18}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
/**
 *
 * @constructor
 */
var TokenBag = function () {
    this.token_stack = [];
    this.value_stack = [];

    this.token = null;
    this.value = null;
};

TokenBag.prototype.pushToken = function (token, value) {
    this.token_stack.push(token);
    this.value_stack.push(value);
};

TokenBag.prototype.peekToken = function () {
    var l = this.token_stack.length;
    if (l === 0) {
        return null;
    }
    return this.token_stack[l - 1];
};

TokenBag.prototype.popToken = function () {
    this.value = this.value_stack.pop();
    return this.token = this.token_stack.pop();
};

module.exports = TokenBag;
},{}],19:[function(require,module,exports){
module.exports = {
    "LocalFileParser": require('./LocalFileParser.js'),
    "DataViewParser": require('./DataViewParser.js')
};



},{"./DataViewParser.js":13,"./LocalFileParser.js":14}]},{},[1]);
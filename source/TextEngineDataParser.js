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
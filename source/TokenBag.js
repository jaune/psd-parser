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
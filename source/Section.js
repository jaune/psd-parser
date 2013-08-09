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
"use strict";
exports.__esModule = true;
function toLabel(name) {
    return name.charAt(0).toUpperCase() + name.substr(1);
}
exports.toLabel = toLabel;
function toSchema(value) {
    return typeof value === 'string' ? {} : value;
}
exports.toSchema = toSchema;

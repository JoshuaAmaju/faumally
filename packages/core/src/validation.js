"use strict";
exports.__esModule = true;
var utils_1 = require("./utils");
var is = function (type) {
    return function (value) {
        return Object.prototype.toString.call(value) === type;
    };
};
var throwError = function (error) {
    return function (cond) {
        if (cond)
            throw error;
    };
};
var invoke = function (key, value, validators) {
    return validators.reduce(function (_, validator) {
        console.log(typeof validator, validator);
        var a = typeof validator === 'function' && validator(key, value);
        console.log(a);
        if (typeof a === 'function') {
            return a(key, value);
        }
        return a;
    }, null);
};
var t;
(function (t) {
    t.msg = function (msg) {
        return function () { return msg; };
    };
    t.required = function () {
        var validators = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            validators[_i] = arguments[_i];
        }
        var isNull = is('[object Null]');
        var isUndefined = is('[object Undefined]');
        return function (key, value) {
            var msg = invoke(key, value, validators);
            throwError(msg !== null && msg !== void 0 ? msg : utils_1.toLabel(key) + " is required")(isUndefined(value) || isNull(value));
        };
    };
    t.isOfType = function (type) { return function () {
        var validators = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            validators[_i] = arguments[_i];
        }
        var isString = is("[object " + type + "]");
        return function (key, value) {
            var msg = invoke(key, value, validators);
            throwError(msg !== null && msg !== void 0 ? msg : utils_1.toLabel(key) + " should be of type: " + type.toLowerCase())(!isString(value));
        };
    }; };
    t.string = t.isOfType('String');
    t.number = t.isOfType('Number');
    t.includes = function (ref) { return function () {
        var validators = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            validators[_i] = arguments[_i];
        }
        return function (key, value) {
            console.log('validators', validators);
            var msg = invoke(key, value, validators);
            throwError(msg !== null && msg !== void 0 ? msg : utils_1.toLabel(key) + " should contain " + ref)(!value.includes(ref));
        };
    }; };
    t.schema = function (shape) {
        return function (values) {
            var errors = {};
            Object.keys(values).forEach(function (key) {
                var _key = key;
                var validator = shape[_key];
                var value = values[_key];
                try {
                    var a = validator(key, value);
                    if (typeof a === 'function') {
                        validator()(key, value);
                    }
                }
                catch (error) {
                    errors[key] = error;
                }
            });
            return errors;
        };
    };
})(t = exports.t || (exports.t = {}));
var validate = t.schema({
    email: t.includes('name')
});
console.log(validate({ email: [] }));

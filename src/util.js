"use strict";

var _get = require('lodash/object/get');

var pslice = Array.prototype.slice,
    api = {
        chain,
        noNulls,
        loadJson,
        promisify,
        promise,
        toArray,
        pExec,
        toFields,
        mapTo,
        returnFirst,
        get: _get,
        visitFields
    };
function returnFirst(arg) {
    return arg;
}
/**
 * Maps a an object to keys optionally calling a
 * function with value of the mapped, key of the field.
 * or just mapping to mapper[key]
 */
function mapTo(mapper, include, fn, scope) {
    var map = {};
    if (!mapper) return map;
    if (!include) return map;
    if (!Array.isArray(include)) {
        if (typeof include === 'string') include = toArray(include);
        else if (typeof include === 'object') include = Object.keys(include);
    }
    fn = fn == null ? returnFirst : fn;

    include.forEach(function (key, i) {
        map[key] = fn.call(scope, mapper[key], key, i);
    });
    return map;
}
function toField(field) {
    if (field == null) {
        return null;
    }
    if (typeof field === 'string') {
        return {
            type: field
        }
    }
    if (!field.type) {
        //don't do this.
        field.type = 'Text';
        return field;
    }
    return field;
}
function visitFields(schema, fn, scope) {
    var ss = schema.schema || schema.subSchema;
    var map = {};
    mapTo(ss, toFields(schema), function (field, key, i) {
        if (field) {
            //when the child is just included.
            if (field.subSchema) {
                return visitFields(field, fn, scope);
            } else {
                return fn.call(scope, toField(field), key, i);
            }
        } else {
            //when a parent tells the children to display
            var parts = key.split(/\./, 2)
            var sub = ss[parts[0]];
            if (sub) {
                delete sub.fieldsets;
                sub.fields = [parts[1]];
                visitFields(sub, fn, scope);
            }
        }


    }, scope);
}
function toFields(schema, fields, addKeys) {
    fields = fields || [];
    addKeys = addKeys == null ? true : addKeys;
    if (!schema) {
        return fields;
    }
    var s = schema.subSchema || schema.schema;
    if (s && !(schema.fields || schema.fieldsets)) {
        fields.push.apply(fields, Object.keys(s));
        return fields;
    }
    fields.push.apply(fields, toArray(schema.fields));

    if (schema.fieldsets) {
        toArray(schema.fieldsets).forEach(function (fs) {
            toFields(fs, fields);
        });
    }
    return fields;
}
function toArray(val) {
    if (val == null) return [];
    if (Array.isArray(val)) {
        return val;
    }
    if (typeof val === 'string') {
        return val.split(/\,\s*/);
    }
    return [val];
}


function promisify(fn) {
    return function promisify$wrap() {
        var args = pslice.call(arguments), scope = this;
        return promise(function promise$executor(resolve, reject) {
            fn.apply(scope, args.concat(function (e, o) {
                if (e) {
                    return reject(e);
                }
                return resolve(o);
            }));
        });
    }
}

function promise(fn) {
    return new Promise(fn);
}
function reduceThen(cur, next) {
    return cur.then(next());
}

function chain(first, rest) {

    if (!Array.isArray(first)) {
        return chain([first].concat(rest));
    }
    if (first.length === 0) {
        return Promise.resolve();
    }
    return first.slice(1).reduce(reduceThen, first[0]());
}

function noNulls(val) {
    return !(val == null);
}
function pExec(cmd, options) {
    return promise((resolve, reject)=> {
        /* exec(cmd, options, function (err, stdout, stderr) {
         if (err) {
         return reject(stderr + '');
         }
         return resolve();
         });*/
        resolve();
    });
}
function loadJson(val, done) {
    /* fs.readFile(current('package.json'), {}, function (e, file) {
     if (e) {
     return done(e);
     }
     try {
     return done(null, JSON.parse(file));
     } catch (e) {
     return done(e);
     }
     });*/
    done();
}


module.exports = api;
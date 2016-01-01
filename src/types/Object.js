"use strict";

import shortener from '../short';
import warning from 'subschema-factory/src/warning';

var push = Function.call.bind(Array.prototype.push);


export default class ObjectType {
    constructor(props, ...rest) {

        this.context = props.context;
        var loader = props.loader;
        var field = props.field;
        var path = props.path;

        var subSchema = field.subSchema || field.schema, schema, fields;
        if (subSchema.fields || subSchema.fieldsets) {
            schema = subSchema.schema;
            fields = toArray(subSchema.fields) || toFields(subSchema.fieldsets);
        } else {
            schema = subSchema.schema || subSchema;
            fields = field.fields ? toArray(field.fields) : field.fieldsets ? toFields(field.fieldsets) : Object.keys(schema);
        }

        var shortChildren = this.shortChildren = {};
        var allshorts = fields.reduce(function (ret, v) {
            return ret + (schema[v] && schema[v].short || '');
        }, 'h');

        this.children = fields.reduce(function (obj, key) {
            var paths = toPath(key);
            var fp = paths.shift();
            var f = schema[fp];

            if (!f) {
                warning(f, 'Could not find field %s might be a typo', fp);
                return obj;
            }
            var field = isS(f) ? {
                type: f
            } : f;

            var Type = loader.loadType(field.type || 'Text');
            warning(typeof Type === 'function', 'Could not find type %s', f.type);
            var short = f.short || shortener(allshorts, key);
            var type = obj[key] = new Type({
                loader: loader,
                short: short,
                path: toPath(path, key).join('.'),
                field: field
            });
            warning(!shortChildren[short], 'short "%s" command already used by %s', shortChildren.short, shortChildren.path);
            shortChildren[short] = type;
            return obj;
        }, {}, this)
    }

    help(cmd, shortCmd, error) {
        var conf = this.context;
        this.context.message(`Subschema Setup:\n running ${conf.file}`);
        var schema = conf.schema;
        if (cmd) {
            var cmds = cmd.split('.', 2);
            cmd = cmds.shift();
            var cmdObj = this.children[cmd];
            if (!cmdObj) {
                error = `${error}\n invalid command ${cmd}`
            } else {
                conf.message(`Help for ${cmd}\n${cmdObj.help(cmds.join('.'))}`);
            }
        } else if (shortCmd) {
            var shortCmds = shortCmd.split('', 2);
            var cmdObj = this.shortChildren[shortCmds[0]];
            if (!cmdObj) {
                error = `${error}\n invalid command ${shortCmds[0]}`
            } else {
                this.context.message(`Help for ${cmd}\n${cmdObj.help(null, shortCmds.join(''))}`);
            }

        } else {
            helpLine(conf, 'h', 'help', 'This helpful message');
            helpLine(conf, '', 'cli-config=<file>', 'The cli config schema');
            helpLine(conf, '', 'cli-config-<name>=<file>', 'A named cli config schema');
            helpLine(conf, '', '--no-defaults', "Do not attempt to load defaults file");
            Object.keys(this.children).forEach((key)=> {
                var child = this.children[key];
                helpLine(this.context, child.short, key, child.help());
            });
        }
        if (error) {
            this.context.message(`ERROR: ${error}`);
        }


    }

    validate() {

    }

    value() {

    }
}


function toArray(arr) {
    if (arr == null) return [];
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'string') {
        return arr.split(/,\s*/);
    }
    return [arr];

}

function toFields(fieldsets) {
    var fields = [];
    if (Array.isArray(fieldsets)) {
        push(fields, fieldsets.map(toFields));
    } else if (fieldsets.fields) {
        push(fields, toArray(fieldsets.fields));
    } else if (fieldsets.fieldsets) {
        push(fields, toFields(fieldsets.fieldsets));
    }
    return fields;
}

function isS(s) {
    return typeof s === 'string';
}
function toPath(p) {
    var ret = isS(p) ? p.split('.') : p == null ? [] : p, i = 1, l = arguments.length;
    for (; i < l; i++) {

        push(ret, toPath(arguments[i]));
    }
    return ret || [];
}

function asType(f) {
    if (!f) return {
        type: 'Text'
    };
    if (f.type) {
        return f;
    }
}

function pad(val, size) {
    val = val || '';
    while (val.length < size) {
        val += ' ';
    }
    if (val.length > size) {
        val = val.substring(0, size - 3) + '...'
    }
    return val;
}

function helpLine(conf, short, long, describe) {
    short = short ? `-${short}` : short;
    conf.message(` ${pad(short, 19)}${pad('--' + long, 30)}${pad(describe, 200)}`)
}



"use strict";

var util = require('./util'),
    path = require('path'),
    _set = require('lodash/object/set'),
    sf = require('subschema-factory'),
    loaderFactory = sf.loaderFactory,
    warning = sf.warning,
    mapTo = util.mapTo,
    toArray = util.toArray,
    toFields = util.toFields;

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


function printHelp(conf, cmd, error) {
    conf.message(`Subschema Setup:\n running ${conf.file}`);
    var schema = conf.schema;
    if (cmd && schema && schema[cmd]) {
        var cmdObj = schema[cmd];

        conf.message(`Help for ${cmd}\n${cmdObj.help || ''}`);

        if (schema) {
            var ss = schema.schema;
            toFields(schema).forEach(function (c) {
                var field = ss[c];
                if (typeof field === 'string') {
                    field = {
                        type: field,
                        help: field
                    }
                }
                var help = field.help || field.type;
                if (field.options) {
                    help += ' one of [' + (field.options.map(function (ret, key) {
                            ret += key.val || key;
                            return ret;

                        }).join(',')) + ']'
                }
                helpLine(conf, [cmdObj.short, c].join('.'), [cmd, c].join('.'), help);
            });
        }


    } else {
        if (schema) {
            var fields = toFields(schema), schema = schema.schema || schema;
            fields.forEach(function (key) {
                var type = schema[key];
                helpLine(conf, type.short, key, type.help);
            });
        }
        helpLine(conf, 'h', 'help', 'This helpful message');
        helpLine(conf, '', 'cli-config=<file>', 'The cli config schema');
        helpLine(conf, '', 'cli-config-<name>=<file>', 'A named cli config schema');
        helpLine(conf, '', '--no-defaults', "Do not attempt to load defaults file");
    }
    if (error) {
        conf.message(`ERROR: ${error}`);
    }

}


function validate(conf, schema, values) {
    values = values || {};
    var errors;
    util.visitFields(schema.schema, function (field, f) {
        if (!field) return;
        var verrs = toArray(field.validators).map(function (validator) {
            var type;
            if (typeof validator === 'string') {
                //lookup val.type and init;
            } else if (typeof validator.type == 'string') {
                //lookup val.type and init;
            } else if (validator.type === 'function') {
                type = validator.type;
            }
            if (type) {
                return type(value, values);
            }
        }).filter(util.noNulls);

        if (verrs.length) {
            if (!errors) errors = {};
            errors[f] = verrs;
        }
    });

    return errors;

}


function processArgs(conf, args) {
    if (conf && !args) {
        args = conf;
        conf = {};
    }
    if (!conf.loader) {
        conf.loader = loaderFactory([]);
    }
    var help = false, helpCmd, helpError;
    if (!args || args.length === 0)  help = true;
    var unhandledArgs = [];
    for (var i = 0, l = args.length; i < l; i++) {
        var helpParts = /--?h(elp)?(?:-(.*))?$/.exec(args[i]);
        if (helpParts) {
            help = true;
            helpCmd = helpParts[2];
            continue;
        }
        var parts = /--cli-config(?:([^=]*))?=?(.*)?$/.exec(args[i]);
        if (parts) {
            if (!parts[3]) {
                helpCmd = '--cli-config(-name)=<file>';
                helpError = 'a file is required';

            } else {

                conf.loader.addSchema(parts[2] && parts[2].replace(/-/, '') || 'default', conf.readJS(parts[3]))
            }
            continue;
        }
        var defaultsArgs = /--(no-)?defaults/.exec(args[i]);
        if (defaultsArgs) {
            conf.defaults = defaultsArgs[1] ? false : true;
            continue;
        }
        var valueParts = /--cli-values=?(.*)?$/.exec(args[i]);
        if (valueParts) {
            if (!valueParts[1]) {
                helpCmd = '--cli-value=<file>';
                helpError = 'a file is required';
            } else {
                conf.values = conf.readJS(valueParts[1]);
            }
            continue;
        }
        unhandledArgs.push(args[i]);
    }
    if (help || helpCmd || helpError) {
        printHelp(conf, helpCmd, helpError);
        return 1;
    }
    var schema = conf.schema || conf.loader.loadSchema('default');
    if (schema == null) {
        printHelp(conf, '--cli-config', 'A default schema must be defined');
        return 1;
    }
    var fields = toFields(schema), schema = schema.schema || schema;
    var keyValues = conf.defaults == true ? conf.loadDefaults() : conf.values || {};
    for (var i = 0, l = unhandledArgs.length; i < l; i++) {
        var parts = unhandledArgs[i].split('=', 2);
        if (/^--/.test(parts[0])) {
            _set(keyValues, parts[0].substring(2), parts.length === 2 ? parts[1] : true);
        } else {
            //handle shorts.
            var p = findShortPath(unhandledArgs[i].substring(1), fields, schema);
            if (!p) {
                printHelp(conf, unhandledArgs[i].substring(1), 'Unknown Command');
                return 1;
            }
            _set(keyValues, p, parts.length === 2 ? parts[1] : true);
        }
    }

    return 0;

}
/**
 * Shorts can be nested
 *  -oP is equivalient to
 *  {
 *    open:{
 *      short:'o',
 *      subSchema:{
 *        schema:{
 *          port:{
 *            type:'p'
 *          }
 *        }
 *      }
 *    }
 *  }
 * @param short
 * @param fields
 * @param schema
 * @returns {*}
 */
function findShortPath(short, fields, schema, path) {
    schema = schema;
    path = path || '';
    fields = fields || schema.fields;
    var shorts = short.split('', 2);
    var field;
    var p = shorts.shift();
    for (var i = 0, l = fields.length; i < l; i++) {
        var fp = replace(fields[i], path).split(/\./, 2);
        var fk = fp.shift();
        var field = schema[fk];
        if (field && field.short == p) {
            if (shorts.length) {
                if (field.subSchema) {
                    var nschema = field.subSchema.schema || field.subSchema;
                    return findShortPath(shorts.shift(), fp.length === 0 ? Object.keys(nschema) : [fp.shift()], nschema, spath(path, fk));
                } else if (field.type === 'Mixed' || 'List') {
                    warning(false, 'Attempting to set a nested value on a Mixed or List using short notating is broken')
                }
            }
            return spath(path, fk);
        }
    }
    return null;
}
function spath(sub, post) {
    if (!sub) {
        return post;
    }
    if (!post) {
        return sub;
    }
    return sub + '.' + post;
}
function replace(orig, norig) {
    if (!norig) return orig;
    if (orig.substring(0, norig.length) === norig) {
        return orig.substring(norig.length);
    }
    return orig;
}

function toPrimitive(val) {
    if (val == null || val === 'null') {
        return null;
    }
    if (/^-?\d+\.?\d*$/.test(val)) {
        return parseFloat(val, 10);
    }
    if (val === 'true' || val === 'false') {
        return val == 'true';
    }
    if (/,/.test(val)) {
        return toArray(val);
    }
    return val;
}

if (require.main === module) {
    processArgs({
        file: argv[1],
        message: console.log,
        loadJS: function (file) {
            return require(path.join(process.cwd(), file));
        },
        loadDefaults: function () {
            //figure this out, load defaults.
            return {};
        }
    }, process.argv.slice(2));
    console.log(JSON.stringify(conf.config, null, 2));
} else {
    module.exports = {
        processArgs,
        printHelp,
        loadJS: function (file) {
            return require(path.join(process.cwd(), file));
        }

    }
}

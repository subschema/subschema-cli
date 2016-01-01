"use strict";

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

    } else {
        helpLine(conf, 'h', 'help', 'This helpful message');
        helpLine(conf, '', 'cli-config=<file>', 'The cli config schema');
        helpLine(conf, '', 'cli-config-<name>=<file>', 'A named cli config schema');
        helpLine(conf, '', '--no-defaults', "Do not attempt to load defaults file");
    }
    if (error) {
        conf.message(`ERROR: ${error}`);
    }

}
module.export = {
    printHelp,
    helpLine
};
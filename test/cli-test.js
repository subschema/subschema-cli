"use strict";
var expect = require('expect');
var cli = require('../src/cli');

describe('cli', function () {
    var testSchema = {
        schema: {
            hello: {
                type: 'Text',
                help: 'Hello Text',
                short: 'o'
            }
        }
    };

    it('should handle --help', function () {
        var messages = [];
        expect(cli.processArgs({
            schema: testSchema,
            message: function (message) {
                messages.push(message);
            }
        }, ['--help'])).toBe(1);
        console.log(messages);
    })
});
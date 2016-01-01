"use strict";
var expect = require('expect');
var cli = require('../src/cli');
var loaderFactory = require('subschema-factory').loaderFactory,
    loader = loaderFactory([]);

describe('cli', function () {
    var testSchema = {
        schema: {
            hello: {
                type: 'Text',
                help: 'Hello Text',
                short: 'o'
            },
            good: {
                short: 'g',
                subSchema: {
                    schema: {
                        day: {
                            type: 'day',
                            short: 'o'
                        }
                    }
                }

            }
        }
    };

    it('should handle --help', function () {
        var messages = [];
        expect(cli.processArgs({
            schema: testSchema,
            file: 'test',
            message: function (message) {
                messages.push(message);
            }
        }, ['--help'])).toBe(1);
        console.log(messages);
    });

    it('should handle -o', function () {
        var messages = [];
        expect(cli.processArgs({
            schema: testSchema,
            file: 'test',
            loader: loader,
            message: function (message) {
                messages.push(message);
            }
        }, ['-o'])).toBe(0);
        console.log(messages);
    });

    it('should handle -go', function () {
        var messages = [];
        var values = {};
        expect(cli.processArgs({
            schema: testSchema,
            file: 'test',
            loader: loader,
            values: values,
            message: function (message) {
                messages.push(message);
            }
        }, ['-go'])).toBe(0);
        console.log(messages);
        expect(values.good.day).toBe(true, 'Nested value');
    })
});
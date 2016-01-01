"use strict";
import expect from 'expect';
import ObjectType from '../src/types/Object';
import types from '../src/types'

var loaderFactory = require('subschema-factory').loaderFactory;

var loader = loaderFactory([]);
loader.addType(types);


describe.only('Object', function () {

    it('should handle help', function () {
        var msgs = [];
        var obj = new ObjectType({
            loader,
            field: {
                subSchema: {
                    name: {
                        help: 'Name Help'
                    }
                }
            },
            context: {
                file: 'test',
                message(...args){
                    msgs.push(args)
                }
            }
        });
        obj.help();
        console.log(msgs.join('\n'))
    });
});
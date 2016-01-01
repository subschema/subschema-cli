"use strict";
var expect = require('expect');
var short = require('../src/short');

describe('short guess', function () {


    it('should guess a', function () {
        expect(short([], 'a')).toBe('a');
    });
    it('should guess A', function () {
        expect(short(['a'], 'a')).toBe('a');
    });
    it('should guess b', function () {
        expect(short(['a', 'A'], 'a')).toBe('b');
    });
    it('should guess B', function () {
        expect(short('aAb', 'a')).toBe('b');
    });
    it('should stop guess B', function () {
        var str = short.alpha + (short.alpha.toUpperCase());
        expect(short(str, 'a')).toNotExist();
    });


})
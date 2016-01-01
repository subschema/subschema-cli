"use strict";
//used can be array or string.
//field is the first guesses.
// idx is where to start.
// .alpha can change the a
function shortener(used, field, idx) {

    idx = idx || 0;
    if (idx >= field.length) {
        if (field === shortener.alpha) {
            return null;
        }
        return shortener(used, shortener.alpha, 0);
    }


    if (used.indexOf(field[idx]) === -1) {
        return field[idx]
    }

    if (used.indexOf(field[idx].toUpperCase()) === -1) {
        return field[idx]
    }

    return shortener(used, field, idx + 1);
}
shortener.alpha = 'abcdefghijklmnopqrstuvwxyz';

module.exports = shortener;
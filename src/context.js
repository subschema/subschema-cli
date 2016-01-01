var loader = require('loaderFactory').loaderFactory([]), api = {
    loader: loader,
    message: console.log
};

loader.addType(require('./types'));

module.exports = api;


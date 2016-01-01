var webpack = require('webpack'), path = require('path'), join = path.join.bind(path, __dirname);

module.exports = {

    devtool: '#eval',
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                //do this to prevent babel from translating everything.
                include: [
                    join('src'),
                    join('public')
                ],
                loaders: ['babel-loader?presets=stage-0&ignore=buffer']
            },
            {
                test: /-test\.jsx?$/,
                loader: 'mocha'
            }
        ]
    }
}
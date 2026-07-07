const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    devServer: {
        static: {
            directory: path.join(__dirname, "public"),
        },
        compress: true,
        port: 9000,
    },
    entry: './src/index.tsx',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.(js|jsx|tsx|ts)$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.*', '.js', '.jsx', '.tsx', '.ts', '.component.tsx'],
        alias: {
            '@pim_platform/components': path.resolve(__dirname, 'src/components'),
            
            fs: false,
            path: false
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'dist' }
            ]
        })
    ],
};
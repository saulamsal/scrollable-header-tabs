const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    config.resolve.alias = {
        ...config.resolve.alias,
        'react-native$': 'react-native-web',
        'react-native-gesture-handler': 'react-native-web/dist/modules/GestureResponder',
    };

    return config;
};
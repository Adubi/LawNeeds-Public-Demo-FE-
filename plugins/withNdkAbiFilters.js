const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withNdkAbiFilters(config) {
    return withAppBuildGradle(config, (config) => {
        const buildGradle = config.modResults.contents;

        // Avoid duplicate injection
        if (buildGradle.includes('abiFilters')) {
            return config;
        }

        // Inject ndk block into defaultConfig
        config.modResults.contents = buildGradle.replace(
            /versionName\s+"[^"]*"/,
            (match) => `${match}
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }`
        );

        return config;
    });
};
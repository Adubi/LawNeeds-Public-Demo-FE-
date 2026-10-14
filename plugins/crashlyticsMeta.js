const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCrashlyticsMeta(config) {
    return withAndroidManifest(config, async config => {

        const app = config.modResults.manifest.application[0];

        if (!app['meta-data']) {
            app['meta-data'] = [];
        }

        app['meta-data'].push({
            $: {
                'android:name': 'firebase_crashlytics_collection_enabled',
                'android:value': 'false',
            },
        });

        return config;
    });
};
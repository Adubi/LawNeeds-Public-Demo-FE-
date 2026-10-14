const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function addFileProvider(androidManifest) {
    const application = androidManifest.manifest.application[0];
    application.provider = application.provider || [];

    // ✅ Avoid duplicate provider
    const alreadyExists = application.provider.some(
        (p) => p.$?.["android:name"] === "androidx.core.content.FileProvider"
    );

    if (!alreadyExists) {
        application.provider.push({
            $: {
                "android:name": "androidx.core.content.FileProvider",
                "android:authorities": "${applicationId}.provider",
                "android:exported": "false",
                "android:grantUriPermissions": "true",
            },
            "meta-data": [
                {
                    $: {
                        "android:name": "android.support.FILE_PROVIDER_PATHS",
                        "android:resource": "@xml/file_paths",
                    },
                },
            ],
        });
    }

    return androidManifest;
}

function addFirebaseMessagingService(androidManifest) {
    const application = androidManifest.manifest.application[0];
    application.service = application.service || [];

    // ✅ Avoid duplicate service
    const alreadyExists = application.service.some(
        (s) => s.$?.["android:name"] ===
            "io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService"
    );

    if (!alreadyExists) {
        application.service.push({
            $: {
                "android:name": "io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService",
                "android:exported": "false",
            },
            "intent-filter": [
                {
                    action: [
                        {
                            $: {
                                "android:name": "com.google.firebase.MESSAGING_EVENT",
                            },
                        },
                    ],
                },
            ],
        });
    }

    return androidManifest;
}

module.exports = function withFileProvider(config) {
    config = withAndroidManifest(config, (config) => {
        config.modResults = addFileProvider(config.modResults);
        config.modResults = addFirebaseMessagingService(config.modResults); // ✅ added
        return config;
    });

    config = withDangerousMod(config, [
        "android",
        async (config) => {
            const xmlDir = path.join(
                config.modRequest.projectRoot,
                "android/app/src/main/res/xml"
            );
            if (!fs.existsSync(xmlDir)) {
                fs.mkdirSync(xmlDir, { recursive: true });
            }
            const filePath = path.join(xmlDir, "file_paths.xml");
            fs.writeFileSync(
                filePath,
                `<?xml version="1.0" encoding="utf-8"?>
<paths>
    <files-path name="files" path="." />
    <cache-path name="cache" path="." />
</paths>`
            );
            return config;
        },
    ]);

    return config;
};
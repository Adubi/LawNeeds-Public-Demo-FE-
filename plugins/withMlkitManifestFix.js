const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withMlkitManifestFix(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const manifest = androidConfig.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) return androidConfig;

    // Ensure the 'tools' namespace is declared on the root <manifest> tag
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    application["meta-data"] = application["meta-data"] || [];
    const metaData = application["meta-data"];

    // Conflict: expo-dev-launcher wants "barcode_ui", react-native-persona
    // (com.withpersona.sdk2:camera) wants "ocr,face,barcode". Persona needs
    // all three modules for its identity-verification camera flow, so we
    // keep Persona's superset value and force override via tools:replace.
    const mlkitName = "com.google.mlkit.vision.DEPENDENCIES";
    const mlkitIndex = metaData.findIndex(
      (e) => e.$?.["android:name"] === mlkitName,
    );

    const mlkitEntry = {
      $: {
        "android:name": mlkitName,
        "android:value": "ocr,face,barcode",
        "tools:replace": "android:value",
      },
    };

    if (mlkitIndex > -1) {
      metaData[mlkitIndex] = mlkitEntry;
    } else {
      metaData.push(mlkitEntry);
    }

    // Conflict: app wants ad measurement delayed (true), react-native-google-mobile-ads'
    // raw library manifest defaults to false. Keep true to match app.json's
    // GADDelayAppMeasurementInit intent.
    const delayAdsName =
      "com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT";
    const delayAdsIndex = metaData.findIndex(
      (e) => e.$?.["android:name"] === delayAdsName,
    );

    const delayAdsEntry = {
      $: {
        "android:name": delayAdsName,
        "android:value": "true",
        "tools:replace": "android:value",
      },
    };

    if (delayAdsIndex > -1) {
      metaData[delayAdsIndex] = delayAdsEntry;
    } else {
      metaData.push(delayAdsEntry);
    }

    return androidConfig;
  });
};

const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withFirebaseMessaging(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const manifest = androidConfig.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) return androidConfig;

    // 1. Add the 'tools' namespace to the root <manifest> tag
    // This is required to use 'tools:replace'
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    application["meta-data"] = application["meta-data"] || [];
    const metaData = application["meta-data"];

    // 2. Handle the Channel ID Conflict
    const channelName =
      "com.google.firebase.messaging.default_notification_channel_id";
    const channelIndex = metaData.findIndex(
      (e) => e.$?.["android:name"] === channelName,
    );

    const channelEntry = {
      $: {
        "android:name": channelName,
        "android:value": "default",
        "tools:replace": "android:value", // THE FIX: Overrides the library's value
      },
    };

    if (channelIndex > -1) {
      metaData[channelIndex] = channelEntry;
    } else {
      metaData.push(channelEntry);
    }

    // 3. Handle the Notification Icon
    const iconName = "com.google.firebase.messaging.default_notification_icon";
    const iconIndex = metaData.findIndex(
      (e) => e.$?.["android:name"] === iconName,
    );

    const iconEntry = {
      $: {
        "android:name": iconName,
        "android:resource": "@mipmap/ic_launcher",
        "tools:replace": "android:resource", // Also helpful here to avoid similar clashes
      },
    };

    if (iconIndex > -1) {
      metaData[iconIndex] = iconEntry;
    } else {
      metaData.push(iconEntry);
    }

    return androidConfig;
  });
};

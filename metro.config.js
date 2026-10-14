// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports to fix Firebase compatibility with React Native 0.79
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

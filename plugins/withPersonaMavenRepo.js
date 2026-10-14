const { withProjectBuildGradle } = require("@expo/config-plugins");

module.exports = function withPersonaMavenRepo(config) {
  return withProjectBuildGradle(config, (buildGradleConfig) => {
    const repoLine =
      "maven { url 'https://sdk.withpersona.com/android/releases' }";

    if (buildGradleConfig.modResults.contents.includes(repoLine)) {
      // Already added, avoid duplicating on repeated prebuilds
      return buildGradleConfig;
    }

    // Insert the Persona maven repo into the top-level allprojects.repositories block.
    // This mirrors Persona's official setup instructions:
    // https://docs.withpersona.com/react-native-sdk-v2-integration-guide
    buildGradleConfig.modResults.contents =
      buildGradleConfig.modResults.contents.replace(
        /allprojects\s*{\s*repositories\s*{/,
        (match) => `${match}\n        ${repoLine}`,
      );

    return buildGradleConfig;
  });
};

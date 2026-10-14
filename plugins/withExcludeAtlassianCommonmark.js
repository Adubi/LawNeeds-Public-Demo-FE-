const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withExcludeAtlassianCommonmark(config) {
  return withAppBuildGradle(config, (config) => {
    const exclusion = `
configurations.all {
    exclude group: 'com.atlassian.commonmark', module: 'commonmark'
}
`;
    if (!config.modResults.contents.includes("com.atlassian.commonmark")) {
      config.modResults.contents += exclusion;
    }
    return config;
  });
};

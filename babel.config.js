module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Unistyles v3 relies on this Babel plugin to make StyleSheet.create((theme) => ...)
    // styles react to runtime theme changes. Without it, themes only apply on reload.
    // `root` must point at the folder holding the styled components.
    plugins: [['react-native-unistyles/plugin', { root: 'src' }]],
  };
};

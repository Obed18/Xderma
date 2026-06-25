const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];

config.resolver.mainFields = [
  'react-native',
  'browser',
  'module',
  'main',
];

module.exports = config;

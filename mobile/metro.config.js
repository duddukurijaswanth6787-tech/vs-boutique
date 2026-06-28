const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Add both the junction path and the real path to watchFolders 
// to prevent Metro from throwing "file is not watched" errors on Windows.
config.watchFolders = [
  path.resolve(__dirname),
  fs.realpathSync(__dirname)
];

// Block native directories from being watched/resolved by Metro to prevent watcher errors and improve performance
config.resolver.blockList = [
  /[/\\]android[/\\]/,
  /[/\\]ios[/\\]/,
  ...config.resolver.blockList
];

module.exports = config;

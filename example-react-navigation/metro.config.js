// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const root = path.resolve(__dirname, "..");

// The library's own node_modules hold dev copies of its peers (react, react-native, Skia v3...).
// Block them so the library resolves every peer from the example app, like an installed package would.
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(`^${path.join(root, "node_modules").replace(/[/\\]/g, "[/\\\\]")}[/\\\\].*`),
];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
config.resolver.extraNodeModules = { "react-native-liquid-tabs": root };
config.watchFolders = [root];

module.exports = config;

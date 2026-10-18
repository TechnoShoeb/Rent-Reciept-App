const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'mjs' to the list of supported extensions to fix the lucide-react-native error
config.resolver.sourceExts.push('mjs');

module.exports = config;

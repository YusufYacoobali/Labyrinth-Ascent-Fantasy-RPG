const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const {
  resolveRuntimeImage,
  verifyRuntimeImages,
} = require("./scripts/runtime-image-assets.cjs");

const root = path.dirname(require.resolve("./package.json"));
const config = getDefaultConfig(root);
verifyRuntimeImages();

// Keep canonical PNG paths in the game and art tools. Metro ships only the
// verified, pixel-identical WebP variants, including when masters are absent.
config.resolver.resolveRequest = (context, moduleName, platform) =>
  context.resolveRequest(
    context,
    resolveRuntimeImage(moduleName, context.originModulePath),
    platform,
  );

module.exports = config;

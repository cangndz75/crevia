// Async Storage: bazı kurulumlarda Metro `react-native` alanıyla `src/*.ts`
// seçip ./RCTAsyncStorage çözümleyemiyor; `lib/module` girişi sorunu giderir.
const fs = require("fs");
const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

/** `tsconfig` `@/*` → `src/*` eşlemesi `@/assets/...` yollarını gölgeler; Metro için sabit kök. */
const ASSETS_ALIAS_PREFIX = "@/assets/";

const ASYNC_STORAGE_ENTRY = path.resolve(
  __dirname,
  "node_modules/@react-native-async-storage/async-storage/lib/module/index.js",
);

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const originalResolveRequest = config.resolver.resolveRequest;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "@react-native-async-storage/async-storage") {
      return {
        type: "sourceFile",
        filePath: ASYNC_STORAGE_ENTRY,
      };
    }

    if (moduleName.startsWith(ASSETS_ALIAS_PREFIX)) {
      const assetPath = path.resolve(
        __dirname,
        "assets",
        moduleName.slice(ASSETS_ALIAS_PREFIX.length),
      );
      if (fs.existsSync(assetPath)) {
        return { type: "sourceFile", filePath: assetPath };
      }
    }

    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  };

  return config;
})();

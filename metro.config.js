// Async Storage: bazı kurulumlarda Metro `react-native` alanıyla `src/*.ts`
// seçip ./RCTAsyncStorage çözümleyemiyor; `lib/module` girişi sorunu giderir.
const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

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

    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  };

  return config;
})();

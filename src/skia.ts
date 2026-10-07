type SkiaModule = typeof import("react-native-skia");

// Works with either Skia package: `react-native-skia` (v3) or `@shopify/react-native-skia` (v2).
// Metro treats requires inside try blocks as optional, so only the installed one is bundled.
function loadSkia(): SkiaModule {
  try {
    return require("react-native-skia");
  } catch {}
  try {
    return require("@shopify/react-native-skia");
  } catch {}
  throw new Error("react-native-liquid-tabs needs `react-native-skia` or `@shopify/react-native-skia`.");
}

export const SkiaLib = loadSkia();
export type { SkImage } from "react-native-skia";

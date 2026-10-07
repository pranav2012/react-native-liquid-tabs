import { requireNativeView, requireOptionalNativeModule } from "expo";
import type { ComponentType, Ref } from "react";
import { Platform, type View, type ViewProps } from "react-native";

interface LiquidTabsModule {
  setHighFrameRate(high: boolean): void;
}

export interface NativeBlurViewProps extends ViewProps {
  targetId?: number | null;
  /** Blur radius in device pixels. */
  blurRadius: number;
  /** ARGB colour int drawn over the blur. */
  overlayColor: number;
}

const isAndroid = Platform.OS === "android";

// Android only; iOS uses the system tab bar and needs no native code from this package.
const nativeModule = isAndroid ? requireOptionalNativeModule<LiquidTabsModule>("LiquidTabs") : null;

export const NativeBlurTargetView: ComponentType<ViewProps & { ref?: Ref<View> }> | null =
  isAndroid && nativeModule ? requireNativeView("LiquidTabs", "LiquidBlurTargetView") : null;

export const NativeBlurView: ComponentType<NativeBlurViewProps> | null =
  isAndroid && nativeModule ? requireNativeView("LiquidTabs", "LiquidBlurView") : null;

/** Asks an adaptive-refresh screen for its top rate (e.g. 120 Hz) while a fast animation runs. Android only. */
export function setHighFrameRate(high: boolean) {
  try {
    nativeModule?.setHighFrameRate(high);
  } catch {
    // Keep the system's choice.
  }
}

import { useEffect, useState } from "react";
import { Keyboard, Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TAB_BAR_HEIGHT = 64;
/** Gap between the floating bar and the bottom safe area. */
export const TAB_BAR_GAP = 10;
/** Gap between the floating bar and the screen's sides. */
export const TAB_BAR_SIDE_MARGIN = 16;
// The bar is designed for a 402 dp-wide screen (iPhone 16 Pro) and scales down on narrower ones,
// including Android's larger display-zoom settings, so it keeps iOS proportions.
const REFERENCE_WIDTH = 402;

export function tabBarScale(windowWidth: number) {
  return Math.max(0.8, Math.min(1, windowWidth / REFERENCE_WIDTH));
}

/** Height of the floating glass tab bar on this screen. */
export function useTabBarHeight() {
  const { width } = useWindowDimensions();
  return Math.round(TAB_BAR_HEIGHT * tabBarScale(width));
}

/** True when the layouts use the system tab bar (iOS), which is already part of the bottom safe area. */
export const NATIVE_TAB_BAR = Platform.OS === "ios";

/** True while the software keyboard is open; the floating tab bar hides then. */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/** Space a tab screen should leave at the bottom so its content clears the tab bar. */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const barHeight = useTabBarHeight();
  if (keyboardVisible) return 0;
  return NATIVE_TAB_BAR ? insets.bottom + 8 : insets.bottom + TAB_BAR_GAP + barHeight + 8;
}

/** Bottom offset for chrome that floats just above the tab bar (a composer, a floating button). */
export function useFloatingBarBottom() {
  const insets = useSafeAreaInsets();
  const barHeight = useTabBarHeight();
  return NATIVE_TAB_BAR ? insets.bottom + 10 : insets.bottom + TAB_BAR_GAP + barHeight + 10;
}

import { useEffect, type RefObject } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassTabBar, type GlassTabBarProps } from "./GlassTabBar";
import { TAB_BAR_GAP, TAB_BAR_HEIGHT, TAB_BAR_SIDE_MARGIN, useKeyboardVisible } from "./layout";

export type FloatingTabBarProps = GlassTabBarProps & {
  blurTarget: RefObject<View | null>;
  /** Slide the bar away while the keyboard is open. Default true. */
  hideOnKeyboard?: boolean;
};

/** The glass bar floating over the bottom of the screen, above the safe area. */
export function FloatingTabBar({ hideOnKeyboard = true, ...props }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible() && hideOnKeyboard;
  const hide = useSharedValue(0);
  useEffect(() => {
    hide.set(withTiming(keyboardVisible ? 1 : 0, { duration: 180 }));
  }, [hide, keyboardVisible]);
  const hideStyle = useAnimatedStyle(() => ({
    opacity: 1 - hide.get(),
    transform: [{ translateY: hide.get() * (TAB_BAR_HEIGHT + 40) }],
  }));
  return (
    <Animated.View
      pointerEvents={keyboardVisible ? "none" : "box-none"}
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_GAP }, hideStyle]}
    >
      <GlassTabBar {...props} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: TAB_BAR_SIDE_MARGIN, right: TAB_BAR_SIDE_MARGIN },
});

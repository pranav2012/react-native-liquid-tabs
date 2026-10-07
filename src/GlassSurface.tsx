import { useEffect, useState, type RefObject } from "react";
import { findNodeHandle, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedReaction, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { NativeBlurView } from "./native";

function argb(alpha: number, r: number, g: number, b: number) {
  return (Math.round(alpha * 255) << 24) | (r << 16) | (g << 8) | b | 0;
}

/**
 * Clear frosted glass behind the bar: a cropped GPU blur of `blurTarget` on Android 12+, a tinted
 * fill elsewhere. `clearing` (0..1) fades to a lighter, sharper glass, as iOS 26 glass does while held.
 */
export function GlassSurface({
  dark,
  radius,
  blurTarget,
  clearing,
}: {
  dark: boolean;
  radius: number;
  blurTarget?: RefObject<View | null>;
  clearing?: SharedValue<number>;
}) {
  const shape = [StyleSheet.absoluteFill, { borderRadius: radius, overflow: "hidden" as const }];
  const targetId = useTargetId(blurTarget);
  if (!NativeBlurView) {
    return <View style={[shape, { backgroundColor: dark ? "rgba(30,32,38,0.86)" : "rgba(248,248,250,0.9)" }]} pointerEvents="none" />;
  }
  return (
    <>
      <Frost
        style={shape}
        targetId={targetId}
        intensity={dark ? 28 : 34}
        dark={dark}
        wash={dark ? "rgba(10,12,18,0.14)" : "rgba(255,255,255,0.2)"}
      />
      {clearing ? <ClearGlass progress={clearing} dark={dark} shape={shape} targetId={targetId} /> : null}
    </>
  );
}

function useTargetId(blurTarget?: RefObject<View | null>) {
  const [id, setId] = useState<number | null>(null);
  // Refs attach after render, so the target is looked up after every commit.
  useEffect(() => {
    const node = blurTarget?.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the native handle exists only after commit; same value bails out
    setId(node ? findNodeHandle(node) : null);
  });
  return id;
}

// Matches expo-blur's light/dark tints at the same intensity, so the glass reads the same.
function Frost({
  style,
  targetId,
  intensity,
  dark,
  wash,
}: {
  style: StyleProp<ViewStyle>;
  targetId: number | null;
  intensity: number;
  dark: boolean;
  wash: string;
}) {
  const Blur = NativeBlurView!;
  const amount = intensity / 100;
  const overlay = dark ? argb(amount * 0.69, 25, 25, 25) : argb(amount * 0.78, 249, 249, 249);
  return (
    <View style={style} pointerEvents="none">
      <Blur style={StyleSheet.absoluteFill} targetId={targetId} blurRadius={intensity * 1.6} overlayColor={overlay} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: wash }]} />
    </View>
  );
}

// Lighter blur faded in over the glass; mounted only while `progress` > 0, so idle costs one blur pass.
function ClearGlass({
  progress,
  dark,
  shape,
  targetId,
}: {
  progress: SharedValue<number>;
  dark: boolean;
  shape: StyleProp<ViewStyle>;
  targetId: number | null;
}) {
  const [mounted, setMounted] = useState(false);
  useAnimatedReaction(
    () => progress.get() > 0.001,
    (on, was) => {
      if (on !== was) scheduleOnRN(setMounted, on);
    },
  );
  const fade = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.get()) }));
  if (!mounted) return null;
  return (
    <Animated.View style={[shape, fade]} pointerEvents="none">
      <Frost
        style={StyleSheet.absoluteFill}
        targetId={targetId}
        intensity={dark ? 8 : 10}
        dark={dark}
        wash={dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.22)"}
      />
    </Animated.View>
  );
}

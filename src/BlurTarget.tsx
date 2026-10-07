import type { Ref } from "react";
import { View, type ViewProps } from "react-native";

import { NativeBlurTargetView } from "./native";

export type BlurTargetProps = ViewProps & { ref?: Ref<View> };

/**
 * Wraps the content the Android glass tab bar blurs. Pass its ref to `GlassTabBar`'s `blurTarget`,
 * and render the bar outside it (a blur can't sample a target that contains itself).
 * A plain `View` on other platforms.
 */
export function BlurTarget(props: BlurTargetProps) {
  return NativeBlurTargetView ? <NativeBlurTargetView {...props} /> : <View {...props} />;
}

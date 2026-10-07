import type { BottomTabNavigatorProps } from "@react-navigation/bottom-tabs";
import { CommonActions, type EventArg } from "@react-navigation/native";
import { useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { BlurTarget } from "./BlurTarget";
import { FloatingTabBar } from "./FloatingTabBar";
import type { GlassTabBarProps } from "./GlassTabBar";
import type { TabIcon } from "./icons";

export interface LiquidTabBarOptions extends Pick<
  GlassTabBarProps,
  "dark" | "activeColor" | "inactiveColor" | "backgroundColor" | "labelFont"
> {
  icons: Record<string, TabIcon>;
  hideOnKeyboard?: boolean;
}

type NavigatorLayout = NonNullable<BottomTabNavigatorProps["layout"]>;
type LayoutProps = Parameters<NavigatorLayout>[0];

/**
 * Props for a React Navigation bottom-tab navigator that swap its tab bar for the Android glass bar:
 * `<Tab.Navigator {...liquidTabBar({ icons })}>`. Returns nothing on other platforms, so iOS keeps
 * its own tab bar (pair it with a native tabs navigator for Liquid Glass there).
 */
export function liquidTabBar(options: LiquidTabBarOptions): Pick<BottomTabNavigatorProps, "tabBar" | "layout"> {
  if (Platform.OS !== "android") return {};
  return {
    tabBar: hiddenTabBar,
    layout: (props) => <LiquidLayout {...props} options={options} />,
  };
}

const hiddenTabBar = () => null;

// The bar lives in the navigator's layout, outside the blur target that wraps the screens.
function LiquidLayout({ state, navigation, descriptors, children, options }: LayoutProps & { options: LiquidTabBarOptions }) {
  const blurTarget = useRef<View>(null);
  const { icons, ...barProps } = options;
  const items = state.routes.map((route) => {
    const screen = descriptors[route.key]?.options as { title?: string; tabBarLabel?: unknown } | undefined;
    const label = typeof screen?.tabBarLabel === "string" ? screen.tabBarLabel : (screen?.title ?? route.name);
    return { key: route.key, label, icon: icons[route.name] ?? FALLBACK_ICON };
  });
  const onChange = (index: number) => {
    const route = state.routes[index];
    const emit = navigation.emit as (event: { type: "tabPress"; target: string; canPreventDefault: true }) => EventArg<"tabPress", true>;
    const event = emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.dispatch({ ...CommonActions.navigate(route), target: state.key });
  };
  return (
    <View style={[styles.root, barProps.backgroundColor ? { backgroundColor: barProps.backgroundColor } : null]}>
      <BlurTarget ref={blurTarget} style={styles.root}>
        {children}
      </BlurTarget>
      <FloatingTabBar {...barProps} items={items} activeIndex={state.index} onChange={onChange} blurTarget={blurTarget} />
    </View>
  );
}

const FALLBACK_ICON: TabIcon = { stroke: "M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" };

const styles = StyleSheet.create({
  root: { flex: 1 },
});

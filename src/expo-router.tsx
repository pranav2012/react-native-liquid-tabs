import { TabList, TabSlot, TabTrigger, Tabs, defaultTabsSlotRender, useTabTrigger, type TabsSlotRenderOptions } from "expo-router/ui";
import { NativeTabs, type SFSymbolIcon } from "expo-router/unstable-native-tabs";
import { useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { BlurTarget } from "./BlurTarget";
import { FloatingTabBar } from "./FloatingTabBar";
import type { GlassTabBarProps } from "./GlassTabBar";
import type { TabIcon } from "./icons";

export interface LiquidTab {
  /** Route name inside this layout's folder (`index`, `settings`) and the path it opens (`/`, `/settings`). */
  name: string;
  href: string;
  title: string;
  /** Android icon. */
  icon: TabIcon;
  /** iOS SF Symbol, or a `{ default, selected }` pair. */
  sfSymbol?: SFSymbolIcon["sf"];
}

export interface LiquidTabsProps extends Pick<
  GlassTabBarProps,
  "dark" | "activeColor" | "inactiveColor" | "backgroundColor" | "labelFont"
> {
  tabs: LiquidTab[];
  hideOnKeyboard?: boolean;
  /** iOS 26: shrink the system tab bar while scrolling down. */
  minimizeBehavior?: "automatic" | "never" | "onScrollDown" | "onScrollUp";
}

/**
 * Drop-in tabs layout for Expo Router: the system tab bar on iOS (Liquid Glass on iOS 26), and the
 * glass droplet bar floating over a real blur on Android. Use it as a `_layout.tsx` default export.
 */
export function LiquidTabs(props: LiquidTabsProps) {
  return Platform.OS === "ios" ? <NativeTabsLayout {...props} /> : <GlassTabsLayout {...props} />;
}

function NativeTabsLayout({ tabs, activeColor, minimizeBehavior }: LiquidTabsProps) {
  return (
    <NativeTabs tintColor={activeColor} minimizeBehavior={minimizeBehavior}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
          {tab.sfSymbol ? <NativeTabs.Trigger.Icon sf={tab.sfSymbol} /> : null}
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

// Headless tabs, so the screens sit inside the blur target while the bar floats outside it.
function GlassTabsLayout(props: LiquidTabsProps) {
  const blurTarget = useRef<View>(null);
  return (
    <Tabs style={[styles.root, props.backgroundColor ? { backgroundColor: props.backgroundColor } : null]}>
      <BlurTarget ref={blurTarget} style={styles.root}>
        <TabSlot renderFn={renderFrozenWhenHidden} />
      </BlurTarget>
      <TabList style={styles.hidden}>
        {props.tabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href as never} />
        ))}
      </TabList>
      <RouterTabBar {...props} blurTarget={blurTarget} />
    </Tabs>
  );
}

// Hidden tabs stay mounted; freezing them stops their updates from re-rendering offscreen screens.
function renderFrozenWhenHidden(descriptor: Parameters<typeof defaultTabsSlotRender>[0], options: TabsSlotRenderOptions) {
  return defaultTabsSlotRender({ ...descriptor, options: { ...descriptor.options, freezeOnBlur: true } }, options);
}

function RouterTabBar({
  tabs,
  blurTarget,
  minimizeBehavior: _minimize,
  ...barProps
}: LiquidTabsProps & { blurTarget: React.RefObject<View | null> }) {
  const { getTrigger, switchTab } = useTabTrigger({ name: tabs[0]?.name ?? "" });
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => getTrigger(tab.name)?.isFocused),
  );
  return (
    <FloatingTabBar
      {...barProps}
      items={tabs.map((tab) => ({ key: tab.name, label: tab.title, icon: tab.icon }))}
      activeIndex={activeIndex}
      onChange={(index) => switchTab(tabs[index].name, {})}
      blurTarget={blurTarget}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hidden: { display: "none" },
});

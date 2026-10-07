import { useColorScheme } from "react-native";
import { LiquidTabs } from "react-native-liquid-tabs/expo-router";
import { TabIcons } from "react-native-liquid-tabs";

export default function TabsLayout() {
  const dark = useColorScheme() === "dark";
  return (
    <LiquidTabs
      dark={dark}
      backgroundColor={dark ? "#000000" : "#FFFFFF"}
      minimizeBehavior="onScrollDown"
      tabs={[
        { name: "index", href: "/", title: "Home", icon: TabIcons.home, sfSymbol: { default: "house", selected: "house.fill" } },
        { name: "explore", href: "/explore", title: "Explore", icon: TabIcons.search, sfSymbol: "magnifyingglass" },
        { name: "saved", href: "/saved", title: "Saved", icon: TabIcons.heart, sfSymbol: { default: "heart", selected: "heart.fill" } },
        { name: "profile", href: "/profile", title: "Profile", icon: TabIcons.person, sfSymbol: { default: "person", selected: "person.fill" } },
      ]}
    />
  );
}

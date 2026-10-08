import { LiquidTabs } from "react-native-liquid-tabs/expo-router";
import { TabIcons } from "react-native-liquid-tabs";

import { useTheme } from "../../components/ui";

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <LiquidTabs
      dark={theme.dark}
      backgroundColor={theme.bg}
      minimizeBehavior="onScrollDown"
      tabs={[
        { name: "index", href: "/", title: "Discover", icon: TabIcons.compass, sfSymbol: { default: "safari", selected: "safari.fill" } },
        { name: "explore", href: "/explore", title: "Explore", icon: TabIcons.search, sfSymbol: "magnifyingglass" },
        { name: "saved", href: "/saved", title: "Saved", icon: TabIcons.heart, sfSymbol: { default: "heart", selected: "heart.fill" } },
        {
          name: "profile",
          href: "/profile",
          title: "Profile",
          icon: TabIcons.person,
          sfSymbol: { default: "person", selected: "person.fill" },
        },
      ]}
    />
  );
}

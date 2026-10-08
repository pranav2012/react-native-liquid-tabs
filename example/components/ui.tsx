import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarInset } from "react-native-liquid-tabs";

import type { Destination } from "./data";
import { Scene } from "./Scene";

export const ACCENT = "#FF6B4A";

export function useTheme() {
  const dark = useColorScheme() === "dark";
  return dark
    ? { dark, bg: "#08080B", card: "#16161C", raised: "#1F1F27", text: "#F5F5F7", sub: "#8D8D98", line: "rgba(255,255,255,0.07)" }
    : { dark, bg: "#F3F3F7", card: "#FFFFFF", raised: "#ECECF1", text: "#0C0C11", sub: "#6D6D78", line: "rgba(0,0,0,0.06)" };
}

export const SIDE = 20;

export function Screen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom + 24, gap: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.header, { paddingHorizontal: SIDE }]}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: theme.sub }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { paddingHorizontal: SIDE }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action ? <Text style={[styles.action, { color: ACCENT }]}>{action}</Text> : null}
    </View>
  );
}

export function SearchPill({ placeholder }: { placeholder: string }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: SIDE }}>
      <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <Text style={[styles.searchIcon, { color: theme.sub }]}>⌕</Text>
        <Text style={[styles.searchText, { color: theme.sub }]}>{placeholder}</Text>
        <View style={[styles.filter, { backgroundColor: theme.raised }]}>
          <Text style={{ color: theme.text, fontSize: 14 }}>☰</Text>
        </View>
      </View>
    </View>
  );
}

export function Chips<T extends string>({ items, value, onChange }: { items: T[]; value: T; onChange: (item: T) => void }) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SIDE, gap: 8 }}>
      {items.map((item) => {
        const on = item === value;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[styles.chip, { backgroundColor: on ? theme.text : theme.card, borderColor: on ? theme.text : theme.line }]}
          >
            <Text style={[styles.chipText, { color: on ? theme.bg : theme.text }]}>{item}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Avatar({ size = 44, initials = "JR" }: { size?: number; initials?: string }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

/** A destination poster with its name and details over the scene. */
export function PosterCard({
  place,
  width,
  height,
  large,
  style,
}: {
  place: Destination;
  width: number;
  height: number;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width, height }, style]}>
      <Scene spec={place.scene} width={width} height={height} radius={large ? 32 : 24} />
      <View style={[StyleSheet.absoluteFill, styles.posterBody, { padding: large ? 20 : 14 }]}>
        <View style={styles.posterTop}>
          <View style={styles.glassPill}>
            <Text style={styles.glassText}>★ {place.rating.toFixed(1)}</Text>
          </View>
          <View style={[styles.glassPill, styles.round]}>
            <Text style={styles.glassText}>♡</Text>
          </View>
        </View>
        <View>
          <Text style={[styles.posterName, large && { fontSize: 30 }]} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={styles.posterMeta} numberOfLines={1}>
            {place.country}
            {large ? ` · ${place.days} days · from $${place.price.toLocaleString("en-US")}` : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** A list row with a small scene thumbnail. */
export function PlaceRow({ place, trailing }: { place: Destination; trailing?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <Scene spec={place.scene} width={64} height={64} radius={16} scrim={false} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={{ color: theme.sub, fontSize: 13 }} numberOfLines={1}>
          {place.country} · {place.days} days
        </Text>
      </View>
      <Text style={[styles.rowTrailing, { color: theme.text }]}>{trailing ?? `$${place.price.toLocaleString("en-US")}`}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: { fontSize: 15, fontWeight: "500", marginBottom: 2 },
  title: { fontSize: 32, fontWeight: "800", letterSpacing: -0.8 },
  section: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: -10 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
  action: { fontSize: 15, fontWeight: "600" },
  search: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 6,
    gap: 10,
  },
  searchIcon: { fontSize: 22, marginTop: -3 },
  searchText: { flex: 1, fontSize: 16 },
  filter: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: 19, borderWidth: 1, justifyContent: "center" },
  chipText: { fontSize: 14, fontWeight: "600" },
  posterBody: { justifyContent: "space-between" },
  posterTop: { flexDirection: "row", justifyContent: "space-between" },
  glassPill: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  round: { width: 30, paddingHorizontal: 0 },
  glassText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  posterName: { color: "#fff", fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
  posterMeta: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "500", marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 10, paddingRight: 16, borderRadius: 22, borderWidth: 1 },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowTrailing: { fontSize: 15, fontWeight: "700" },
  card: { borderRadius: 24, borderWidth: 1, padding: 18 },
});

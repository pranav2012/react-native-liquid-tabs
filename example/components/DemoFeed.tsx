import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarInset } from "react-native-liquid-tabs";

const PALETTE = ["#FF5E3A", "#FF9500", "#FFCC00", "#34C759", "#00C7BE", "#30B0C7", "#007AFF", "#5856D6", "#AF52DE", "#FF2D55"];

export function DemoFeed({ title, seed = 0, children }: { title: string; seed?: number; children?: ReactNode }) {
  const dark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  return (
    <ScrollView
      style={{ backgroundColor: dark ? "#000" : "#fff" }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom, paddingHorizontal: 16, gap: 12 }}
    >
      <Text style={[styles.title, { color: dark ? "#fff" : "#000" }]}>{title}</Text>
      {children}
      {Array.from({ length: 18 }, (_, i) => (
        <View key={i} style={[styles.card, { backgroundColor: PALETTE[(i + seed) % PALETTE.length] }]}>
          <Text style={styles.cardText}>Card {i + 1}</Text>
          <View style={styles.row}>
            {PALETTE.slice(0, 5).map((color, j) => (
              <View key={color} style={[styles.dot, { backgroundColor: PALETTE[(i + j + seed + 3) % PALETTE.length] }]} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, fontWeight: "700", marginBottom: 4 },
  card: { height: 140, borderRadius: 22, padding: 16, justifyContent: "space-between" },
  cardText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.8)" },
});

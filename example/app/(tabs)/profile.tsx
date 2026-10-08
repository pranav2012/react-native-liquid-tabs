import { StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { byId } from "../../components/data";
import { Scene } from "../../components/Scene";
import { ACCENT, Avatar, Card, Screen, SectionTitle, SIDE, useTheme } from "../../components/ui";

const STATS = [
  { value: "18", label: "Countries" },
  { value: "42", label: "Trips" },
  { value: "126", label: "Saved" },
];

const SETTINGS = ["Notifications", "Appearance", "Privacy", "Help & feedback"];

export default function Profile() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const trip = byId.kyoto;

  return (
    <Screen>
      <View style={styles.hero}>
        <Avatar size={96} />
        <Text style={[styles.name, { color: theme.text }]}>Jamie Rivera</Text>
        <Text style={{ color: theme.sub, fontSize: 15 }}>Exploring since 2021</Text>
      </View>
      <View style={{ paddingHorizontal: SIDE }}>
        <Card style={styles.stats}>
          {STATS.map((stat, i) => (
            <View key={stat.label} style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.line }]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={{ color: theme.sub, fontSize: 13 }}>{stat.label}</Text>
            </View>
          ))}
        </Card>
      </View>
      <SectionTitle title="Next trip" />
      <View style={{ paddingHorizontal: SIDE }}>
        <Card style={{ padding: 12, gap: 14 }}>
          <Scene spec={trip.scene} width={width - SIDE * 2 - 24} height={150} radius={16} scrim={false} />
          <View style={{ paddingHorizontal: 6, gap: 10 }}>
            <View style={styles.tripTitle}>
              <Text style={[styles.tripName, { color: theme.text }]}>
                {trip.name}, {trip.country}
              </Text>
              <Text style={{ color: ACCENT, fontWeight: "700" }}>in 12 days</Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.raised }]}>
              <View style={[styles.fill, { width: "68%" }]} />
            </View>
            <Text style={{ color: theme.sub, fontSize: 13 }}>Packing list · 17 of 25 done</Text>
          </View>
        </Card>
      </View>
      <SectionTitle title="Trip notes" />
      <View style={{ paddingHorizontal: SIDE }}>
        <TextInput
          placeholder="Write something; the Android bar hides with the keyboard"
          placeholderTextColor={theme.sub}
          multiline
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.line }]}
        />
      </View>
      <View style={{ paddingHorizontal: SIDE }}>
        <Card style={{ paddingVertical: 4 }}>
          {SETTINGS.map((setting, i) => (
            <View key={setting} style={[styles.setting, i > 0 && { borderTopWidth: 1, borderTopColor: theme.line }]}>
              <Text style={{ color: theme.text, fontSize: 16 }}>{setting}</Text>
              <Text style={{ color: theme.sub, fontSize: 22 }}>›</Text>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 6, paddingTop: 12 },
  name: { fontSize: 26, fontWeight: "800", letterSpacing: -0.6, marginTop: 8 },
  stats: { flexDirection: "row", paddingHorizontal: 0, paddingVertical: 16 },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "800" },
  tripTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  tripName: { fontSize: 18, fontWeight: "700" },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: ACCENT },
  input: { minHeight: 96, borderRadius: 20, borderWidth: 1, padding: 16, fontSize: 16, textAlignVertical: "top" },
  setting: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 2 },
});

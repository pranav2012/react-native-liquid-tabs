import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { byId, COLLECTIONS, DESTINATIONS } from "../../components/data";
import { Scene } from "../../components/Scene";
import { Card, Header, PlaceRow, Screen, SectionTitle, SIDE, useTheme } from "../../components/ui";

export default function Saved() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const inner = width - SIDE * 2 - 24;
  const big = inner * 0.62;
  const small = inner - big - 6;

  return (
    <Screen>
      <Header eyebrow={`${COLLECTIONS.length} collections`} title="Saved" />
      <View style={{ paddingHorizontal: SIDE, gap: 14 }}>
        {COLLECTIONS.map((collection) => {
          const [a, b, c] = collection.places.map((id) => byId[id]);
          return (
            <Card key={collection.id} style={{ padding: 12 }}>
              <View style={styles.mosaic}>
                <Scene spec={a.scene} width={big} height={176} radius={16} scrim={false} />
                <View style={{ gap: 6 }}>
                  <Scene spec={b.scene} width={small} height={85} radius={14} scrim={false} />
                  <Scene spec={c.scene} width={small} height={85} radius={14} scrim={false} />
                </View>
              </View>
              <View style={styles.caption}>
                <Text style={[styles.name, { color: theme.text }]}>{collection.title}</Text>
                <Text style={{ color: theme.sub, fontSize: 14 }}>{collection.places.length} places</Text>
              </View>
            </Card>
          );
        })}
      </View>
      <SectionTitle title="Recently saved" />
      <View style={{ paddingHorizontal: SIDE, gap: 10 }}>
        {DESTINATIONS.slice(3, 8).map((place) => (
          <PlaceRow key={place.id} place={place} trailing="♥" />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mosaic: { flexDirection: "row", gap: 6 },
  caption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 2,
  },
  name: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
});

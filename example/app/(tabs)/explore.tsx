import { View, useWindowDimensions } from "react-native";

import { DESTINATIONS } from "../../components/data";
import { Header, PosterCard, Screen, SearchPill, SIDE } from "../../components/ui";

const GAP = 12;

export default function Explore() {
  const { width } = useWindowDimensions();
  const column = (width - SIDE * 2 - GAP) / 2;
  const columns = [DESTINATIONS.filter((_, i) => i % 2 === 0), DESTINATIONS.filter((_, i) => i % 2 === 1)];

  return (
    <Screen>
      <Header eyebrow="11 destinations" title="Explore" />
      <SearchPill placeholder="Mountains, beaches, cities…" />
      <View style={{ flexDirection: "row", gap: GAP, paddingHorizontal: SIDE }}>
        {columns.map((places, c) => (
          <View key={c} style={{ gap: GAP }}>
            {places.map((place, i) => (
              <PosterCard key={place.id} place={place} width={column} height={(i + c) % 2 === 0 ? 250 : 190} />
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

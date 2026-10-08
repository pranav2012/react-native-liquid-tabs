import { useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";

import { CATEGORIES, DESTINATIONS } from "../../components/data";
import { Avatar, Chips, Header, PlaceRow, PosterCard, Screen, SearchPill, SectionTitle, SIDE } from "../../components/ui";

export default function Discover() {
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const places = category === "All" ? DESTINATIONS : DESTINATIONS.filter((d) => d.category === category);
  const [featured, ...rest] = places;

  return (
    <Screen>
      <Header eyebrow="Good evening, Jamie" title="Where to next?" right={<Avatar />} />
      <SearchPill placeholder="Search destinations" />
      <Chips items={CATEGORIES} value={category} onChange={setCategory} />
      {featured ? (
        <View style={{ paddingHorizontal: SIDE }}>
          <PosterCard place={featured} width={width - SIDE * 2} height={420} large />
        </View>
      ) : null}
      {rest.length > 0 ? (
        <>
          <SectionTitle title="Trending now" action="See all" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SIDE, gap: 12 }}>
            {rest.slice(0, 5).map((place) => (
              <PosterCard key={place.id} place={place} width={170} height={230} />
            ))}
          </ScrollView>
        </>
      ) : null}
      <SectionTitle title="Weekend escapes" />
      <View style={{ paddingHorizontal: SIDE, gap: 10 }}>
        {DESTINATIONS.filter((d) => d.days <= 5)
          .slice(0, 5)
          .map((place) => (
            <PlaceRow key={place.id} place={place} />
          ))}
      </View>
    </Screen>
  );
}

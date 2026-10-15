import { battleAtlases } from "./battle-backdrop";
import { arenaFloor } from "@/game/visual-environments";
import type { Route } from "@/game/world";
import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { SceneMotion, SceneImage } from "./scene-motion";
const sheets = {
  arrivalsA: require("../../assets/story/arrival-scenes-a.png"),
  arrivalsB: require("../../assets/story/arrival-scenes-b.png"),
  eventsA: require("../../assets/story/event-scenes-a.png"),
  eventsB: require("../../assets/story/event-scenes-b.png"),
  rooms: require("../../assets/story/room-scenes.png"),
};
/** Cells are clipped at runtime. Generated artwork contains scenery only. */
export function StoryArt({
  group,
  index,
  label,
}: {
  group: keyof typeof sheets;
  index: number;
  label?: string;
}) {
  return (
    <View
      style={{
        width: "100%",
        aspectRatio: 1.6,
        overflow: "hidden",
        borderBottomWidth: 1,
        borderColor: "#876b42",
      }}
    >
      <SceneMotion style={{ flex: 1 }}>
        <Image
          accessibilityLabel={label}
          source={sheets[group]}
          contentFit="fill"
          cachePolicy="disk"
          style={{
            position: "absolute",
            width: "300%",
            height: "320%",
            left: `${-(index % 3) * 100}%`,
            top: `${-Math.floor(index / 3) * 160 - 30}%`,
          }}
        />
      </SceneMotion>
    </View>
  );
}
export function ArrivalArt({
  floor,
  label,
}: {
  floor: number;
  label?: string;
}) {
  if (floor === 2)
    return (
      <SceneImage
        accessibilityLabel={label}
        source={require("../../assets/story/flooded-road.png")}
        contentFit="cover"
        style={{ width: "100%", aspectRatio: 1.6 }}
      />
    );
  if (floor <= 7)
    return (
      <StoryArt
        group="arrivalsA"
        index={floor === 1 ? 0 : floor - 2}
        label={label}
      />
    );
  return <StoryArt group="arrivalsB" index={floor - 8} label={label} />;
}

export function EventArt({ floor, label }: { floor: number; label?: string }) {
  if (floor === 2)
    return <StoryArt group="arrivalsB" index={5} label={label} />;
  if (floor >= 8)
    return <StoryArt group="eventsB" index={floor - 8} label={label} />;
  return (
    <StoryArt
      group="eventsA"
      index={floor === 1 ? 0 : floor - 2}
      label={label}
    />
  );
}

export function EnvironmentArt({
  floor,
  route = null,
  label,
}: {
  floor: number;
  route?: Route | null;
  label?: string;
}) {
  const index = arenaFloor(floor, route) - 1,
    cell = index % 4;
  return (
    <View style={{ width: "100%", aspectRatio: 1.6, overflow: "hidden" }}>
      <SceneMotion style={{ flex: 1 }}>
        <Image
          source={battleAtlases[Math.floor(index / 4)]}
          accessibilityLabel={label || "The labyrinth's empty passages"}
          contentFit="fill"
          cachePolicy="disk"
          style={{
            position: "absolute",
            width: "200%",
            height: "480%",
            left: `${-(cell % 2) * 100}%`,
            top: `${-Math.floor(cell / 2) * 240 - 65}%`,
          }}
        />
      </SceneMotion>
    </View>
  );
}

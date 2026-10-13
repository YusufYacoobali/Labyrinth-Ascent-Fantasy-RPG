import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { FLOORS } from "@/game/world";

export const battleAtlases = [
  require("../../assets/story/battle-floors-1-4.png"),
  require("../../assets/story/battle-floors-5-8.png"),
  require("../../assets/story/battle-floors-9-12.png"),
];

/** Each floor uses its own empty arena, including optional fights on that floor. */
export function BattleBackdrop({ floor }: { floor: number }) {
  const index = Math.min(11, Math.max(0, floor - 1));
  const cell = index % 4;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
    >
      <Image
        source={battleAtlases[Math.floor(index / 4)]}
        contentFit="fill"
        accessibilityLabel={`${FLOORS[index].name} battlefield`}
        style={{
          position: "absolute",
          width: "200.4%",
          height: "200.4%",
          left: `${-(cell % 2) * 100.2 - 0.1}%`,
          top: `${-Math.floor(cell / 2) * 100.2 - 0.1}%`,
        }}
      />
    </View>
  );
}

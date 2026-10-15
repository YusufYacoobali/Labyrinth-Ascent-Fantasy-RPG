import { ITEMS } from "@/game/world";
import { View } from "react-native";
import { Image } from "expo-image";
import { Copy, Panel } from "./game-ui";
import { MOTION_SHEETS } from "./combat-sheets";
import type { MotionKey } from "@/game/combat-visuals";
import { MONSTERS, essenceId } from "@/game/monsters";
import { ECOLOGY } from "@/game/ecology";
import { useGame } from "@/game/provider";

export function Bestiary() {
  const { state } = useGame();
  const known = MONSTERS.filter(
    (m, index) =>
      state.bestiary?.[m.id] ||
      state.inventory[essenceId(m.id)] > 0 ||
      (index < 12 && index < state.bestFloor),
  );
  return (
    <View style={{ gap: 8 }}>
      <Copy muted>
        Species, moves and rewards are recorded as you encounter them. Defeating
        a species reveals its defenses and essence power. Earlier campaign
        discoveries are retained.
      </Copy>
      {!known.length && (
        <Copy>
          No creatures observed yet. Your first expedition will begin the
          bestiary.
        </Copy>
      )}
      {known.map((m) => {
        const entry = state.bestiary?.[m.id],
          ecology = ECOLOGY[m.id],
          defeated =
            (entry?.defeated || 0) > 0 || state.inventory[essenceId(m.id)] > 0;
        return (
          <Panel key={m.id} style={{ padding: 12, gap: 7 }}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <View style={{ width: 56, height: 56, overflow: "hidden" }}>
                <Image
                  source={MOTION_SHEETS[m.visual as MotionKey]}
                  contentFit="fill"
                  style={{ width: 56 * 8, height: 56 * 6 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Copy title>{m.name}</Copy>
                <Copy muted>
                  {entry
                    ? `${entry.seen} encountered · ${entry.defeated} defeated`
                    : "Discovered on an earlier expedition"}
                </Copy>
              </View>
            </View>
            <Copy muted>
              Floors {ecology.floors.join(", ")} · {ecology.biomes.join(", ")}
            </Copy>
            {!!entry?.moves.length && (
              <Copy>Observed: {entry.moves.join(" · ")}</Copy>
            )}
            {defeated && (
              <>
                <Copy>
                  Weakness:{" "}
                  {(entry?.weaknesses || ecology.weaknesses).join(", ")} (+20%
                  damage). Resistance:{" "}
                  {Object.entries(entry?.resistances || ecology.resistances)
                    .map(([element, value]) => `${element} ${value}%`)
                    .join(", ")}
                  .
                </Copy>
                <Copy>
                  Essence: {m.skill} · 30% independent chance. Material:{" "}
                  {ITEMS.find((i) => i.id === m.material)?.name ||
                    "Crafting material"}
                  . Gold {m.gold}; XP {m.xp} per companion.
                </Copy>
              </>
            )}
          </Panel>
        );
      })}
    </View>
  );
}

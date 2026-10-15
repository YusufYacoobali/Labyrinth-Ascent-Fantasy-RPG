import React from "react";
import { View } from "react-native";
import { Button, Copy } from "./game-ui";
import { Surface, ItemGlyph } from "./native-chrome";
import { useGame } from "@/game/provider";
import { ITEMS } from "@/game/world";
import { theme as t } from "@/theme";

export function FieldSupplies() {
  const { state, dispatch } = useGame();
  const ids: ("torch" | "labyrinth-key")[] = [];
  if (state.phase === "arrival" && !state.arrivalChoice) ids.push("torch");

  if (
    state.phase === "event" &&
    !state.eventResolved &&
    [2, 10].includes(state.floor)
  )
    ids.push("labyrinth-key");
  const owned = ids.filter(
    (id) => (state.inventory[id] || 0) > 0 || state.usedSupplies.includes(id),
  );
  if (!owned.length) return null;
  return (
    <Surface style={{ padding: 10, gap: 7 }}>
      <Copy title style={{ fontSize: 18 }}>
        Field supplies
      </Copy>
      {owned.map((id) => (
        <View
          key={id}
          style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
        >
          <ItemGlyph id={id} size={31} />
          <View style={{ flex: 1 }}>
            <Copy style={{ fontSize: 13 }}>
              {ITEMS.find((i) => i.id === id)!.name} ×{state.inventory[id] || 0}
            </Copy>
            <Copy muted style={{ fontSize: 11, lineHeight: 15 }}>
              {id === "torch"
                ? "Reveal enemy · −8% enemy ATK"
                : "Safe treasure · extra gold and relic fragment"}
            </Copy>
          </View>
          <Button
            label={
              id === "torch"
                ? state.usedSupplies.includes(id)
                  ? "Torch lit"
                  : "Light torch"
                : "Unlock"
            }
            small
            compact
            tone="blue"
            disabled={
              state.usedSupplies.includes(id) || !(state.inventory[id] > 0)
            }
            onPress={() => dispatch({ type: "USE_SUPPLY", id })}
          />
        </View>
      ))}
      {state.phase === "arrival" && state.usedSupplies.includes("torch") && (
        <Copy style={{ color: t.color.gold, fontSize: 11 }}>
          Torch active · enemy ATK reduced
        </Copy>
      )}
    </Surface>
  );
}

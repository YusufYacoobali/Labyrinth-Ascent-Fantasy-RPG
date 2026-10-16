import React from "react";
import { View } from "react-native";
import { Copy, Icon, Panel } from "./game-ui";
import { ITEMS } from "@/game/world";
import { theme as t } from "@/theme";

export function RewardItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 5,
      }}
    >
      <Icon name={icon} size={30} />
      <Copy style={{ flex: 1, fontSize: 15 }}>{label}</Copy>
      <Copy
        style={{
          color: t.color.goldLight,
          fontFamily: t.font.bold,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Copy>
    </View>
  );
}

export function RewardItems({
  items,
  gold = 0,
  food = 0,
  potions = 0,
  gems = 0,
}: {
  items: Record<string, number>;
  gold?: number;
  food?: number;
  potions?: number;
  gems?: number;
}) {
  return (
    <Panel style={{ gap: 4 }}>
      {Object.entries(items)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => {
          const item = ITEMS.find((i) => i.id === id);
          return (
            <RewardItem
              key={id}
              icon={item?.icon || "treasure-chest"}
              label={item?.name || id}
              value={`×${quantity}`}
            />
          );
        })}
      {gold > 0 && <RewardItem icon="gold" label="Gold" value={`+${gold}`} />}
      {food > 0 && (
        <RewardItem icon="sack" label="Rations" value={`+${food}`} />
      )}
      {potions > 0 && (
        <RewardItem
          icon="bottle-tonic-plus"
          label="Potions"
          value={`+${potions}`}
        />
      )}
      {gems > 0 && (
        <RewardItem icon="creation" label="Crystals" value={`+${gems}`} />
      )}
    </Panel>
  );
}

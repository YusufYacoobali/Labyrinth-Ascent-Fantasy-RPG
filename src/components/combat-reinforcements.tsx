import { View } from "react-native";
import type { CombatEnemy } from "@/game/round-combat";
import { Button, Copy, Eyebrow, Icon, Panel } from "./game-ui";
import { theme as t } from "@/theme";

export default function CombatReinforcements({
  enemies,
  onContinue,
  topInset,
}: {
  enemies: CombatEnemy[];
  onContinue: () => void;
  topInset: number;
}) {
  return (
    <View
      testID="reinforcement-notice"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        top: topInset + 60,
        zIndex: 4,
      }}
    >
      <Panel
        style={{
          padding: 14,
          gap: 10,
          backgroundColor: "rgba(7,19,31,.97)",
          borderColor: t.color.gold,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Icon name="account-group-outline" size={27} color={t.color.gold} />
          <Eyebrow>Reinforcements</Eyebrow>
        </View>
        <Copy
          title
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={{ fontSize: 22, lineHeight: 27, color: t.color.goldLight }}
        >
          New enemies have joined!
        </Copy>
        <Copy>
          {enemies.map((enemy) => enemy.name).join(" and ")}{" "}
          {enemies.length === 1 ? "has" : "have"} entered the battle.
        </Copy>
        <Copy muted style={{ fontSize: 12, lineHeight: 17 }}>
          Reinforcements act from the next round.
        </Copy>
        <Button
          label="Continue battle"
          icon="chevron-right"
          small
          onPress={onContinue}
        />
      </Panel>
    </View>
  );
}

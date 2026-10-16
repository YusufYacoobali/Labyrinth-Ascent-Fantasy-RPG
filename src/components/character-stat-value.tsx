import type { StyleProp, TextStyle } from "react-native";
import type { Character } from "@/game/engine";
import { characterStat, type CharacterStat } from "@/game/character-stats";
import { Copy } from "./game-ui";
import { theme as t } from "@/theme";

export function CharacterStatValue({
  character,
  stat,
  current,
  additionalBonus = 0,
  style,
}: {
  character: Character;
  stat: CharacterStat;
  current?: number;
  additionalBonus?: number;
  style?: StyleProp<TextStyle>;
}) {
  const { base, bonus: equippedBonus, total } = characterStat(character, stat);
  const bonus = equippedBonus + additionalBonus;
  return (
    <Copy
      style={style}
      accessibilityLabel={
        current !== undefined
          ? `${current} of ${total + additionalBonus}. Maximum ${base}, equipment ${bonus >= 0 ? "plus" : "minus"} ${Math.abs(bonus)}.`
          : `${base}, equipment ${bonus >= 0 ? "plus" : "minus"} ${Math.abs(bonus)}. Total ${total + additionalBonus}.`
      }
    >
      {current !== undefined ? `${current}/` : ""}
      {base}
      {bonus !== 0 && (
        <Copy
          style={[style, { color: bonus > 0 ? t.color.green : t.color.red }]}
        >
          {` (${bonus > 0 ? "+" : "−"}${Math.abs(bonus)})`}
        </Copy>
      )}
    </Copy>
  );
}

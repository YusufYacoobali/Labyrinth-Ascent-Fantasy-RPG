import { Pressable, View } from "react-native";
import { Copy, Icon } from "./game-ui";
import { BevelFrame } from "./mock-chrome";
import { theme as t } from "@/theme";

export default function CombatOtherActions({
  canAct,
  canItem,
  canFocus,
  canBurst,
  onItem,
  onFocus,
  onBurst,
}: {
  canAct: boolean;
  canItem: boolean;
  canFocus: boolean;
  canBurst: boolean;
  onItem: () => void;
  onFocus: () => void;
  onBurst: () => void;
}) {
  const options = [
    {
      label: "Item",
      detail: "Shared supplies",
      icon: "bottle-tonic",
      tone: "gold" as const,
      disabled: !canAct || !canItem,
      onPress: onItem,
    },
    {
      label: "Focus",
      detail: "+20 MP · +1 momentum",
      icon: "eye",
      tone: "blue" as const,
      disabled: !canAct || !canFocus,
      onPress: onFocus,
    },
    {
      label: "Burst",
      detail: "+35% damage · 2 momentum",
      icon: "sword-cross",
      tone: "red" as const,
      disabled: !canAct || !canBurst,
      onPress: onBurst,
    },
  ];
  return (
    <View style={{ gap: 8 }}>
      {[0, 2].map((start) => (
        <View key={start} style={{ flexDirection: "row", gap: 8 }}>
          {options.slice(start, start + 2).map((option) => (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityHint={option.detail}
              accessibilityState={{ disabled: option.disabled }}
              disabled={option.disabled}
              onPress={option.onPress}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                opacity: option.disabled ? 0.4 : pressed ? 0.75 : 1,
              })}
            >
              <BevelFrame
                tone={option.tone}
                style={{
                  minHeight: 78,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 5,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
                >
                  <Icon
                    name={option.icon}
                    size={19}
                    color={t.color.goldLight}
                  />
                  <Copy style={{ fontSize: 16, lineHeight: 21 }}>
                    {option.label}
                  </Copy>
                </View>
                <Copy
                  style={{ fontSize: 11, lineHeight: 15, color: t.color.muted }}
                >
                  {option.detail}
                </Copy>
              </BevelFrame>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

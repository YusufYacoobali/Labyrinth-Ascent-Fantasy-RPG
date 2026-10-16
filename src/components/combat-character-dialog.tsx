import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Character } from "@/game/engine";
import { SKILLS, resist } from "@/game/combat-data";
import { skillCost } from "@/game/build-equipment";
import { skillRank } from "@/game/progression";
import { conditionText, impeded } from "@/game/combat-status";
import { formationOf } from "@/game/formation";
import { ITEMS } from "@/game/world";
import { Atlas, Bar, Copy, Icon } from "./game-ui";
import CombatDetailsPopup from "./combat-details-popup";
import { theme as t } from "@/theme";

export default function CombatCharacterDialog({
  character: c,
  planned,
  onChoose,
  onClose,
}: {
  character: Character;
  planned: boolean;
  onChoose: () => void;
  onClose: () => void;
}) {
  const status = [
    c.hp <= 0
      ? "Fallen · cannot act"
      : impeded(c)
        ? "Cannot act this round"
        : "Ready to act",
    c.ailments.paralysis ? `Paralysed · ${c.ailments.paralysis} rounds` : "",
    c.ailments.poison ? `Poisoned · ${c.ailments.poison} rounds` : "",
    c.ailments.barrier ? `Barrier · ${c.ailments.barrier} HP` : "",
    c.ailments.ward ? `Ailment ward · ${c.ailments.ward} rounds` : "",
    conditionText(c.ailments.conditions),
  ]
    .filter(Boolean)
    .join(" · ");
  const resistance = (["physical", "fire", "frost", "venom"] as const).flatMap(
    (element) => {
      const amount = resist(c, element);
      return amount > 0 ? [`${element} ${amount}%`] : [];
    },
  );
  const canChoose = c.hp > 0 && !impeded(c);
  return (
    <CombatDetailsPopup
      testID="character-details-popup"
      closeLabel="Close character details"
      onClose={onClose}
      action={
        canChoose
          ? { label: `Choose action for ${c.name}`, onPress: onChoose }
          : undefined
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 18 }}
      >
        <LinearGradient
          colors={["#263646", "#101c2a", "#101b28"]}
          style={styles.hero}
        >
          <Copy
            style={[styles.label, { color: t.color.gold, letterSpacing: 3 }]}
          >
            YOUR COMPANY
          </Copy>
          <Atlas index={c.portrait} size={88} />
          <Copy
            title
            accessibilityRole="header"
            style={{
              fontSize: 26,
              lineHeight: 30,
              color: t.color.goldLight,
              textAlign: "center",
            }}
          >
            {c.name}
          </Copy>
          <Copy muted style={{ fontSize: 13 }}>
            Level {c.level} · {c.race} {c.job} · {formationOf(c)} row
          </Copy>
        </LinearGradient>
        <View style={{ paddingHorizontal: 18, gap: 16 }}>
          <View style={styles.row}>
            {[
              { label: "HP", value: c.hp, max: c.maxHp, color: t.color.green },
              { label: "MP", value: c.mp, max: c.maxMp, color: t.color.blue },
            ].map((stat) => (
              <View key={stat.label} style={{ flex: 1, gap: 6 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Copy style={styles.label}>{stat.label}</Copy>
                  <Copy style={{ fontSize: 13 }}>
                    {stat.value}/{stat.max}
                  </Copy>
                </View>
                <Bar value={stat.value} max={stat.max} color={stat.color} />
              </View>
            ))}
          </View>
          <View style={styles.row}>
            {[
              ["sword", "ATK", c.atk],
              ["shield", "DEF", c.def],
              ["run-fast", "SPD", c.speed],
              ["sleep", "FATIGUE", `${c.exhaustion || 0}%`],
            ].map(([icon, label, value]) => (
              <View
                key={label}
                style={{ flex: 1, alignItems: "center", gap: 3 }}
              >
                <Icon name={String(icon)} size={20} />
                <Copy style={styles.label}>{label}</Copy>
                <Copy style={{ fontSize: 18 }}>{value}</Copy>
              </View>
            ))}
          </View>
          <Copy
            style={{
              color: canChoose ? t.color.green : t.color.goldLight,
              fontSize: 13,
              lineHeight: 19,
            }}
          >
            {status}
          </Copy>
          <View style={{ gap: 9 }}>
            <Copy style={styles.label}>EQUIPPED SKILLS</Copy>
            {c.skills.map((name) => {
              const skill = SKILLS.find((s) => s.name === name);
              if (!skill) return null;
              const cooldown = c.cooldowns[name] || 0;
              return (
                <View
                  key={name}
                  style={{
                    flexDirection: "row",
                    gap: 9,
                    alignItems: "flex-start",
                  }}
                >
                  <Icon name={skill.icon} size={24} color={skill.color} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                    >
                      <Copy style={{ fontFamily: t.font.bold, fontSize: 15 }}>
                        {name}
                      </Copy>
                      <Copy
                        style={{
                          color: cooldown ? t.color.gold : t.color.muted,
                          fontSize: 12,
                        }}
                      >
                        {skill.passive
                          ? "Passive"
                          : `${skillCost(c, name, skill.cost)} MP`}{" "}
                        · Rank {skillRank(c, name)}
                        {cooldown ? ` · Ready in ${cooldown} rounds` : ""}
                      </Copy>
                    </View>
                    <Copy muted style={{ fontSize: 12, lineHeight: 17 }}>
                      {skill.description}
                    </Copy>
                  </View>
                </View>
              );
            })}
            {!c.skills.length && <Copy muted>No skills equipped.</Copy>}
          </View>
          <View style={{ gap: 5 }}>
            <Copy style={styles.label}>TALENT</Copy>
            <Copy style={{ fontSize: 14 }}>
              {c.traitRevealed ? c.trait : "Hidden talent"}
            </Copy>
          </View>
          {!!resistance.length && (
            <View style={{ gap: 5 }}>
              <Copy style={styles.label}>RESISTANCES</Copy>
              <Copy style={{ fontSize: 13 }}>{resistance.join(" · ")}</Copy>
            </View>
          )}
          {!!c.equipment.length && (
            <View style={{ gap: 5 }}>
              <Copy style={styles.label}>EQUIPMENT</Copy>
              <Copy style={{ fontSize: 13 }}>
                {c.equipment
                  .map((id) => ITEMS.find((i) => i.id === id)?.name || id)
                  .join(" · ")}
              </Copy>
            </View>
          )}
          {planned && (
            <Copy muted style={{ fontSize: 12 }}>
              Action chosen. You can revise it before the round starts.
            </Copy>
          )}
        </View>
      </ScrollView>
    </CombatDetailsPopup>
  );
}
const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  label: {
    fontFamily: t.font.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: t.color.muted,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#876b4244",
  },
});

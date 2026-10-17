import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Enemy, Game } from "@/game/engine";
import { monsterKnowledge } from "@/game/bestiary";
import { monsterFor } from "@/game/monsters";
import { ITEMS } from "@/game/world";
import { enemyVisual, mirrorEnemy } from "@/game/combat-visuals";
import { theme as t } from "@/theme";
import { Bar, Copy, Icon } from "./game-ui";
import CombatDetailsPopup from "./combat-details-popup";
import { MOTION_SHEETS } from "./combat-sheets";

function Discovery({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon: string;
}) {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Icon name={icon} size={12} color={t.color.goldDim} />
        <Copy style={styles.label}>{label}</Copy>
      </View>
      <Copy
        style={{
          fontSize: 13,
          lineHeight: 18,
          color: value ? t.color.text : t.color.muted,
        }}
      >
        {value || "Unknown"}
      </Copy>
    </View>
  );
}

export default function CombatEnemyDialog({
  state,
  enemy,
  readiedMove,
  statusText,
  onClose,
}: {
  state: Game;
  enemy: Enemy;
  readiedMove?: string;
  statusText?: string;
  onClose: () => void;
}) {
  const viewport = useWindowDimensions();
  const compact = viewport.height < 700;
  const size = compact ? 100 : 148;
  const visual = enemyVisual({ ...state, enemy });
  const knowledge = monsterKnowledge(state, enemy);
  const equipment = (monsterFor(enemy, state.floor).equipment || [])
    .map((id) => ITEMS.find((item) => item.id === id))
    .filter((item) => item !== undefined);
  const knownReadiedMove =
    readiedMove && knowledge.moves.includes(readiedMove)
      ? readiedMove
      : undefined;
  return (
    <CombatDetailsPopup
      testID="enemy-details-popup"
      closeLabel="Close enemy details"
      onClose={onClose}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <LinearGradient
          colors={["#263646", "#101c2a", "#101b28"]}
          style={[styles.hero, { paddingTop: compact ? 16 : 22 }]}
        >
          <Copy
            style={[
              styles.label,
              {
                color: t.color.gold,
                letterSpacing: 3,
                textAlign: "center",
              },
            ]}
          >
            FIELD NOTES
          </Copy>
          <View
            style={[
              styles.medallion,
              {
                width: size + 22,
                height: size + 22,
                borderRadius: (size + 22) / 2,
              },
            ]}
          >
            <LinearGradient
              colors={["#80653644", "#0b1420", "#263849"]}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: (size + 22) / 2 },
              ]}
            />
            <View
              style={{
                width: size,
                height: size,
                overflow: "hidden",
                transform: [{ scaleX: mirrorEnemy(visual.key) ? -1 : 1 }],
              }}
            >
              <Image
                source={MOTION_SHEETS[visual.key]}
                accessibilityLabel={`${enemy.name} illustration`}
                contentFit="fill"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: size * 8,
                  height: size * 6,
                }}
              />
            </View>
          </View>
          <Copy
            title
            accessibilityRole="header"
            style={{
              fontSize: compact ? 22 : 26,
              lineHeight: compact ? 26 : 30,
              color: t.color.goldLight,
              textAlign: "center",
            }}
          >
            {enemy.name}
          </Copy>
          <Copy
            muted
            style={{ fontSize: 11, lineHeight: 16, textAlign: "center" }}
          >
            {knowledge.seen} encountered · {knowledge.defeated} defeated
          </Copy>
        </LinearGradient>
        {equipment.length > 0 && (
          <View style={{ padding: 14, gap: 8 }}>
            <Copy style={styles.label}>
              CARRIED EQUIPMENT · DROPS ON DEFEAT
            </Copy>
            {equipment.map((item) => (
              <View
                key={item.id}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Icon name={item.icon} size={25} />
                <Copy style={{ flex: 1 }}>{item.name}</Copy>
              </View>
            ))}
          </View>
        )}
        <View style={{ paddingHorizontal: 18, gap: 16 }}>
          <View style={styles.vitals}>
            {[
              {
                label: "HP",
                value: enemy.hp,
                max: enemy.maxHp,
                color: t.color.red,
              },
              {
                label: "BREAK",
                value: enemy.poise,
                max: enemy.maxPoise,
                color: t.color.gold,
              },
            ].map((stat) => (
              <View key={stat.label} style={{ flex: 1, gap: 6 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Copy style={styles.label}>{stat.label}</Copy>
                  <Copy
                    style={{
                      fontSize: 12,
                      lineHeight: 16,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {stat.value}
                    <Copy muted style={{ fontSize: 10 }}>
                      /{stat.max}
                    </Copy>
                  </Copy>
                </View>
                <Bar value={stat.value} max={stat.max} color={stat.color} />
              </View>
            ))}
          </View>
          {!!statusText && (
            <Copy
              style={{
                color: t.color.goldLight,
                fontSize: 12,
                lineHeight: 17,
              }}
            >
              {statusText}
            </Copy>
          )}
          <View style={styles.discoveryRow}>
            <Discovery
              label="ELEMENT"
              icon={
                knowledge.element
                  ? {
                      physical: "sword",
                      fire: "fire",
                      frost: "snowflake",
                      venom: "snake",
                    }[knowledge.element]
                  : "help-circle-outline"
              }
              value={knowledge.element}
            />
            <Discovery
              label="ESSENCE SKILL"
              icon="creation"
              value={knowledge.skill}
            />
          </View>
          <View style={styles.discoveryRow}>
            <Discovery
              label="WEAKNESSES"
              icon="shield-off-outline"
              value={
                knowledge.weaknesses
                  ? knowledge.weaknesses.join(", ") || "None"
                  : undefined
              }
            />
            <Discovery
              label="RESISTANCES"
              icon="shield-outline"
              value={
                knowledge.resistances
                  ? Object.entries(knowledge.resistances)
                      .map(([element, value]) => `${element} ${value}%`)
                      .join(", ") || "None"
                  : undefined
              }
            />
          </View>
          <View style={{ gap: 7 }}>
            <Copy style={[styles.label, { color: t.color.gold }]}>
              OBSERVED MOVES
            </Copy>
            {knowledge.moves.length ? (
              knowledge.moves.map((move) => (
                <View
                  key={move}
                  style={{
                    flexDirection: "row",
                    gap: 7,
                    alignItems: "flex-start",
                  }}
                >
                  <Icon
                    name="diamond-outline"
                    size={15}
                    color={t.color.goldDim}
                  />
                  <Copy style={{ flex: 1, fontSize: 12, lineHeight: 17 }}>
                    {move}
                  </Copy>
                </View>
              ))
            ) : (
              <Copy muted style={{ fontSize: 12, lineHeight: 17 }}>
                No moves witnessed yet. Watch it fight to learn more.
              </Copy>
            )}
            {!!knownReadiedMove && (
              <Copy
                style={{
                  fontSize: 12,
                  lineHeight: 17,
                  color: t.color.goldLight,
                }}
              >
                Readying: {knownReadiedMove}
              </Copy>
            )}
            {!knowledge.skill && (
              <Copy muted style={{ fontSize: 10, lineHeight: 15 }}>
                Defeat this species to uncover its defenses and essence.
              </Copy>
            )}
          </View>
        </View>
      </ScrollView>
    </CombatDetailsPopup>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  medallion: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#b4915366",
    marginTop: 3,
  },
  label: {
    fontFamily: t.font.bold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.4,
    color: t.color.muted,
  },
  vitals: {
    flexDirection: "row",
    gap: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#876b4244",
  },
  discoveryRow: {
    flexDirection: "row",
    gap: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#876b422f",
  },
});

import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Atlas, Bar, Button, Copy, Eyebrow, Icon, Panel } from "./game-ui";
import { useGame } from "@/game/provider";
import { SKILLS, SKILL_RANKS } from "@/game/combat-data";
import { MONSTERS, essenceId } from "@/game/monsters";
import {
  essenceBindingOptions,
  skillRank,
  skillSlots,
} from "@/game/progression";
import { theme as t } from "@/theme";

export function SkillLibrary({
  characterId,
  catalog = false,
}: {
  characterId: string;
  catalog?: boolean;
}) {
  const { state, dispatch } = useGame();
  const [details, setDetails] = useState<string | null>(null);
  const c = state.party.concat(state.reserve).find((p) => p.id === characterId);
  if (!c) return null;
  const town = state.phase === "town";
  const canBind = town || (state.phase === "camp" && !state.journey.wildCamp);
  const capacity = skillSlots(c.level);
  const nextSlot = [3, 6, 9, 12].find((level) => level > c.level);
  const offers = SKILLS.filter(
    (skill) =>
      catalog ||
      c.learnedSkills.includes(skill.name) ||
      MONSTERS.some(
        (m) => m.skill === skill.name && state.inventory[essenceId(m.id)] > 0,
      ),
  );
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow>
          SKILLS · {c.skills.length}/{capacity}
        </Eyebrow>
        {nextSlot && (
          <Copy muted style={{ fontSize: 12 }}>
            Next slot: Lv. {nextSlot}
          </Copy>
        )}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {Array.from({ length: capacity }, (_, index) => {
          const skill = SKILLS.find((s) => s.name === c.skills[index]);
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={
                skill
                  ? `${skill.name}, equipped. Show details`
                  : `Empty skill slot ${index + 1}`
              }
              disabled={!skill}
              onPress={() =>
                setDetails(details === skill?.name ? null : skill?.name || null)
              }
              style={{
                flex: 1,
                minWidth: 64,
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                gap: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: skill ? "solid" : "dashed",
                borderColor: skill ? skill.color : t.color.line,
                backgroundColor: t.color.panel,
              }}
            >
              <Icon
                name={skill?.icon || "plus"}
                size={26}
                color={skill?.color || t.color.muted}
              />
              <Copy
                numberOfLines={2}
                style={{ fontSize: 11, lineHeight: 14, textAlign: "center" }}
              >
                {skill?.name || "Empty"}
              </Copy>
            </Pressable>
          );
        })}
      </View>
      {offers.map((skill) => {
        const known = c.learnedSkills.includes(skill.name);
        const equipped = c.skills.includes(skill.name);
        const essences = essenceBindingOptions(state, skill.name);
        const rank = skillRank(c, skill.name);
        const expanded = details === skill.name;
        const provisional = state.expedition.provisionalSkills[c.id]?.includes(
          skill.name,
        );
        return (
          <Panel key={skill.name} style={{ padding: 10, gap: 7 }}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <Icon name={skill.icon} size={32} color={skill.color} />
              <View style={{ flex: 1, gap: 2 }}>
                <Copy style={{ fontFamily: t.font.bold, fontSize: 16 }}>
                  {skill.name}
                </Copy>
                <Copy muted style={{ fontSize: 12 }}>
                  {skill.passive ? "Passive" : `${skill.cost} MP`}
                  {known ? ` · Rank ${rank}` : ""}
                  {equipped ? " · Equipped" : ""}
                </Copy>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${expanded ? "Hide" : "Show"} ${skill.name} details`}
                accessibilityState={{ expanded }}
                hitSlop={10}
                onPress={() => setDetails(expanded ? null : skill.name)}
              >
                <Icon
                  name={expanded ? "chevron-up" : "information-outline"}
                  size={24}
                />
              </Pressable>
            </View>
            <Copy style={{ fontSize: 13, lineHeight: 18 }}>
              {SKILL_RANKS[skill.name][rank - 1]}
            </Copy>
            {provisional && (
              <Copy muted style={{ fontSize: 12 }}>
                Bring this skill home to keep it.
              </Copy>
            )}
            {expanded && (
              <View style={{ gap: 6 }}>
                {known && (
                  <Bar
                    value={c.mastery[skill.name] || 0}
                    max={rank === 1 ? 12 : 40}
                    label={
                      rank === 3
                        ? "Mastered"
                        : `Mastery ${c.mastery[skill.name] || 0}/${rank === 1 ? 12 : 40}`
                    }
                  />
                )}
                {SKILL_RANKS[skill.name].map((description, i) => (
                  <Copy key={i} muted style={{ fontSize: 12, lineHeight: 17 }}>
                    Rank {i + 1}: {description}
                  </Copy>
                ))}
              </View>
            )}
            {known && town && (
              <Button
                small
                compact
                tone={equipped ? "dark" : "blue"}
                label={
                  equipped
                    ? "Unequip"
                    : c.skills.length >= capacity
                      ? "Slots full"
                      : "Equip"
                }
                disabled={!equipped && c.skills.length >= capacity}
                onPress={() =>
                  dispatch({
                    type: "SLOT_SKILL",
                    id: c.id,
                    skill: skill.name,
                    equip: !equipped,
                  })
                }
              />
            )}
            {!known &&
              essences.map((essence) => (
                <Button
                  key={essence.species}
                  small
                  compact
                  tone="blue"
                  icon="creation"
                  label={`Bind ${essence.name} · ×${essence.quantity}`}
                  disabled={!canBind || c.hp <= 0}
                  onPress={() =>
                    dispatch({
                      type: "LEARN",
                      id: c.id,
                      skill: skill.name,
                      species: essence.species,
                    })
                  }
                />
              ))}
            {!known && !essences.length && (
              <Copy muted style={{ fontSize: 12 }}>
                Find{" "}
                {MONSTERS.filter((m) => m.skill === skill.name)
                  .map((m) => m.name)
                  .join(" / ")}{" "}
                essence.
              </Copy>
            )}
          </Panel>
        );
      })}
      {!offers.length && (
        <Copy muted>Find monster essences to learn new skills.</Copy>
      )}
    </View>
  );
}

export function ShelterBinding() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(
    state.party.find((c) => c.hp > 0)?.id || "hero",
  );
  const count = MONSTERS.reduce(
    (n, m) => n + (state.inventory[essenceId(m.id)] || 0),
    0,
  );
  return (
    <View style={{ gap: 8 }}>
      <Button
        small
        tone="blue"
        icon="creation"
        label={open ? "Close binding" : `Bind essences · ${count}`}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <Copy muted style={{ fontSize: 12 }}>
            Choose who learns. Bring new powers home to keep them.
          </Copy>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {state.party
              .filter((c) => c.hp > 0)
              .map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Bind to ${c.name}`}
                  accessibilityState={{ selected: selected === c.id }}
                  onPress={() => setSelected(c.id)}
                  style={{
                    alignItems: "center",
                    gap: 3,
                    padding: 5,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderColor:
                      selected === c.id ? t.color.blue : t.color.line,
                  }}
                >
                  <Atlas index={c.portrait} size={42} />
                  <Copy style={{ fontSize: 12 }}>{c.name}</Copy>
                </Pressable>
              ))}
          </View>
          <SkillLibrary characterId={selected} />
        </>
      )}
    </View>
  );
}

import React, { useState } from "react";
import { View } from "react-native";
import { Button, Copy, Eyebrow, Panel } from "./game-ui";
import { useGame } from "@/game/provider";
import { SKILLS, SKILL_RANKS } from "@/game/combat-data";
import { MONSTERS, essenceId } from "@/game/monsters";
import {
  essenceBindingOptions,
  skillRank,
  skillSlots,
} from "@/game/progression";

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
  const offers = SKILLS.filter(
    (s) =>
      catalog ||
      c.learnedSkills.includes(s.name) ||
      MONSTERS.some(
        (m) => m.skill === s.name && state.inventory[essenceId(m.id)] > 0,
      ),
  );
  return (
    <View style={{ gap: 10 }}>
      <Eyebrow>
        {c.skills.length}/{skillSlots(c.level)} SKILL SLOTS · {c.name}
      </Eyebrow>
      <Copy muted>
        Two slots initially; another at levels 3, 6, 9 and 12. Active and
        passive skills share slots. Change loadouts in town.
      </Copy>
      {offers.map((skill) => {
        const known = c.learnedSkills.includes(skill.name);
        const equipped = c.skills.includes(skill.name);
        const sources = MONSTERS.filter((m) => m.skill === skill.name);
        const essences = essenceBindingOptions(state, skill.name);
        const provisional = state.expedition.provisionalSkills[c.id]?.includes(
          skill.name,
        );
        const rank = skillRank(c, skill.name);
        const points = c.mastery[skill.name] || 0;
        return (
          <Panel key={skill.name} style={{ gap: 7 }}>
            <Copy title>
              {skill.name}
              {known ? ` · Rank ${rank}` : ""}
            </Copy>
            <Copy muted>
              {skill.passive ? "Passive" : `${skill.cost} MP`} ·{" "}
              {equipped
                ? "Equipped"
                : known
                  ? "In library"
                  : "Requires a compatible monster essence"}
            </Copy>
            <Copy>{SKILL_RANKS[skill.name][rank - 1]}</Copy>
            {provisional && <Copy>Secured on extraction · lost on defeat</Copy>}
            {known && (
              <Copy muted>
                Mastery {points}/{rank === 1 ? 12 : 40}
                {rank === 3 ? " · Complete" : " · Earned through use"}
              </Copy>
            )}
            <Button
              small
              tone="dark"
              label={
                details === skill.name ? "Hide ranks" : "View all three ranks"
              }
              onPress={() =>
                setDetails(details === skill.name ? null : skill.name)
              }
            />
            {details === skill.name &&
              SKILL_RANKS[skill.name].map((description, i) => (
                <Copy key={i} muted>
                  Rank {i + 1}
                  {i === 1
                    ? " · 12 mastery"
                    : i === 2
                      ? " · 40 mastery"
                      : ""}: {description}
                </Copy>
              ))}
            {known && town && (
              <Button
                small
                label={equipped ? "Unequip" : "Equip skill"}
                disabled={!equipped && c.skills.length >= skillSlots(c.level)}
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
            {essences.map((essence) => (
              <View key={essence.species} style={{ gap: 5 }}>
                <Copy muted>
                  {essence.name} essence ×{essence.quantity} · {essence.secured}{" "}
                  secured · {essence.unsecured} unsecured
                </Copy>
                {!known && (
                  <Button
                    small
                    tone="blue"
                    label={`Bind ${essence.name} essence${!town && essence.unsecured > 0 ? " · Secured on extraction" : ""}`}
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
                )}
              </View>
            ))}
            {!known && !essences.length && (
              <Copy muted>
                Sources: {sources.map((m) => m.name).join(", ")}. No compatible
                essence held.
              </Copy>
            )}
          </Panel>
        );
      })}
      {!offers.length && (
        <Copy muted>Defeat monsters for a 30% chance of their essence.</Copy>
      )}
      <Copy muted>
        Duplicates can teach another ally, replace recipe materials at the
        forge, or be sold to the guild.
      </Copy>
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
        label={
          open ? "Close essence binding" : `Bind essences · ${count} available`
        }
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <Copy>
            Essences found on this expedition become permanent only after
            successful extraction. New skills fill empty slots; swaps require
            town.
          </Copy>
          {state.party
            .filter((c) => c.hp > 0)
            .map((c) => (
              <Button
                key={c.id}
                small
                tone={selected === c.id ? "blue" : "dark"}
                label={c.name}
                onPress={() => setSelected(c.id)}
              />
            ))}
          <SkillLibrary characterId={selected} />
        </>
      )}
    </View>
  );
}

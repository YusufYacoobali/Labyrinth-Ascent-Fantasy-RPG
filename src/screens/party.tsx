import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import {
  art,
  Atlas,
  Bar,
  Button,
  Copy,
  Divider,
  Eyebrow,
  Frame,
  Icon,
  Panel,
} from "@/components/game-ui";
import { RACES, resist, SKILLS } from "@/game/engine";
import { ITEMS } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { theme as t } from "@/theme";
export function PartyScreen() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState(state.party[0]?.id);
  const [tab, setTab] = useState("Character");
  const [catalog, setCatalog] = useState(false);
  const c = state.party.find((c) => c.id === selected) || state.party[0];
  if (!c)
    return (
      <Guard>
        <View />
      </Guard>
    );
  const skills = SKILLS.filter((s) => catalog || c.skills.includes(s.name));
  const gear = ITEMS.filter(
    (i) =>
      ["weapon", "armor", "charm"].includes(i.kind) &&
      ((state.inventory[i.id] || 0) > 0 || c.equipment.includes(i.id)),
  );
  return (
    <Guard>
      <Frame active="Party" title="Your Party">
        <View style={{ padding: 13, gap: 13 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {state.party.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`Select ${p.name}`}
                accessibilityState={{ selected: p.id === c.id }}
                onPress={() => setSelected(p.id)}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: p.id === c.id ? t.color.blue : t.color.goldDim,
                  borderRadius: 5,
                  overflow: "hidden",
                  backgroundColor: t.color.panel,
                }}
              >
                <Atlas index={p.portrait} size={94} />
                <View style={{ padding: 5, alignItems: "center" }}>
                  <Copy
                    title
                    style={{ fontSize: 12, lineHeight: 18 }}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Copy>
                  <Copy style={{ fontSize: 11, lineHeight: 16 }}>
                    Lv. {p.level}
                  </Copy>
                  <Copy style={{ color: t.color.gold, fontSize: 12 }}>
                    ★ ★ ★
                  </Copy>
                </View>
              </Pressable>
            ))}
            {state.party.length < 4 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recruit another companion"
                onPress={() => router.push("/tavern")}
                style={{
                  width: 40,
                  borderWidth: 1,
                  borderColor: t.color.line,
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 5,
                }}
              >
                <Icon name="plus" />
              </Pressable>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 3 }}>
            {["Character", "Equipment", "Skills", "Details"].map((x) => (
              <Button
                key={x}
                small
                compact
                label={x}
                tone={tab === x ? "gold" : "dark"}
                onPress={() => setTab(x)}
                style={{ flex: 1 }}
              />
            ))}
          </View>
          {tab === "Character" ? (
            <Panel>
              <View style={{ flexDirection: "row", gap: 13 }}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <Atlas index={c.portrait} size={79} />
                    <View style={{ flex: 1 }}>
                      <Copy title style={{ fontSize: 18 }}>
                        {c.name}
                      </Copy>
                      <Copy muted style={{ fontSize: 11, lineHeight: 17 }}>
                        {c.race} {c.job}
                      </Copy>
                    </View>
                  </View>

                  <Bar
                    value={c.xp}
                    max={c.level * 70}
                    label={`Lv. ${c.level} · EXP ${c.xp}/${c.level * 70}`}
                  />
                  <Divider />
                  {[
                    ["heart", "HP", `${c.hp}/${c.maxHp}`],
                    ["sword", "ATK", c.atk],
                    ["shield", "DEF", c.def],
                    ["run-fast", "SPD", c.speed],
                    ["creation", "MP", `${c.mp}/${c.maxMp}`],
                  ].map(([icon, label, n]) => (
                    <View
                      key={String(label)}
                      style={{
                        flexDirection: "row",
                        gap: 9,
                        alignItems: "center",
                        paddingVertical: 5,
                      }}
                    >
                      <Icon
                        name={String(icon)}
                        size={17}
                        color={label === "HP" ? t.color.red : t.color.gold}
                      />
                      <Copy style={{ flex: 1, fontSize: 13 }}>{label}</Copy>
                      <Copy style={{ fontSize: 13 }}>{n}</Copy>
                    </View>
                  ))}
                </View>
                <View style={{ width: 111, gap: 8 }}>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}
                  >
                    {["weapon", "armor", "charm"].map((kind) => {
                      const item = ITEMS.find(
                        (i) => c.equipment.includes(i.id) && i.kind === kind,
                      );
                      return (
                        <Pressable
                          key={kind}
                          accessibilityRole="button"
                          accessibilityLabel={
                            item ? `View ${item.name}` : `Equip ${kind}`
                          }
                          onPress={() => setTab("Equipment")}
                        >
                          <Panel
                            style={{
                              width: 51,
                              height: 67,
                              padding: 5,
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 3,
                              borderColor: item
                                ? t.color.goldDim
                                : t.color.line,
                            }}
                          >
                            <Icon
                              name={
                                item?.icon ||
                                {
                                  weapon: "sword",
                                  armor: "tshirt-crew",
                                  charm: "ring",
                                }[kind]!
                              }
                              size={27}
                              color={item ? t.color.goldLight : t.color.muted}
                            />
                            <Copy style={{ fontSize: 9, lineHeight: 12 }}>
                              {item ? "Equipped" : "Starter"}
                            </Copy>
                          </Panel>
                        </Pressable>
                      );
                    })}
                    <Panel
                      style={{
                        width: 51,
                        height: 67,
                        padding: 5,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="anvil" size={25} />
                      <Copy style={{ fontSize: 10 }}>+{c.gear}</Copy>
                    </Panel>
                  </View>
                  <Button
                    label="Auto equip"
                    small
                    onPress={() => {
                      for (const kind of ["weapon", "armor", "charm"]) {
                        const score = (id: string) => {
                          const i = ITEMS.find((x) => x.id === id)!;
                          return (
                            (i.atk || 0) +
                            (i.def || 0) +
                            (i.resist?.amount || 0) / 3
                          );
                        };
                        const best = ITEMS.filter(
                          (i) =>
                            i.kind === kind && (state.inventory[i.id] || 0) > 0,
                        ).sort((a, b) => score(b.id) - score(a.id))[0];
                        const current = c.equipment.find(
                          (id) => ITEMS.find((i) => i.id === id)?.kind === kind,
                        );
                        if (
                          best &&
                          (!current || score(best.id) > score(current))
                        )
                          dispatch({
                            type: "EQUIP",
                            character: c.id,
                            item: best.id,
                          });
                      }
                    }}
                  />
                  <Button
                    label="Forge"
                    tone="dark"
                    small
                    onPress={() => router.push("/blacksmith")}
                  />
                </View>
              </View>
              <Divider />
              <View
                style={{ flexDirection: "row", justifyContent: "space-around" }}
              >
                {(["fire", "frost", "venom"] as const).map((element) => (
                  <View key={element} style={{ alignItems: "center", gap: 3 }}>
                    <Icon
                      name={
                        element === "fire"
                          ? "fire"
                          : element === "frost"
                            ? "snowflake"
                            : "snake"
                      }
                      color={
                        element === "fire"
                          ? "#ed8e72"
                          : element === "frost"
                            ? t.color.blue
                            : t.color.green
                      }
                      size={21}
                    />
                    <Copy style={{ fontSize: 11 }}>
                      {resist(c, element)}% resistance
                    </Copy>
                  </View>
                ))}
              </View>
            </Panel>
          ) : tab === "Equipment" ? (
            <>
              <Eyebrow>{c.name}’S EQUIPMENT</Eyebrow>
              {gear.length ? (
                gear.map((item) => {
                  const equipped = c.equipment.includes(item.id);
                  return (
                    <Panel key={item.id} style={{ gap: 10 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <Icon name={item.icon} size={35} />
                        <View style={{ flex: 1 }}>
                          <Copy title style={{ fontSize: 17 }}>
                            {item.name}
                          </Copy>
                          <Copy muted style={{ fontSize: 12 }}>
                            {item.description}
                          </Copy>
                        </View>
                      </View>
                      <Button
                        label={equipped ? "Equipped" : `Equip on ${c.name}`}
                        small
                        disabled={equipped}
                        tone={equipped ? "dark" : "blue"}
                        onPress={() =>
                          dispatch({
                            type: "EQUIP",
                            character: c.id,
                            item: item.id,
                          })
                        }
                      />
                    </Panel>
                  );
                })
              ) : (
                <Panel>
                  <Copy title>No spare equipment</Copy>
                  <Copy muted style={{ marginTop: 9 }}>
                    Buy equipment at the shop, then equip it here.
                  </Copy>
                </Panel>
              )}
              <Button
                label="Browse the market"
                icon="sack"
                onPress={() => router.push("/shop")}
              />
              {state.relic && (
                <Panel>
                  <Copy style={{ color: t.color.gold }}>
                    Dawnbringer · permanent +5 party attack
                  </Copy>
                </Panel>
              )}
            </>
          ) : tab === "Skills" ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Eyebrow>{state.essence} UNBOUND ESSENCES</Eyebrow>
                <Button
                  label={catalog ? "Learned only" : "View all skills"}
                  small
                  tone="dark"
                  onPress={() => setCatalog(!catalog)}
                />
              </View>
              {skills.map((skill) => {
                const known = c.skills.includes(skill.name);
                return (
                  <Panel
                    key={skill.name}
                    style={{
                      gap: 9,
                      borderColor: known ? skill.color : t.color.line,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <Icon name={skill.icon} color={skill.color} size={33} />
                      <View style={{ flex: 1 }}>
                        <Copy title style={{ fontSize: 16 }}>
                          {skill.name}
                        </Copy>
                        <Copy style={{ fontSize: 10, color: skill.color }}>
                          {skill.passive
                            ? "PASSIVE"
                            : `${skill.cost} MP · ${skill.cooldown || 0}t cooldown`}
                        </Copy>
                      </View>
                    </View>
                    <Copy muted style={{ fontSize: 12 }}>
                      {skill.description}
                    </Copy>
                    {!known && (
                      <Button
                        label="Bind · 1 boss essence"
                        small
                        tone="blue"
                        disabled={state.essence < 1}
                        onPress={() =>
                          dispatch({
                            type: "LEARN",
                            skill: skill.name,
                            id: c.id,
                          })
                        }
                      />
                    )}
                  </Panel>
                );
              })}
              <Copy muted style={{ fontSize: 11, textAlign: "center" }}>
                Bosses on Floors 3, 6, 9 and 12 grant skill essences.
              </Copy>
            </>
          ) : (
            <Panel>
              <Eyebrow>COMPANION RECORD</Eyebrow>
              <Copy title style={{ marginTop: 8 }}>
                {c.name} of Stormhold
              </Copy>
              <Divider />
              <Copy>{RACES.find((r) => r.id === c.race)?.description}</Copy>
              <Divider />
              <Icon
                name={c.traitRevealed ? "star-four-points" : "lock-outline"}
                color={c.traitRevealed ? t.color.gold : t.color.muted}
                size={30}
              />
              <Copy title style={{ fontSize: 17, marginTop: 7 }}>
                {c.traitRevealed ? c.trait : "A hidden talent"}
              </Copy>
              <Copy muted style={{ fontSize: 13, marginTop: 7 }}>
                {c.traitRevealed
                  ? {
                      "Blood Rage": "Deal 25% more damage below 40% HP.",
                      "Last Stand": "Gain 8 defense below 35% HP.",
                      "Moon Sight": "Attacks ignore half enemy armor.",
                      "Iron Will": "Immune to paralysis.",
                      Vanguard:
                        "The whole party takes 15% less physical damage.",
                      "Venom Savant": "Party poison deals 50% more damage.",
                      Stoneblood: "Gain 25% venom resistance.",
                      "Reckless Heart": "Deal 35% more damage below 40% HP.",
                    }[c.trait] || "A trusted companion’s true strength."
                  : "Build trust at the tavern, or defeat a guardian together to discover this companion’s true strength."}
              </Copy>
              {c.job === "Mage" && (
                <Copy style={{ color: t.color.blue, marginTop: 14 }}>
                  A rare awakening. The 5% human magic roll succeeded.
                </Copy>
              )}
            </Panel>
          )}
          {c.id !== "hero" && (
            <Button
              label={`Let ${c.name} wait at the tavern`}
              tone="dark"
              small
              onPress={() => dispatch({ type: "BENCH", id: c.id })}
            />
          )}
          <Button
            label="Find new companions"
            tone="dark"
            onPress={() => router.push("/tavern")}
          />
        </View>
      </Frame>
    </Guard>
  );
}

export function BlacksmithScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState("Temper");
  const [selected, setSelected] = useState(state.party[0]?.id);
  const c = state.party.find((c) => c.id === selected) || state.party[0];
  return (
    <Guard>
      <Frame background={art.forge} active="Home" title="The Blacksmith">
        <View style={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 7 }}>
            {["Temper", "Refine"].map((x) => (
              <Button
                key={x}
                label={x}
                small
                tone={tab === x ? "gold" : "dark"}
                style={{ flex: 1 }}
                onPress={() => setTab(x)}
              />
            ))}
          </View>
          {tab === "Temper" ? (
            <>
              <Eyebrow>PERMANENT WEAPON UPGRADES</Eyebrow>
              <Copy muted>
                Every temper adds 6 attack and 2 defense, even when you change
                equipment.
              </Copy>
              {state.party.map((c) => (
                <Panel key={c.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 13,
                      alignItems: "center",
                    }}
                  >
                    <Atlas index={c.portrait} size={64} />
                    <View style={{ flex: 1 }}>
                      <Copy title>{c.name}</Copy>
                      <Copy muted style={{ fontSize: 12 }}>
                        {c.job} · Temper +{c.gear}
                      </Copy>
                      <Copy style={{ fontSize: 12, color: t.color.gold }}>
                        ATK {c.atk} · DEF {c.def}
                      </Copy>
                    </View>
                    <Icon name="sword" size={34} />
                  </View>
                  <Divider />
                  <Button
                    label={`Upgrade · ${120 + c.gear * 80} gold`}
                    disabled={state.gold < 120 + c.gear * 80}
                    onPress={() => dispatch({ type: "FORGE", id: c.id })}
                  />
                </Panel>
              ))}
            </>
          ) : (
            <>
              <Eyebrow>CRYSTAL REFINEMENT</Eyebrow>
              <Copy muted style={{ fontSize: 13 }}>
                The forge can bind elemental wards from 30 crystals and 100
                gold. Boss essences unlock the full skill catalog for free.
              </Copy>
              <View style={{ flexDirection: "row", gap: 5 }}>
                {state.party.map((p) => (
                  <Button
                    key={p.id}
                    label={p.name}
                    small
                    style={{ flex: 1 }}
                    tone={selected === p.id ? "blue" : "dark"}
                    onPress={() => setSelected(p.id)}
                  />
                ))}
              </View>
              {SKILLS.filter(
                (s) => s.passive && s.name !== "Inspiring Presence",
              ).map((skill) => (
                <Panel
                  key={skill.name}
                  style={{ gap: 10, borderColor: skill.color }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <Icon name={skill.icon} size={35} color={skill.color} />
                    <View style={{ flex: 1 }}>
                      <Copy title style={{ fontSize: 17 }}>
                        {skill.name}
                      </Copy>
                      <Copy muted style={{ fontSize: 12 }}>
                        {skill.description}
                      </Copy>
                    </View>
                  </View>
                  <Button
                    label={
                      c?.skills.includes(skill.name)
                        ? "Already bound"
                        : "Refine · 30 crystals + 100 gold"
                    }
                    small
                    tone="blue"
                    disabled={
                      state.gems < 30 ||
                      state.gold < 100 ||
                      c?.skills.includes(skill.name)
                    }
                    onPress={() =>
                      dispatch({ type: "ENCHANT", id: c.id, skill: skill.name })
                    }
                  />
                </Panel>
              ))}
            </>
          )}
        </View>
      </Frame>
    </Guard>
  );
}

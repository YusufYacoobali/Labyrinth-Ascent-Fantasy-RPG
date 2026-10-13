import React, { useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
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
import { RECIPES } from "@/game/town-content";
import { ITEMS, GEAR_KINDS } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import {
  Surface,
  TabStrip,
  Ornament,
  ItemGlyph,
} from "@/components/native-chrome";
import { theme as t } from "@/theme";
import { SceneImage } from "@/components/scene-motion";
export function PartyScreen() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState(state.party[0]?.id);
  const [tab, setTab] = useState("Character");
  const [catalog, setCatalog] = useState(false);
  const { width } = useWindowDimensions();
  const portraitSize =
    (Math.min(width, 460) - 44) / Math.max(4, state.party.length);
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
      (GEAR_KINDS as readonly string[]).includes(i.kind) &&
      ((state.inventory[i.id] || 0) > 0 || c.equipment.includes(i.id)),
  );
  return (
    <Guard>
      <Frame active="Party" title="Your Party">
        <View style={{ padding: 10, gap: 10 }}>
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
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: p.id === c.id ? "#92d4ff" : t.color.goldDim,
                  borderRadius: 5,
                  overflow: "hidden",
                  backgroundColor: t.color.panel,
                  boxShadow: p.id === c.id ? "0 0 7px #399cff88" : undefined,
                }}
              >
                <Atlas index={p.portrait} size={portraitSize} />
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
          <TabStrip
            tabs={["Character", "Equipment", "Skills", "Details"]}
            active={tab}
            onChange={setTab}
          />
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
                    [
                      "star-four-points",
                      "CRIT",
                      Math.round(
                        Math.min(0.26, 0.06 + Math.max(0, c.speed) * 0.005) *
                          100,
                      ) + "%",
                    ],
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
                <View style={{ width: width < 370 ? 144 : 164, gap: 8 }}>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}
                  >
                    {GEAR_KINDS.map((kind) => {
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
                              width: width < 370 ? 68 : 78,
                              height: 88,
                              padding: 5,
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 3,
                              borderColor: item
                                ? t.color.goldDim
                                : t.color.line,
                            }}
                          >
                            {item ? (
                              <ItemGlyph id={item.id} size={49} />
                            ) : (
                              <Icon
                                name={
                                  {
                                    weapon: "sword",
                                    armor: "tshirt-crew",
                                    charm: "ring",
                                    helmet: "helmet",
                                    boots: "shoe-print",
                                  }[kind]!
                                }
                                size={43}
                                color={t.color.muted}
                              />
                            )}
                            <Copy
                              numberOfLines={1}
                              style={{ fontSize: 11, lineHeight: 14 }}
                            >
                              {item
                                ? item.atk
                                  ? `ATK +${item.atk}`
                                  : item.def
                                    ? `DEF +${item.def}`
                                    : item.speed
                                      ? `SPD +${item.speed}`
                                      : item.resist
                                        ? `${item.resist.amount}% ${item.resist.element}`
                                        : item.name
                                : "Starter"}
                            </Copy>
                          </Panel>
                        </Pressable>
                      );
                    })}
                    <Panel
                      style={{
                        width: width < 370 ? 68 : 78,
                        height: 88,
                        padding: 5,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="anvil" size={39} />
                      <Copy style={{ fontSize: 10 }}>+{c.gear}</Copy>
                    </Panel>
                  </View>
                  <Button
                    label="Auto equip"
                    small
                    onPress={() => {
                      for (const kind of GEAR_KINDS) {
                        const score = (id: string) => {
                          const i = ITEMS.find((x) => x.id === id)!;
                          return (
                            (i.atk || 0) +
                            (i.def || 0) * 1.2 +
                            (i.hp || 0) / 8 +
                            (i.mp || 0) / 6 +
                            (i.speed || 0) * 0.7 +
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
                        <ItemGlyph id={item.id} size={57} />
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
              {c.id !== "hero" && (
                <Copy style={{ fontSize: 13, color: t.color.gold }}>
                  Agreed share: {state.contracts[c.id] || 0}% of gold finds
                </Copy>
              )}
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
              {c.job === "Mage" && c.id === "hero" && (
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
  const [tab, setTab] = useState("Upgrade");
  const [selected, setSelected] = useState(state.party[0]?.id);
  const c = state.party.find((p) => p.id === selected) || state.party[0];
  if (!c)
    return (
      <Guard>
        <View />
      </Guard>
    );
  const weapon = ITEMS.find(
    (i) => c.equipment.includes(i.id) && i.kind === "weapon",
  );
  const cost = 120 + c.gear * 80;
  return (
    <Guard>
      <Frame active="Home" title="Ironbell Forge" portrait={c.portrait}>
        <TabStrip
          tabs={["Upgrade", "Craft", "Enhance"]}
          active={tab}
          onChange={setTab}
        />
        <View
          style={{
            flexDirection: "row",
            gap: 7,
            padding: 9,
            alignItems: "flex-start",
          }}
        >
          <View style={{ width: 66, gap: 7 }}>
            {state.party.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={"Forge for " + p.name}
                accessibilityState={{ selected: c.id === p.id }}
                onPress={() => setSelected(p.id)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Surface
                  selected={c.id === p.id}
                  style={{ alignItems: "center", padding: 3 }}
                >
                  <Atlas index={p.portrait} size={58} />
                  <Copy
                    title
                    numberOfLines={1}
                    style={{ fontSize: 16, lineHeight: 19 }}
                  >
                    {p.name}
                  </Copy>
                  <Copy style={{ fontSize: 11, lineHeight: 15 }}>
                    Lv. {p.level}
                  </Copy>
                </Surface>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <SceneImage
              source={art.forgeScene}
              contentFit="fill"
              style={{ width: "100%", aspectRatio: 1.5, borderRadius: 4 }}
              accessibilityLabel="Bram: Good equipment keeps good people alive."
            />
            {tab === "Upgrade" ? (
              <Surface style={{ padding: 12, gap: 9 }}>
                <View
                  style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
                >
                  <Surface
                    style={{
                      width: 61,
                      height: 67,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon name="sword" size={48} />
                    <Copy style={{ fontSize: 12 }}>+{c.gear}</Copy>
                  </Surface>
                  <View style={{ flex: 1 }}>
                    <Copy title style={{ fontSize: 20, lineHeight: 23 }}>
                      {weapon?.name || "Wanderer’s Blade"}
                    </Copy>
                    <Copy style={{ color: t.color.green }}>
                      +{c.gear} → +{c.gear + 1}
                    </Copy>
                  </View>
                </View>
                <Ornament />
                {[
                  ["ATK", c.atk, c.atk + 6],
                  ["DEF", c.def, c.def + 2],
                  ["SPD", c.speed, c.speed],
                ].map(([label, before, after]) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Copy>{label}</Copy>
                    <Copy>
                      {before} →{" "}
                      <Copy
                        style={{
                          color:
                            before === after ? t.color.text : t.color.green,
                        }}
                      >
                        {after}
                      </Copy>
                    </Copy>
                  </View>
                ))}
                <Ornament />
                <Copy title style={{ fontSize: 18, textAlign: "center" }}>
                  Required Materials
                </Copy>
                <Surface style={{ padding: 8, alignItems: "center", gap: 4 }}>
                  <Icon name="gold" size={35} />
                  <Copy
                    style={{
                      color: state.gold >= cost ? t.color.gold : t.color.red,
                    }}
                  >
                    {state.gold.toLocaleString()}/{cost} gold
                  </Copy>
                </Surface>
                <Button
                  label={"Upgrade · " + cost + " gold"}
                  disabled={state.gold < cost}
                  onPress={() => dispatch({ type: "FORGE", id: c.id })}
                />
                <Copy muted style={{ fontSize: 11, lineHeight: 15 }}>
                  Tempering stays with {c.name} when equipment changes.
                </Copy>
              </Surface>
            ) : tab === "Craft" ? (
              <>
                {RECIPES.map((recipe) => {
                  const item = ITEMS.find((i) => i.id === recipe.id)!;
                  return (
                    <Surface key={item.id} style={{ padding: 12, gap: 8 }}>
                      <ItemGlyph id={item.id} size={43} />
                      <Copy title style={{ fontSize: 19 }}>
                        {item.name}
                      </Copy>
                      <Copy>{item.description}</Copy>
                      <Copy muted style={{ fontSize: 12 }}>
                        {recipe.materials
                          .map(
                            (m) =>
                              m.quantity +
                              " " +
                              ITEMS.find((i) => i.id === m.id)!.name,
                          )
                          .join(" · ")}{" "}
                        · {recipe.gold} gold
                      </Copy>
                      <Copy style={{ fontSize: 12, color: t.color.gold }}>
                        {recipe.materials
                          .map(
                            (m) =>
                              (state.inventory[m.id] || 0) +
                              "/" +
                              m.quantity +
                              " " +
                              ITEMS.find((i) => i.id === m.id)!.name,
                          )
                          .join(" · ")}{" "}
                        · Owned {state.inventory[item.id] || 0}
                      </Copy>
                      <Button
                        label={
                          state.bestFloor < (recipe.floor || 0)
                            ? "Unlock at Floor " + recipe.floor
                            : "Craft"
                        }
                        small
                        disabled={
                          state.gold < recipe.gold ||
                          state.bestFloor < (recipe.floor || 0) ||
                          recipe.materials.some(
                            (m) => (state.inventory[m.id] || 0) < m.quantity,
                          )
                        }
                        onPress={() =>
                          dispatch({
                            type: "CRAFT",
                            id: item.id,
                          })
                        }
                      />
                      <Button
                        label={"Equip on " + c.name}
                        small
                        tone="blue"
                        disabled={!(state.inventory[item.id] || 0)}
                        onPress={() =>
                          dispatch({
                            type: "EQUIP",
                            character: c.id,
                            item: item.id,
                          })
                        }
                      />
                    </Surface>
                  );
                })}
              </>
            ) : (
              SKILLS.filter(
                (skill) => skill.passive && skill.name !== "Inspiring Presence",
              ).map((skill) => (
                <Surface key={skill.name} style={{ padding: 12, gap: 8 }}>
                  <Icon name={skill.icon} size={36} color={skill.color} />
                  <Copy title style={{ fontSize: 19 }}>
                    {skill.name}
                  </Copy>
                  <Copy muted style={{ fontSize: 13 }}>
                    {skill.description}
                  </Copy>
                  <Button
                    label={
                      c.skills.includes(skill.name)
                        ? "Bound"
                        : "Enhance · 30 crystals + 100g"
                    }
                    small
                    tone="blue"
                    disabled={
                      state.gems < 30 ||
                      state.gold < 100 ||
                      c.skills.includes(skill.name)
                    }
                    onPress={() =>
                      dispatch({ type: "ENCHANT", id: c.id, skill: skill.name })
                    }
                  />
                </Surface>
              ))
            )}
          </View>
        </View>
      </Frame>
    </Guard>
  );
}

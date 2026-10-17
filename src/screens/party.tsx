import {
  StoryLeads,
  StoryScene,
  CompanionRelationships,
} from "@/components/story-journal";
import { SkillLibrary } from "@/components/skill-library";
import { formationOf } from "@/game/combat-commands";
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
import { RACES, resist } from "@/game/engine";
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
import { temperingOffer } from "@/game/town-progression";
import { CharacterStatValue } from "@/components/character-stat-value";
export function PartyScreen() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState(state.party[0]?.id);
  const [tab, setTab] = useState("Character");
  const [catalog, setCatalog] = useState(false);
  const { width } = useWindowDimensions();
  const portraitSize = Math.min(
    132,
    (Math.min(width, 460) -
      22 -
      6 * (state.party.length + (state.party.length < 4 ? 1 : 0) - 1) -
      (state.party.length < 4 ? 40 : 0)) /
      Math.max(1, state.party.length),
  );
  const c = state.party.find((c) => c.id === selected) || state.party[0];
  if (!c)
    return (
      <Guard>
        <View />
      </Guard>
    );
  const gear = ITEMS.filter(
    (i) =>
      (GEAR_KINDS as readonly string[]).includes(i.kind) &&
      ((state.inventory[i.id] || 0) > 0 || c.equipment.includes(i.id)),
  );
  return (
    <Guard>
      <Frame active="Party" title="Your Party">
        {["town", "camp", "exploration", "victory"].includes(state.phase) && (
          <Panel style={{ margin: 10, gap: 6 }}>
            <Copy muted style={{ fontSize: 13 }}>
              Front draws most attacks. Back is safer for healers and ranged
              allies.
            </Copy>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {(["front", "back"] as const).map((formation) => (
                <Button
                  key={formation}
                  small
                  icon={formation === "front" ? "shield" : "bow-arrow"}
                  style={{ flex: 1 }}
                  tone={formationOf(c) === formation ? "blue" : "dark"}
                  label={formation === "front" ? "Front" : "Back"}
                  onPress={() =>
                    dispatch({ type: "SET_FORMATION", id: c.id, formation })
                  }
                />
              ))}
            </View>
          </Panel>
        )}
        {state.phase === "story" ? (
          <StoryScene />
        ) : (
          <View style={{ padding: 10, gap: 10 }}>
            <CompanionRelationships id={c.id} />
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
            {!!c.injuries && (
              <Panel style={{ gap: 7 }}>
                <Copy title>
                  {c.injuries} {c.injuries === 1 ? "injury" : "injuries"}
                </Copy>
                <Copy>
                  Maximum HP −{c.injuries * 10}% · speed −{c.injuries}.{" "}
                  {3 - (c.recoveryDays || 0)} town days until one heals.
                </Copy>
                <Button
                  small
                  label={`Treat one injury · ${100 * c.level} gold`}
                  disabled={state.gold < 100 * c.level}
                  onPress={() => dispatch({ type: "TREAT_INJURY", id: c.id })}
                />
              </Panel>
            )}
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
                    {(
                      [
                        [
                          "heart",
                          "HP",
                          <CharacterStatValue
                            key="hp"
                            character={c}
                            stat="maxHp"
                            current={c.hp}
                            style={{ fontSize: 13 }}
                          />,
                        ],
                        [
                          "sword",
                          "ATK",
                          <CharacterStatValue
                            key="atk"
                            character={c}
                            stat="atk"
                            style={{ fontSize: 13 }}
                          />,
                        ],
                        [
                          "shield",
                          "DEF",
                          <CharacterStatValue
                            key="def"
                            character={c}
                            stat="def"
                            style={{ fontSize: 13 }}
                          />,
                        ],
                        [
                          "run-fast",
                          "SPD",
                          <CharacterStatValue
                            key="speed"
                            character={c}
                            stat="speed"
                            style={{ fontSize: 13 }}
                          />,
                        ],
                        [
                          "creation",
                          "MP",
                          <CharacterStatValue
                            key="mp"
                            character={c}
                            stat="maxMp"
                            current={c.mp}
                            style={{ fontSize: 13 }}
                          />,
                        ],
                        [
                          "star-four-points",
                          "CRIT",
                          Math.round(
                            Math.min(
                              0.26,
                              0.06 + Math.max(0, c.speed) * 0.005,
                            ) * 100,
                          ) + "%",
                        ],
                      ] as const
                    ).map(([icon, label, n]) => (
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
                                  : kind === "armor"
                                    ? "Armor"
                                    : kind === "helmet"
                                      ? "Head"
                                      : kind === "charm"
                                        ? "Charm"
                                        : kind === "boots"
                                          ? "Boots"
                                          : "Weapon"}
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
                              i.kind === kind &&
                              (state.inventory[i.id] || 0) > 0,
                          ).sort((a, b) => score(b.id) - score(a.id))[0];
                          const current = c.equipment.find(
                            (id) =>
                              ITEMS.find((i) => i.id === id)?.kind === kind,
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
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                  }}
                >
                  {(["fire", "frost", "venom"] as const).map((element) => (
                    <View
                      key={element}
                      style={{ alignItems: "center", gap: 3 }}
                    >
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
                <Button
                  label={catalog ? "Learned and available" : "View all skills"}
                  small
                  tone="dark"
                  onPress={() => setCatalog(!catalog)}
                />
                <SkillLibrary characterId={c.id} catalog={catalog} />
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
            <StoryLeads />
            <Button
              label="Find new companions"
              tone="dark"
              onPress={() => router.push("/tavern")}
            />
          </View>
        )}
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
  const offer = temperingOffer(state, c);
  const cost = offer.gold;
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
                    {weapon ? (
                      <ItemGlyph id={weapon.id} size={48} />
                    ) : (
                      <Icon name="hand-back-right-outline" size={40} />
                    )}
                    <Copy style={{ fontSize: 12 }}>+{c.gear}</Copy>
                  </Surface>
                  <View style={{ flex: 1 }}>
                    <Copy title style={{ fontSize: 20, lineHeight: 23 }}>
                      {weapon?.name || "No weapon equipped"}
                    </Copy>
                    <Copy style={{ color: t.color.green }}>
                      {offer.gold > 0
                        ? `+${c.gear} → +${c.gear + 1}`
                        : `+${c.gear} · Complete`}
                    </Copy>
                  </View>
                </View>
                <Ornament />
                {(
                  [
                    ["ATK", "atk", offer.attack],
                    ["DEF", "def", offer.defense],
                    ["SPD", "speed", 0],
                  ] as const
                ).map(([label, stat, increase]) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Copy>{label}</Copy>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 7,
                        alignItems: "center",
                      }}
                    >
                      <CharacterStatValue character={c} stat={stat} />
                      {increase > 0 && (
                        <>
                          <Copy muted>→</Copy>
                          <CharacterStatValue
                            character={c}
                            stat={stat}
                            additionalBonus={increase}
                          />
                        </>
                      )}
                    </View>
                  </View>
                ))}
                <Ornament />
                <Copy title style={{ fontSize: 18, textAlign: "center" }}>
                  Upgrade cost
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
                {!!offer.reason && <Copy muted>{offer.reason}</Copy>}
                <Button
                  label={
                    offer.gold > 0
                      ? "Upgrade · " + cost + " gold"
                      : "Tempering complete"
                  }
                  disabled={!offer.available}
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
                        {[
                          ...recipe.materials.map(
                            (m) =>
                              m.quantity +
                              " " +
                              ITEMS.find((i) => i.id === m.id)!.name,
                          ),
                          `${recipe.gold} gold`,
                        ].join(" · ")}
                      </Copy>
                      <Copy style={{ fontSize: 12, color: t.color.gold }}>
                        {[
                          ...recipe.materials.map(
                            (m) =>
                              (state.inventory[m.id] || 0) +
                              "/" +
                              m.quantity +
                              " " +
                              ITEMS.find((i) => i.id === m.id)!.name,
                          ),
                          `Owned ${state.inventory[item.id] || 0}`,
                        ].join(" · ")}
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
                      {recipe.essence && (
                        <Button
                          small
                          tone="blue"
                          label={`Craft with 1 ${ITEMS.find((i) => i.id === "essence-" + recipe.essence)?.name} + ${recipe.gold}g`}
                          disabled={
                            state.gold < recipe.gold ||
                            state.bestFloor < (recipe.floor || 0) ||
                            !(state.inventory["essence-" + recipe.essence] > 0)
                          }
                          onPress={() =>
                            dispatch({
                              type: "CRAFT",
                              id: recipe.id,
                              essence: true,
                            })
                          }
                        />
                      )}
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
              <View style={{ gap: 10 }}>
                <Copy>
                  Crystals refine equipment. Bind monster powers from Party →
                  Skills or in shelter.
                </Copy>
                {(["fire", "frost", "venom"] as const).map((element) => (
                  <Surface key={element} style={{ padding: 12, gap: 8 }}>
                    <Copy title>
                      {element[0].toUpperCase() + element.slice(1)} protection
                    </Copy>
                    <Copy muted>
                      Permanent +10% resistance for {c.name}, including after
                      changing gear. Once per element; resistance caps at 75%.
                    </Copy>
                    <Button
                      small
                      label={
                        c.refinements?.[element]
                          ? "Protection refined"
                          : `Refine ${element} · 30 crystals + 100g`
                      }
                      disabled={
                        c.refinements?.[element] ||
                        !c.equipment.length ||
                        state.gems < 30 ||
                        state.gold < 100
                      }
                      onPress={() =>
                        dispatch({ type: "REFINE_GEAR", id: c.id, element })
                      }
                    />
                  </Surface>
                ))}
                <Button
                  label="Manage skills in Party"
                  small
                  tone="dark"
                  onPress={() => router.push("/party")}
                />
              </View>
            )}
          </View>
        </View>
      </Frame>
    </Guard>
  );
}

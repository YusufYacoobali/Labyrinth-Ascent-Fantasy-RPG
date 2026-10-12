import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import {
  art,
  Atlas,
  Bar,
  Button,
  Choice,
  Copy,
  Eyebrow,
  Frame,
  Icon,
  Panel,
} from "@/components/game-ui";
import {
  BattleSprite,
  DamageNumber,
  Reveal,
  useCombatFeedback,
} from "@/components/combat-motion";
import {
  daysToGate,
  floorEnvironment,
  gateOpen,
  Skill,
  SKILLS,
  Action,
  Game,
  reducer,
  battleIntent,
  battleForecast,
} from "@/game/engine";
import { EVENTS, FLOORS, ITEMS, ROUTES } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { Arrival } from "./arrival";
import { theme as t } from "@/theme";
const elementColor = {
  physical: t.color.gold,
  fire: "#ed8e72",
  frost: t.color.blue,
  venom: "#91cc74",
};
const elementIcon = {
  physical: "sword",
  fire: "fire",
  frost: "snowflake",
  venom: "snake",
};

export function LabyrinthScreen() {
  const { state, dispatch } = useGame();
  const [map, setMap] = useState(false);
  const open = gateOpen(state.day);
  return (
    <Guard>
      <Frame
        background={art.labyrinth}
        active="Labyrinth"
        title="The Labyrinth"
      >
        <View
          style={{
            padding: 20,
            minHeight: 575,
            flex: 1,
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 16,
                paddingTop: 15,
              }}
            >
              <View style={{ flex: 1 }}>
                <Copy
                  title
                  style={{
                    fontSize: 57,
                    lineHeight: 68,
                    color: t.color.goldLight,
                  }}
                >
                  F1—12
                </Copy>
                <Copy title style={{ fontSize: 15 }}>
                  The Hollow Ascent
                </Copy>
                <Copy
                  style={{ fontSize: 12, fontStyle: "italic", marginTop: 12 }}
                >
                  “The higher you go,{"\n"}the more you find{"\n"}out who you
                  are.”
                </Copy>
              </View>
              <Panel
                style={{ width: 126, padding: 10, alignSelf: "flex-start" }}
              >
                <Copy style={{ fontSize: 12, textAlign: "center" }}>
                  Beyond the Gate
                </Copy>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    paddingVertical: 14,
                  }}
                >
                  <Icon name="treasure-chest" size={28} />
                  <Icon name="creation" size={28} color={t.color.blue} />
                </View>
                <Button
                  label={map ? "Hide floors" : "View floors"}
                  small
                  onPress={() => setMap(!map)}
                />
              </Panel>
            </View>
            {map && (
              <Reveal>
                <Panel style={{ marginTop: 18, gap: 10 }}>
                  {FLOORS.map((f) => (
                    <View
                      key={f.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Copy
                        style={{
                          width: 26,
                          color:
                            f.id <= state.bestFloor
                              ? t.color.green
                              : t.color.gold,
                          fontFamily: t.font.bold,
                          fontSize: 12,
                        }}
                      >
                        {String(f.id).padStart(2, "0")}
                      </Copy>
                      <View style={{ flex: 1 }}>
                        <Copy style={{ fontSize: 12, lineHeight: 17 }}>
                          {f.name}
                        </Copy>
                        <Copy muted style={{ fontSize: 10, lineHeight: 14 }}>
                          {f.id <= state.bestFloor
                            ? f.subtitle
                            : "Unknown until explored"}
                        </Copy>
                      </View>
                      <Icon
                        name={
                          f.id % 3 === 0
                            ? "skull"
                            : f.id === 4
                              ? "directions-fork"
                              : "stairs-up"
                        }
                        size={17}
                      />
                    </View>
                  ))}
                </Panel>
              </Reveal>
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Panel style={{ gap: 10 }}>
              {[
                ["account-group", "Recommended party", "3–4 companions"],
                ["stairs-up", "Highest floor", String(state.bestFloor)],
                ["sack", "Rations", `${state.food} · 3 for entry`],
                ["bottle-tonic-plus", "Healing potions", String(state.potions)],
              ].map(([icon, label, n]) => (
                <View
                  key={label}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Icon name={icon} size={18} />
                  <Copy style={{ flex: 1, fontSize: 12 }}>{label}</Copy>
                  <Copy style={{ fontSize: 12 }}>{n}</Copy>
                </View>
              ))}
            </Panel>
            <Panel
              style={{
                alignItems: "center",
                gap: 4,
                borderColor: t.color.goldDim,
              }}
            >
              <Eyebrow>
                {open
                  ? "THE GATE IS OPEN"
                  : `OPENS IN ${daysToGate(state.day)} DAYS`}
              </Eyebrow>
            </Panel>
            <Button
              label={open ? "Begin expedition" : "Prepare for expedition"}
              icon="gate"
              onPress={() => {
                if (!open) {
                  router.push("/guild");
                  return;
                }
                dispatch({ type: "ENTER" });
                if (state.food >= 3 && state.party.some((c) => c.hp > 0))
                  router.replace("/expedition");
              }}
            />
            <Button
              label={open ? "Buy more supplies" : "Rest at the inn · +1 day"}
              tone="dark"
              onPress={() =>
                open ? router.push("/shop") : dispatch({ type: "REST" })
              }
            />
          </View>
        </View>
      </Frame>
    </Guard>
  );
}

function Combat({
  feedback,
}: {
  feedback: ReturnType<typeof useCombatFeedback>;
}) {
  const { state: savedState, dispatch } = useGame();
  const [preview, setPreview] = useState<Game | null>(null);
  const state = preview || savedState;
  const pending = !!preview;
  const reduced = useReducedMotion();
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
    },
    [],
  );
  const [selected, setSelected] = useState(
    state.party.find((c) => c.hp > 0)?.id,
  );
  const [menu, setMenu] = useState<"skill" | "item" | null>(null);
  const [retreat, setRetreat] = useState(false);
  const e = state.enemy!;
  const actor =
    state.party.find((c) => c.id === selected && c.hp > 0) ||
    state.party.find((c) => c.hp > 0) ||
    state.party[0];
  const intent = battleIntent(state);
  const forecast = battleForecast(state);
  const heavy = intent.kind === "heavy";
  const expectedHits = Object.values(forecast);
  const targetNames = Object.keys(forecast)
    .map((id) => state.party.find((c) => c.id === id)?.name)
    .join(", ");
  const incoming =
    expectedHits.length > 1
      ? `All allies · ${Math.min(...expectedHits)}–${Math.max(...expectedHits)} HP`
      : expectedHits.length
        ? `${targetNames} · ${expectedHits[0]} HP`
        : intent.kind === "charge"
          ? "Heavy attack next turn"
          : "No incoming attack";
  const act = (
    kind: "attack" | "skill" | "item" | "guard" | "focus" | "burst",
    skill?: Skill,
    item?: string,
  ) => {
    if (pending) return;
    const action: Action = {
      type: "BATTLE",
      kind,
      actor: actor.id,
      skill,
      item,
      roll: Math.random(),
    };
    const result = reducer(savedState, action);
    if (result.effects.id !== savedState.effects.id) {
      feedback(kind === "burst" ? "skill" : kind === "focus" ? "guard" : kind);
      setPreview({ ...result, phase: "combat" });
      finishTimer.current = setTimeout(
        () => {
          dispatch(action);
          setPreview(null);
        },
        reduced ? 120 : 380,
      );
    } else dispatch(action);
    setMenu(null);
  };
  return (
    <View style={{ flex: 1, padding: 12, minHeight: 565, gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Eyebrow>{FLOORS[state.floor - 1].name}</Eyebrow>
        <Copy muted style={{ fontSize: 10 }}>
          TURN {state.turn} · {state.food} rations
        </Copy>
      </View>
      <Panel style={{ padding: 10, gap: 7 }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Icon
            name={e.boss ? "skull" : "skull-outline"}
            size={27}
            color={t.color.red}
          />
          <View style={{ flex: 1 }}>
            <Copy style={{ fontFamily: t.font.bold, fontSize: 16 }}>
              {e.name}
            </Copy>
            <Bar value={e.hp} max={e.maxHp} color={t.color.red} />
          </View>
          <Copy style={{ fontSize: 11 }}>
            {e.hp}/{e.maxHp}
          </Copy>
        </View>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Icon
            name={elementIcon[e.element]}
            color={elementColor[e.element]}
            size={15}
          />
          <Copy
            style={{
              fontSize: 11,
              color: heavy ? t.color.red : t.color.muted,
              flex: 1,
            }}
          >
            {`${heavy ? "HEAVY · " : ""}${intent.label}`}
          </Copy>
          {e.poison > 0 && (
            <Copy style={{ fontSize: 10, color: t.color.green }}>
              Venom {e.poison}t
            </Copy>
          )}
          {state.effects.stunned && (
            <Copy style={{ fontSize: 10, color: "#ccabef" }}>Interrupted</Copy>
          )}
        </View>
        <Copy
          style={{
            fontSize: 12,
            lineHeight: 17,
            color: heavy ? t.color.red : t.color.text,
          }}
        >
          {incoming}
        </Copy>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Copy muted style={{ fontSize: 10 }}>
            BREAK {e.poise}/{e.maxPoise}
          </Copy>
          <View style={{ flex: 1 }}>
            <Bar value={e.poise} max={e.maxPoise} color={t.color.gold} />
          </View>
          {e.controlWard > 0 && (
            <Copy muted style={{ fontSize: 10 }}>
              Interrupt ward {e.controlWard}t
            </Copy>
          )}
        </View>
      </Panel>
      <View
        style={{
          flex: 1,
          minHeight: 140,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: 8,
            width: 135,
            height: 18,
            borderRadius: 100,
            backgroundColor: "rgba(0,0,0,.25)",
          }}
        />
        <BattleSprite
          index={e.sprite}
          size={180}
          effect={state.effects.id}
          hit={state.effects.damage > 0 || state.effects.poisonDamage > 0}
        />
        {state.effects.damage > 0 && (
          <DamageNumber
            key={`hit-${state.effects.id}`}
            amount={state.effects.damage}
            critical={state.effects.critical}
            id={state.effects.id}
          />
        )}
        {state.effects.poisonDamage > 0 && (
          <DamageNumber
            key={`venom-${state.effects.id}`}
            amount={state.effects.poisonDamage}
            poison
            id={state.effects.id}
          />
        )}
        {state.effects.id > 0 && (
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <Copy
              style={{
                fontSize: 12,
                lineHeight: 17,
                textAlign: "center",
                color: state.effects.broken ? t.color.gold : t.color.text,
              }}
            >
              {state.log[0]}
            </Copy>
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {state.party.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Command ${c.name}`}
            accessibilityState={{
              selected: actor.id === c.id,
              disabled: c.hp <= 0,
            }}
            disabled={c.hp <= 0}
            onPress={() => {
              setSelected(c.id);
              setMenu(null);
            }}
            style={{ flex: 1 }}
          >
            <Panel
              style={{
                padding: 5,
                borderColor:
                  actor.id === c.id
                    ? t.color.blue
                    : Object.keys(forecast).includes(c.id)
                      ? t.color.red
                      : t.color.line,
                opacity: c.hp > 0 ? 1 : 0.35,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <BattleSprite
                  index={c.portrait}
                  size={57}
                  effect={state.effects.id}
                  hit={!!state.effects.targets[c.id]}
                />
              </View>
              <Copy
                numberOfLines={1}
                style={{
                  fontSize: 10,
                  lineHeight: 14,
                  textAlign: "center",
                  fontFamily: t.font.bold,
                }}
              >
                {c.name}
              </Copy>
              <Bar
                value={c.hp}
                max={c.maxHp}
                color={t.color.green}
                label={`HP ${c.hp}/${c.maxHp}`}
              />
              <View style={{ height: 4 }} />
              <Bar value={c.mp} max={c.maxMp} label={`MP ${c.mp}`} />
              <View
                style={{
                  height: 15,
                  flexDirection: "row",
                  gap: 3,
                  justifyContent: "center",
                }}
              >
                {!!c.ailments.ward && (
                  <Icon name="shield-check" size={12} color={t.color.green} />
                )}
                {c.ailments.poison > 0 && (
                  <Icon name="snake" size={12} color={t.color.green} />
                )}
                {c.ailments.paralysis > 0 && (
                  <Icon name="lightning-bolt" size={12} color="#ccabef" />
                )}
                {!!state.effects.targets[c.id] && (
                  <Copy
                    style={{
                      fontSize: 10,
                      lineHeight: 13,
                      color: t.color.red,
                    }}
                  >
                    −{state.effects.targets[c.id]}
                  </Copy>
                )}
              </View>
            </Panel>
          </Pressable>
        ))}
      </View>
      <Copy style={{ fontSize: 11, lineHeight: 15, color: t.color.gold }}>
        MOMENTUM {state.momentum}/3 · Attack, Guard or Focus: +1
      </Copy>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <Button
          label="Guard"
          icon="shield"
          tone="dark"
          small
          disabled={pending || actor.ailments.paralysis > 0}
          style={{ flex: 1 }}
          onPress={() => act("guard")}
        />
        <Button
          label="Focus"
          icon="eye"
          tone="blue"
          small
          disabled={
            pending || actor.ailments.paralysis > 0 || actor.mp === actor.maxMp
          }
          style={{ flex: 1 }}
          onPress={() => act("focus")}
        />
        <Button
          label="Burst · 2"
          icon="sword-cross"
          small
          disabled={pending || state.momentum < 2}
          style={{ flex: 1 }}
          onPress={() => act("burst")}
        />
      </View>
      <Copy muted style={{ fontSize: 11, lineHeight: 15 }}>
        Guard: half damage, protect with {actor.name}. Focus: +20 MP, allies
        strike at 55%. Burst: +35% damage, 50 break.
      </Copy>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <Button
          label="Attack"
          disabled={pending}
          small
          icon="sword"
          tone="red"
          style={{ flex: 1 }}
          onPress={() => act("attack")}
        />
        <Button
          label="Skill"
          disabled={pending}
          small
          icon="creation"
          tone="blue"
          style={{ flex: 1 }}
          onPress={() => setMenu(menu === "skill" ? null : "skill")}
        />
        <Button
          label="Item"
          disabled={pending}
          small
          icon="bottle-tonic"
          style={{ flex: 1 }}
          onPress={() => setMenu(menu === "item" ? null : "item")}
        />
        <Button
          label="Flee"
          disabled={pending}
          small
          icon="run-fast"
          tone="dark"
          style={{ flex: 1 }}
          onPress={() => setRetreat(true)}
        />
      </View>
      {menu === "skill" && (
        <Reveal>
          <Panel style={{ padding: 10, gap: 8 }}>
            <Eyebrow>{actor.name} · Skills</Eyebrow>
            <Button
              label="Guard · +4 MP · half damage"
              small
              tone="dark"
              icon="shield"
              onPress={() => act("guard")}
            />
            {actor.skills.map((name) => {
              const skill = SKILLS.find((s) => s.name === name)!;
              return (
                <Choice
                  key={name}
                  label={name}
                  detail={skill.description}
                  icon={skill.icon}
                  tone="blue"
                  trailing={
                    skill.passive
                      ? "Passive"
                      : actor.cooldowns[name]
                        ? "Ready in " + actor.cooldowns[name] + "t"
                        : skill.cost +
                          " MP · " +
                          (skill.cooldown || 0) +
                          "t cooldown"
                  }
                  disabled={
                    pending ||
                    skill.passive ||
                    actor.mp < skill.cost ||
                    actor.ailments.paralysis > 0 ||
                    (actor.cooldowns[name] || 0) > 0
                  }
                  onPress={() => act("skill", name)}
                />
              );
            })}
          </Panel>
        </Reveal>
      )}
      {menu === "item" && (
        <Reveal>
          <Panel style={{ padding: 10, gap: 7 }}>
            <Eyebrow>ONE ITEM · ONE PARTY TURN</Eyebrow>
            {["potion", "greater-potion", "antidote", "ether"].map((id) => {
              const item = ITEMS.find((i) => i.id === id)!;
              const n =
                id === "potion" ? state.potions : state.inventory[id] || 0;
              return (
                <Button
                  key={id}
                  label={`${item.name} · ${n}`}
                  small
                  tone={id === "antidote" ? "green" : "blue"}
                  icon={item.icon}
                  disabled={n < 1}
                  onPress={() => act("item", undefined, id)}
                />
              );
            })}
          </Panel>
        </Reveal>
      )}
      {retreat && (
        <Panel>
          <Copy style={{ fontSize: 13 }}>
            Return to town? The gate will close.
          </Copy>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <Button
              small
              label="Keep fighting"
              tone="dark"
              style={{ flex: 1 }}
              onPress={() => setRetreat(false)}
            />
            <Button
              small
              label="Return to town"
              style={{ flex: 1 }}
              onPress={() => {
                dispatch({ type: "RETURN" });
                router.replace("/town");
              }}
            />
          </View>
        </Panel>
      )}
    </View>
  );
}

function FloorEvent({
  feedback,
}: {
  feedback: ReturnType<typeof useCombatFeedback>;
}) {
  const { state, dispatch } = useGame();
  const event = EVENTS[FLOORS[state.floor - 1].event];
  return (
    <View
      style={{
        flex: 1,
        minHeight: 560,
        justifyContent: "flex-end",
        padding: 15,
        gap: 10,
        backgroundColor: t.color.bg,
      }}
    >
      <Image
        source={art[event.art as keyof typeof art]}
        contentFit="cover"
        style={{ width: "100%", aspectRatio: 1.2 }}
      />
      <Copy
        title
        style={{
          fontSize: 28,
          lineHeight: 32,
          textAlign: "center",
          color: t.color.goldLight,
        }}
      >
        {event.title}
      </Copy>
      <Copy style={{ fontSize: 15, lineHeight: 21, textAlign: "center" }}>
        {event.body}
      </Copy>
      {state.floor === 8 && state.encounterExamined && (
        <Copy style={{ color: t.color.green, textAlign: "center" }}>
          The blade can be removed safely.
        </Copy>
      )}
      {event.choices.map((choice) => {
        const examined =
          state.floor === 8 &&
          choice.id === "examine" &&
          state.encounterExamined;
        return (
          <Choice
            key={choice.id}
            label={choice.title}
            detail={choice.detail}
            icon={choice.icon}
            tone={choice.tone || "gold"}
            disabled={examined}
            onPress={() => {
              feedback("reward");
              dispatch({
                type: "EVENT",
                choice: choice.id,
                roll: Math.random(),
              });
            }}
          />
        );
      })}
    </View>
  );
}
function Essence({
  feedback,
}: {
  feedback: ReturnType<typeof useCombatFeedback>;
}) {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState(state.party[0]?.id);
  const offers: Skill[] =
    state.floor === 3
      ? ["Venom Fang", "Nerve Lock", "Twin Strike"]
      : state.floor === 6
        ? ["Toxic Adaptation", "Second Wind", "Winter Veil"]
        : state.floor === 9
          ? ["Ember Ward", "Inspiring Presence", "Second Wind"]
          : ["Nerve Lock", "Inspiring Presence", "Ember Ward"];
  return (
    <View
      style={{
        padding: 20,
        gap: 13,
        minHeight: 555,
        justifyContent: "flex-end",
      }}
    >
      <View style={{ alignItems: "center", gap: 5 }}>
        <Icon name="creation" size={43} />
        <Eyebrow>GUARDIAN DEFEATED</Eyebrow>
        <Copy title style={{ fontSize: 27, color: t.color.goldLight }}>
          Inherit its essence
        </Copy>
        <Copy style={{ fontSize: 13, textAlign: "center" }}>
          Choose a companion and one permanent skill.
        </Copy>
      </View>
      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
        {state.party.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Give essence to ${c.name}`}
            accessibilityState={{ selected: selected === c.id }}
            onPress={() => setSelected(c.id)}
            style={{
              borderWidth: 1,
              borderColor: selected === c.id ? t.color.gold : t.color.line,
              borderRadius: 4,
              padding: 4,
              alignItems: "center",
            }}
          >
            <Atlas index={c.portrait} size={61} />
            <Copy style={{ fontSize: 11 }}>{c.name}</Copy>
          </Pressable>
        ))}
      </View>
      {offers.map((name) => {
        const skill = SKILLS.find((x) => x.name === name)!;
        const known = state.party
          .find((c) => c.id === selected)
          ?.skills.includes(name);
        return (
          <Choice
            key={name}
            label={name + (known ? " · Learned" : "")}
            detail={skill.description}
            icon={skill.icon}
            tone="gold"
            disabled={known}
            onPress={() => {
              feedback("reward");
              dispatch({ type: "LEARN", id: selected, skill: name });
            }}
          />
        );
      })}
      <Button
        label="Store essence for later"
        tone="dark"
        small
        onPress={() => dispatch({ type: "DEFER" })}
      />
    </View>
  );
}
function Victory() {
  const { state, dispatch } = useGame();
  const final = state.floor === 12;
  return (
    <View
      style={{
        padding: 20,
        gap: 14,
        minHeight: 550,
        flex: 1,
        justifyContent: "flex-end",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        {state.party.map((c) => (
          <Atlas key={c.id} sprite index={c.portrait} size={73} />
        ))}
      </View>
      <Reveal>
        <View style={{ alignItems: "center" }}>
          <Icon name={final ? "crown" : "trophy-outline"} size={39} />
          <Copy
            title
            style={{ fontSize: 42, lineHeight: 52, color: t.color.goldLight }}
          >
            {final ? "Legend" : "Victory"}
          </Copy>
          <Copy title style={{ fontSize: 16, color: t.color.gold }}>
            {final ? state.ending : `Floor ${state.floor} conquered`}
          </Copy>
        </View>
      </Reveal>
      <Panel style={{ padding: 13, gap: 8 }}>
        {[
          ["Enemies defeated", state.runKills],
          ["Gold recovered", state.runGold],
          [
            "Party standing",
            `${state.party.filter((c) => c.hp > 0).length}/${state.party.length}`,
          ],
          ["Rations left", state.food],
          ["Boss essences", state.essence],
          [
            "Your path",
            state.route
              ? ROUTES.find((r) => r.id === state.route)!.name
              : "Not chosen yet",
          ],
        ].map(([label, n]) => (
          <View
            key={String(label)}
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Copy style={{ fontSize: 12 }}>{label}</Copy>
            <Copy style={{ fontSize: 12, color: t.color.goldLight }}>{n}</Copy>
          </View>
        ))}
      </Panel>
      <View style={{ flexDirection: "row", gap: 7 }}>
        <Button
          label="Return to town"
          tone="blue"
          small
          style={{ flex: 1 }}
          onPress={() => {
            dispatch({ type: "RETURN" });
            router.replace("/town");
          }}
        />
        <Button
          label={final ? "Ascent complete" : "Ascend further"}
          small
          style={{ flex: 1 }}
          disabled={final || state.food < 1}
          onPress={() => dispatch({ type: "CONTINUE" })}
        />
      </View>
      {state.food < 1 && !final && (
        <Copy muted style={{ fontSize: 12, textAlign: "center" }}>
          No rations remain.
        </Copy>
      )}
    </View>
  );
}
export function ExpeditionScreen() {
  const { state, dispatch } = useGame();
  const feedback = useCombatFeedback();
  if (state.phase === "town") return <Redirect href="/labyrinth" />;
  const event = EVENTS[FLOORS[state.floor - 1]?.event || "camp"];
  const background =
    state.phase === "event"
      ? art[event.art as keyof typeof art]
      : state.phase === "victory"
        ? art.cover
        : state.phase === "essence"
          ? art.treasure
          : art[floorEnvironment(state.floor, state.route) as keyof typeof art];
  const title =
    state.phase === "combat" || state.phase === "arrival"
      ? `Floor ${state.floor}`
      : state.phase === "event"
        ? "Mysterious Encounter"
        : state.phase === "essence"
          ? "A Guardian’s Essence"
          : state.phase === "defeat"
            ? "Expedition Lost"
            : "Expedition Complete";
  return (
    <Guard expedition>
      <Frame
        background={
          state.phase === "event" || state.phase === "arrival"
            ? undefined
            : background
        }
        active="Labyrinth"
        title={title}
        subtitle={
          state.route
            ? ROUTES.find((r) => r.id === state.route)?.name
            : undefined
        }
        back={false}
      >
        {state.phase === "arrival" ? (
          <Arrival key={state.floor} />
        ) : state.phase === "combat" ? (
          <Combat feedback={feedback} />
        ) : state.phase === "event" ? (
          <FloorEvent feedback={feedback} />
        ) : state.phase === "essence" ? (
          <Essence feedback={feedback} />
        ) : state.phase === "victory" ? (
          <Victory />
        ) : state.phase === "defeat" ? (
          <View
            style={{
              padding: 24,
              minHeight: 520,
              justifyContent: "flex-end",
              gap: 18,
            }}
          >
            <Icon name="skull-outline" color={t.color.red} size={60} />
            <Copy title style={{ fontSize: 28 }}>
              The darkness prevailed.
            </Copy>
            <Copy>Gold, loot, levels, and learned skills are retained.</Copy>
            <Button
              label="Return to Stormhold"
              onPress={() => {
                dispatch({ type: "RETURN" });
                router.replace("/town");
              }}
            />
          </View>
        ) : (
          <View
            style={{
              padding: 24,
              gap: 16,
              minHeight: 500,
              justifyContent: "flex-end",
            }}
          >
            <Copy title>Recover what remains</Copy>
            <Copy>Collect gold and supplies.</Copy>
            <Button
              label="Continue"
              onPress={() =>
                dispatch(
                  state.phase === "loot"
                    ? { type: "COLLECT" }
                    : { type: "ENCOUNTER", choice: "leave", roll: 1 },
                )
              }
            />
          </View>
        )}
      </Frame>
    </Guard>
  );
}

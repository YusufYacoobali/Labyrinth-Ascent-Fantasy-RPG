import { EventArt } from "@/components/story-art";
import CombatStage from "@/components/combat-stage";
import {
  battleCue,
  battleEnemyAt,
  battlePartyAt,
  cueContact,
  cueResponse,
  cueDuration,
  type CombatCue,
} from "@/game/combat-animation";
import { StoryCard } from "@/components/story-card";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  daysRemaining,
} from "@/game/engine";
import {
  MissionScene,
  NagScene,
  ExploreScene,
  BranchScene,
  CampScene,
  TeamCondition,
  RouteMap,
  MissionTracker,
} from "./exploration-scenes";
import { EVENTS, FLOORS, ITEMS, ROUTES } from "@/game/world";
import { useGame } from "@/game/provider";
import { Guard } from "./town";
import { FieldSupplies } from "@/components/field-supplies";
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
      <Frame background={art.portal} active="Labyrinth" title="The Labyrinth">
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
              <View style={{ flex: 1, minHeight: 240 }} />
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
                  {FLOORS.filter(
                    (f) =>
                      f.id <= state.bestFloor ||
                      state.knownFloors.includes(f.id),
                  ).map((f) => (
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
                            : "Known from town talk · unexplored"}
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
                  <Copy muted style={{ textAlign: "center", fontSize: 12 }}>
                    Uncharted floors remain hidden.
                  </Copy>
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

export function Combat({
  feedback,
}: {
  feedback: ReturnType<typeof useCombatFeedback>;
}) {
  const { state: savedState, dispatch } = useGame();
  const [preview, setPreview] = useState<Game | null>(null);
  const [cue, setCue] = useState<CombatCue | null>(null);
  const [impactShown, setImpactShown] = useState(false);
  const [elapsed, setElapsed] = useState(-1);
  const [responseShown, setResponseShown] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const feedbackRef = useRef(feedback);
  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const state = preview || savedState;
  const pending = !!preview;
  const blocked = pending || !sceneReady;
  const reduced = useReducedMotion();
  const viewport = useWindowDimensions();
  const safeArea = useSafeAreaInsets();
  const usableHeight = viewport.height - safeArea.top - safeArea.bottom;
  const compactBattle = usableHeight < 900;
  const smallBattle = usableHeight < 760;
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  useEffect(() => {
    if (!pendingAction) return;
    const sounds =
      (reduced ? cue?.beats?.slice(0, 1) : cue?.beats)?.map((beat) =>
        setTimeout(
          () =>
            feedbackRef.current(
              beat.kind === "skill" || beat.kind === "burst"
                ? "skill"
                : beat.kind === "focus"
                  ? "guard"
                  : beat.kind === "item"
                    ? "item"
                    : beat.kind === "guard"
                      ? "guard"
                      : "attack",
            ),
          reduced ? 0 : beat.contact,
        ),
      ) || [];
    const steps = [
      ...(cue?.beats?.flatMap((b) => [b.start, b.contact]) || []),
      cue?.poisonAt,
    ]
      .filter((at): at is number => at !== undefined)
      .map((at) =>
        setTimeout(() => setElapsed(reduced ? Infinity : at), reduced ? 0 : at),
      );
    const contact = setTimeout(
      () => setImpactShown(true),
      cueContact(cue, reduced),
    );
    const response = setTimeout(
      () => {
        setResponseShown(true);
        if (cue?.enemyAttacks) feedbackRef.current("attack");
      },
      cueResponse(cue, reduced),
    );
    const timer = setTimeout(
      () => {
        dispatch(pendingAction);
        setPreview(null);
        setPendingAction(null);
        setCue(null);
      },
      cue ? cueDuration(cue, reduced) : 280,
    );
    return () => {
      clearTimeout(timer);
      clearTimeout(contact);
      clearTimeout(response);
      steps.forEach(clearTimeout);
      sounds.forEach(clearTimeout);
    };
  }, [
    dispatch,
    pendingAction,
    reduced,
    preview?.enemy?.hp,
    cue,
    savedState.floor,
  ]);
  const [selected, setSelected] = useState(
    state.party.find((c) => c.hp > 0)?.id,
  );
  const [menu, setMenu] = useState<"skill" | "item" | null>(null);
  const [retreat, setRetreat] = useState(false);
  const e = pending
    ? battleEnemyAt(savedState, state, cue, elapsed)
    : state.enemy!;
  const activeBeat = pending
    ? cue?.beats?.find((b) => elapsed >= b.start && elapsed < b.end)
    : undefined;
  const displayedParty = pending
    ? battlePartyAt(savedState, state, cue, impactShown, responseShown)
    : state.party;
  const commandingParty = pending ? savedState.party : state.party;
  const actor =
    commandingParty.find(
      (c) => c.id === (pending ? cue?.actor : selected) && c.hp > 0,
    ) ||
    commandingParty.find((c) => c.hp > 0) ||
    commandingParty[0];
  const tacticalState = pending ? savedState : state;
  const intent = battleIntent(tacticalState);
  const interrupted =
    pending && impactShown && (state.effects.stunned || e.hp <= 0);
  const forecast = interrupted
    ? {}
    : battleForecast(tacticalState, pending && cue?.kind === "guard", actor.id);
  const heavy = intent.kind === "heavy";
  const expectedHits = Object.values(forecast);
  const targetNames = Object.keys(forecast)
    .map((id) => state.party.find((c) => c.id === id)?.name)
    .join(", ");
  const incoming =
    expectedHits.length > 1
      ? `${expectedHits.length === state.party.filter((c) => c.hp > 0).length ? "All allies" : targetNames} · ≈${Math.min(...expectedHits)}–${Math.max(...expectedHits)} HP`
      : expectedHits.length
        ? `${targetNames} · ≈${expectedHits[0]} HP`
        : intent.kind === "charge"
          ? "Heavy attack next turn"
          : "No incoming attack";
  const handleBattle = useCallback(
    (
      kind: "attack" | "skill" | "item" | "guard" | "focus" | "burst",
      skill?: Skill,
      item?: string,
    ) => {
      if (blocked) return;
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
        setPreview({ ...result, phase: "combat" });
        setCue(battleCue(savedState, result, action));
        setImpactShown(false);
        setElapsed(-1);
        setResponseShown(false);
        setPendingAction(action);
      } else dispatch(action);
      setMenu(null);
    },
    [blocked, actor.id, savedState, dispatch],
  );
  return (
    <View
      style={{
        flex: 1,
        padding: smallBattle ? 8 : 12,
        minHeight: smallBattle ? 480 : compactBattle ? 520 : 565,
        gap: smallBattle ? 4 : compactBattle ? 5 : 10,
      }}
    >
      {!smallBattle && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Eyebrow>{FLOORS[state.floor - 1].name}</Eyebrow>
          <Copy muted style={{ fontSize: 10 }}>
            TURN {tacticalState.turn} · {state.food} rations
          </Copy>
        </View>
      )}
      <Panel style={{ padding: smallBattle ? 8 : 10, gap: 7 }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Icon
            name={e.boss ? "skull" : "skull-outline"}
            size={27}
            color={t.color.red}
          />
          <View style={{ flex: 1 }}>
            <Copy
              style={{
                fontFamily: t.font.bold,
                fontSize: smallBattle ? 14 : 16,
              }}
            >
              {e.name}
              {smallBattle ? " · T" + tacticalState.turn : ""}
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
            {e.hp <= 0
              ? "Defeated"
              : interrupted
                ? "Interrupted"
                : smallBattle
                  ? heavy
                    ? "HEAVY · " + incoming
                    : intent.kind === "strike"
                      ? incoming
                      : intent.kind === "charge"
                        ? "Charging · Heavy attack next"
                        : intent.label
                  : `${heavy ? "HEAVY · " : ""}${intent.label}`}
          </Copy>
          {e.poison > 0 && (
            <Copy style={{ fontSize: 10, color: t.color.green }}>
              Venom {e.poison}t
            </Copy>
          )}
          {impactShown && state.effects.stunned && (
            <Copy style={{ fontSize: 10, color: "#ccabef" }}>Interrupted</Copy>
          )}
        </View>
        {!smallBattle && (
          <Copy
            style={{
              fontSize: 12,
              lineHeight: 17,
              color: heavy ? t.color.red : t.color.text,
            }}
          >
            {e.hp <= 0 ? "The chamber falls silent." : incoming}
          </Copy>
        )}
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
          minHeight: smallBattle ? 240 : compactBattle ? 280 : 340,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <CombatStage
          state={state}
          selected={actor.id}
          cue={cue}
          busy={blocked}
          onSelect={setSelected}
          onReady={onSceneReady}
          healthParty={displayedParty}
          threatened={Object.keys(forecast)}
        />
        {pending && preview?.enemy?.hp === 0 && (
          <Reveal
            delay={reduced ? 0 : (cue?.deathAt ?? cueContact(cue)) + 1160}
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
          >
            <Copy
              title
              style={{
                textAlign: "center",
                color: t.color.goldLight,
                fontSize: 27,
              }}
            >
              Victory
            </Copy>
          </Reveal>
        )}
        {pending &&
          cue?.beats
            ?.filter((b) => b.damage > 0)
            .map((beat) => (
              <DamageNumber
                key={`hit-${state.effects.id}-${beat.actor}`}
                amount={beat.damage}
                critical={state.effects.critical && beat.actor === cue.actor}
                id={state.effects.id}
                delay={reduced ? 0 : beat.contact}
                anchor={0.77}
              />
            ))}
        {pending && state.effects.poisonDamage > 0 && (
          <DamageNumber
            key={`venom-${state.effects.id}`}
            amount={state.effects.poisonDamage}
            poison
            id={state.effects.id}
            delay={reduced ? 0 : (cue?.poisonAt ?? cueContact(cue))}
            anchor={0.77}
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
                backgroundColor: "rgba(5,13,23,.8)",
                paddingVertical: 5,
                paddingHorizontal: 8,
              }}
            >
              {pending
                ? e.hp <= 0
                  ? `${e.name} is defeated.`
                  : activeBeat
                    ? `${activeBeat.name} ${activeBeat.kind === "skill" ? `uses ${pendingAction?.type === "BATTLE" ? pendingAction.skill : "a skill"}.` : activeBeat.kind === "attack" || activeBeat.kind === "burst" ? "attacks." : activeBeat.kind === "focus" ? "focuses." : activeBeat.kind === "guard" ? "guards." : "uses an item."}`
                    : responseShown
                      ? state.log[0]
                      : ""
                : state.log[0]}
            </Copy>
          </View>
        )}

        {(menu || retreat) && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 4 }]}>
            <Reveal style={{ flex: 1 }}>
              <Panel
                style={{
                  flex: 1,
                  padding: 8,
                  gap: smallBattle ? 6 : 8,
                  backgroundColor: t.color.bg,
                  borderColor: t.color.goldDim,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Eyebrow>
                    {retreat
                      ? "RETREAT"
                      : menu === "skill"
                        ? actor.name + " · Skills"
                        : "ITEM · ONE PARTY TURN"}
                  </Eyebrow>
                  {!retreat && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close combat panel"
                      onPress={() => setMenu(null)}
                      hitSlop={8}
                      style={{ padding: 5 }}
                    >
                      <Icon name="close" size={20} />
                    </Pressable>
                  )}
                </View>
                {retreat ? (
                  <View
                    style={{
                      flex: 1,
                      gap: smallBattle ? 6 : 8,
                      justifyContent: "center",
                    }}
                  >
                    <Copy style={{ fontSize: 13, lineHeight: 17 }}>
                      Fall back to shelter? Standing allies lose{" "}
                      {8 + state.floor} HP covering the retreat. The enemy still
                      guards this crossing.
                    </Copy>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Button
                        small
                        label="Keep fighting"
                        tone="dark"
                        style={{ flex: 1 }}
                        onPress={() => setRetreat(false)}
                      />
                      <Button
                        small
                        label="Find shelter"
                        style={{ flex: 1 }}
                        onPress={() => {
                          dispatch({ type: "SEEK_SHELTER" });
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <ScrollView
                    key={menu + "-" + actor.id}
                    nestedScrollEnabled
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 7, paddingBottom: 4 }}
                    indicatorStyle="white"
                    keyboardShouldPersistTaps="handled"
                  >
                    {menu === "skill"
                      ? actor.skills
                          .filter(
                            (name) =>
                              !SKILLS.find((skill) => skill.name === name)
                                ?.passive,
                          )
                          .map((name) => {
                            const skill = SKILLS.find((s) => s.name === name)!;
                            return (
                              <Choice
                                key={name}
                                label={name}
                                detail={skill.description}
                                icon={skill.icon}
                                tone="blue"
                                trailing={
                                  actor.cooldowns[name]
                                    ? "Ready in " + actor.cooldowns[name] + "t"
                                    : skill.cost +
                                      " MP\n" +
                                      (skill.cooldown || 0) +
                                      "t wait"
                                }
                                disabled={
                                  blocked ||
                                  actor.mp < skill.cost ||
                                  actor.ailments.paralysis > 0 ||
                                  (actor.cooldowns[name] || 0) > 0
                                }
                                onPress={() => handleBattle("skill", name)}
                              />
                            );
                          })
                      : [
                          "potion",
                          "greater-potion",
                          "antidote",
                          "ether",
                          "bandage",
                        ].map((id) => {
                          const item = ITEMS.find((i) => i.id === id)!;
                          const n =
                            id === "potion"
                              ? state.potions
                              : state.inventory[id] || 0;
                          const detail =
                            id === "bandage"
                              ? "+90 HP to " + actor.name + " · cleanse poison"
                              : id === "potion"
                                ? "+65 HP to each ally"
                                : id === "greater-potion"
                                  ? "+120 HP to each ally"
                                  : id === "ether"
                                    ? "+30 MP to each ally"
                                    : "Clear ailments · Ward for 2 turns";
                          return (
                            <Choice
                              key={id}
                              label={item.name}
                              detail={detail}
                              icon={item.icon}
                              tone={id === "antidote" ? "green" : "blue"}
                              trailing={"×" + n}
                              disabled={blocked || n < 1}
                              onPress={() =>
                                handleBattle("item", undefined, id)
                              }
                            />
                          );
                        })}
                  </ScrollView>
                )}
              </Panel>
            </Reveal>
          </View>
        )}
      </View>
      <Copy style={{ fontSize: 11, lineHeight: 15, color: t.color.gold }}>
        {actor.name} · Momentum {state.momentum}/3
      </Copy>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <Button
          label="Guard"
          icon="shield"
          tone="dark"
          small
          disabled={blocked || actor.ailments.paralysis > 0}
          style={{ flex: 1 }}
          onPress={() => handleBattle("guard")}
        />
        <Button
          label="Focus"
          icon="eye"
          tone="blue"
          small
          disabled={
            blocked || actor.ailments.paralysis > 0 || actor.mp === actor.maxMp
          }
          style={{ flex: 1 }}
          onPress={() => handleBattle("focus")}
        />
        <Button
          label="Burst · 2"
          icon="sword-cross"
          small
          disabled={blocked || state.momentum < 2}
          style={{ flex: 1 }}
          onPress={() => handleBattle("burst")}
        />
      </View>
      {!smallBattle && (
        <Copy
          muted
          style={{
            fontSize: smallBattle ? 10 : 11,
            lineHeight: smallBattle ? 13 : 15,
          }}
        >
          {smallBattle
            ? "Guard ½ damage · Focus +20 MP · Burst +35% / 50 break"
            : compactBattle
              ? "Guard: ½ damage, +4 MP · Focus: +20 MP · Burst: +35% damage, 50 break."
              : "Guard: half damage, protect with " +
                actor.name +
                ". Focus: +20 MP, allies strike at 55%. Burst: +35% damage, 50 break."}
        </Copy>
      )}
      <View style={{ flexDirection: "row", gap: 5 }}>
        <Button
          label="Attack"
          disabled={blocked}
          small
          icon="sword"
          tone="red"
          style={{ flex: 1 }}
          onPress={() => handleBattle("attack")}
        />
        <Button
          label="Skill"
          disabled={blocked}
          small
          icon="creation"
          tone="blue"
          style={{ flex: 1 }}
          onPress={() => {
            setMenu(menu === "skill" ? null : "skill");
            setRetreat(false);
          }}
        />
        <Button
          label="Item"
          disabled={blocked}
          small
          icon="bottle-tonic"
          style={{ flex: 1 }}
          onPress={() => {
            setMenu(menu === "item" ? null : "item");
            setRetreat(false);
          }}
        />
        <Button
          label="Flee"
          disabled={blocked}
          small
          icon="run-fast"
          tone="dark"
          style={{ flex: 1 }}
          onPress={() => {
            setMenu(null);
            setRetreat(true);
          }}
        />
      </View>
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
        justifyContent: "flex-start",
        backgroundColor: t.color.bg,
      }}
    >
      <EventArt floor={state.floor} label={event.title} />
      <StoryCard title={event.title} body={event.body}>
        {state.floor === 8 && state.encounterExamined && (
          <Copy style={{ color: t.color.green, textAlign: "center" }}>
            The blade can be removed safely.
          </Copy>
        )}
        <FieldSupplies />
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
      </StoryCard>
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
  const extracted = state.phase === "extraction";
  const final = state.floor === 12 && !!state.ending;
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
      <Reveal>
        <View style={{ alignItems: "center" }}>
          <Icon name={final ? "crown" : "trophy-outline"} size={39} />
          <Copy
            title
            style={{ fontSize: 42, lineHeight: 52, color: t.color.goldLight }}
          >
            {extracted
              ? "Homeward"
              : final
                ? "Legend"
                : state.journey.portal
                  ? "Portal Found"
                  : "Battle Won"}
          </Copy>
          <Copy title style={{ fontSize: 16, color: t.color.gold }}>
            {extracted
              ? "The return gate is open"
              : final
                ? state.ending
                : state.journey.portal
                  ? `Floor ${state.floor} · the next ascent awaits`
                  : "The team catches its breath"}
          </Copy>
        </View>
      </Reveal>
      <TeamCondition />
      {!extracted && !final && <RouteMap />}
      <MissionTracker />
      <Copy style={{ fontSize: 14, lineHeight: 20 }}>
        {extracted
          ? state.party.some((c) => c.hp <= 0)
            ? "Thirty days inside. You gather the fallen, pack the spoils, and step toward Stormhold."
            : "Thirty days inside. Your companions pack the spoils and check the final headcount. Stormhold is waiting."
          : final
            ? "The crown is yours. Find shelter while the last days pass, then take your story home."
            : state.journey.portal
              ? "The arch pulses blue. Look at the team’s condition: climb while you can, or let everyone recover in shelter."
              : "The enemy falls silent. Your companions check wounds and count supplies. The next floor is beyond a portal you still need to find."}
      </Copy>
      <Panel style={{ padding: 13, gap: 8 }}>
        {[
          ["Enemies defeated", state.runKills],
          ["Gold recovered", state.runGold],
          ["Gold found before shares", state.runGross],
          [
            "Companion shares paid",
            Object.values(state.runPaid).reduce((n, gold) => n + gold, 0),
          ],
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
        ]
          .filter(
            (_, i) =>
              (extracted || final || i < 4) &&
              (i !== 7 || state.route !== null),
          )
          .map(([label, n]) => (
            <View
              key={String(label)}
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Copy style={{ fontSize: 12 }}>{label}</Copy>
              <Copy style={{ fontSize: 12, color: t.color.goldLight }}>
                {n}
              </Copy>
            </View>
          ))}
      </Panel>
      {extracted ? (
        <Button
          label="Return to town"
          tone="blue"
          small
          onPress={() => {
            dispatch({ type: "RETURN" });
            router.replace("/town");
          }}
        />
      ) : (
        <View style={{ gap: 9 }}>
          {final && (
            <Choice
              label="Explore the summit passages"
              detail="Search the final floor before your watch ends"
              icon="map-outline"
              tone="blue"
              onPress={() => dispatch({ type: "SEARCH_PORTAL" })}
            />
          )}
          {!final && !state.journey.portal && (
            <Choice
              label="Search for the upward portal"
              detail="Choose passages; mark six crossings on your chart"
              icon="map-outline"
              tone="blue"
              onPress={() => dispatch({ type: "SEARCH_PORTAL" })}
            />
          )}
          {!final && state.journey.portal && (
            <>
              <Button
                label="Step through the upward portal"
                small
                disabled={state.food < 1}
                onPress={() => dispatch({ type: "CONTINUE" })}
              />
              <Button
                label="Search more side passages"
                small
                tone="dark"
                onPress={() => dispatch({ type: "SEARCH_PORTAL" })}
              />
            </>
          )}
          <Choice
            label="Find a safe place to rest"
            detail={`${daysRemaining(state)} days remain inside · choose how long to wait`}
            icon="campfire"
            tone="dark"
            onPress={() => dispatch({ type: "SEEK_SHELTER" })}
          />
        </View>
      )}
      {!final && !extracted && <FieldSupplies />}
      {state.food < 1 && !final && !extracted && (
        <Copy muted style={{ fontSize: 12, textAlign: "center" }}>
          No rations remain.
        </Copy>
      )}
    </View>
  );
}
export function ExpeditionScreen() {
  const { state, dispatch, ready } = useGame();
  const feedback = useCombatFeedback();
  if (!ready) return null;
  if (state.phase === "town") return <Redirect href="/labyrinth" />;
  const event = EVENTS[FLOORS[state.floor - 1]?.event || "camp"];
  const background =
    state.phase === "event"
      ? art[event.art as keyof typeof art]
      : state.phase === "victory" || state.phase === "extraction"
        ? state.phase === "victory" && state.journey.portal
          ? art.portal
          : art.sanctuary
        : state.phase === "essence"
          ? art.treasure
          : art[floorEnvironment(state.floor, state.route) as keyof typeof art];
  const title =
    state.phase === "extraction"
      ? "Expedition Complete"
      : `Floor ${state.floor}`;
  return (
    <Guard expedition>
      <Frame
        background={
          [
            "combat",
            "event",
            "arrival",
            "mission",
            "exploration",
            "branch",
            "camp",
            "nag",
          ].includes(state.phase)
            ? undefined
            : background
        }
        active="Labyrinth"
        title={title}
        subtitle={
          daysRemaining(state) === 0
            ? "Return gate open · thirty-day window complete"
            : `${daysRemaining(state)} days left inside · ${6 - (state.journey.watches % 6)} watches until dawn`
        }
        back={false}
        expedition
        hideNav
      >
        {state.phase === "nag" ? (
          <NagScene />
        ) : state.phase === "mission" ? (
          <MissionScene />
        ) : state.phase === "exploration" ? (
          <ExploreScene />
        ) : state.phase === "branch" ? (
          <BranchScene />
        ) : state.phase === "camp" ? (
          <CampScene />
        ) : state.phase === "arrival" ? (
          <Arrival key={state.floor} />
        ) : state.phase === "combat" ? (
          <Combat feedback={feedback} />
        ) : state.phase === "event" ? (
          <FloorEvent feedback={feedback} />
        ) : state.phase === "essence" ? (
          <Essence feedback={feedback} />
        ) : state.phase === "victory" || state.phase === "extraction" ? (
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
            <Copy>
              Your party cannot keep fighting. Shelter the fallen and wait for
              the return gate. The expedition’s spoils and skills are kept.
            </Copy>
            <Button
              label="Wait for the return gate"
              onPress={() => dispatch({ type: "CAMP_REST", untilClose: true })}
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

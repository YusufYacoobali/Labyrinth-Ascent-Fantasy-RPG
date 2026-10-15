import { Image } from "expo-image";
import { MOTION_SHEETS } from "./combat-sheets";
import { enemyVisual } from "@/game/combat-visuals";
import { battleCue, type CombatCue } from "@/game/combat-animation";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useGame } from "@/game/provider";
import {
  initiative,
  enemyIntent,
  validateQueue,
  type QueuedAction,
} from "@/game/round-combat";
import { SKILLS } from "@/game/combat-data";
import { Bar, Button, Copy, Eyebrow, Panel } from "./game-ui";
import CombatStage from "./combat-stage";
import { Reveal } from "./combat-motion";
import { theme as t } from "@/theme";
export default function TacticalCombat() {
  const { state, dispatch, saving } = useGame(),
    playback = state.roundPlayback;
  const source = playback?.before || state,
    combat = source.combat;
  const [cursor, setCursor] = useState(0),
    [selected, setSelected] = useState(
      source.party.find((c) => c.hp > 0 && !c.ailments.paralysis)?.id || "",
    ),
    [queue, setQueue] = useState<Record<string, QueuedAction>>({});
  const reduced = useReducedMotion(),
    ready = source.party.filter((c) => c.hp > 0 && !c.ailments.paralysis);
  const frame = playback?.events[Math.min(cursor, playback.events.length - 1)],
    party = frame?.party || source.party,
    enemies = frame?.enemies || combat?.enemies || [];
  const actor = source.party.find((c) => c.id === selected) || ready[0],
    q = actor ? queue[actor.id] : undefined;
  const onReady = useCallback(() => {}, []);
  useEffect(() => {
    if (!playback) return;
    const timer = setTimeout(
      () => {
        if (cursor >= playback.events.length - 1)
          dispatch({ type: "FINISH_PLAYBACK" });
        else setCursor((n) => n + 1);
      },
      reduced ? 50 : 450,
    );
    return () => clearTimeout(timer);
  }, [playback, cursor, reduced, dispatch]);
  const cue = useMemo(() => {
    if (
      !frame ||
      !playback ||
      ["round", "phase", "cancel", "charge", "interrupt", "recover"].includes(
        frame.kind,
      )
    )
      return null;
    const previous = playback.events[cursor - 1],
      oldParty = previous?.party || source.party,
      oldEnemies = previous?.enemies || source.combat?.enemies || [];
    const foe =
      frame.enemies.find((e) => e.id === frame.target) ||
      frame.enemies.find((e) => e.id === frame.actor) ||
      frame.enemies[0];
    const before = {
      ...source,
      party: oldParty,
      enemy: oldEnemies.find((e) => e.id === foe?.id) || foe,
    };
    const after = {
      ...source,
      party: frame.party,
      enemy: foe,
      effects: frame.effects,
    };
    const action = frame.action;
    const generated = battleCue(before, after, {
      type: "BATTLE",
      kind: action?.kind || "guard",
      actor: action?.actor,
      skill: action?.skill,
      item: action?.item,
      roll: 0.5,
    });
    if (!source.party.some((c) => c.id === frame.actor))
      return {
        ...generated,
        actor: "",
        beats: [],
        participants: [],
        enemyAttacks: frame.kind === "strike",
        enemyHit: false,
        enemyDied: false,
        targets: frame.target ? [frame.target] : [],
        responseAt: 150,
        finishAt: 950,
      } as CombatCue;
    return { ...generated, enemyAttacks: false };
  }, [frame, playback, cursor, source]);
  if (!combat)
    return (
      <Panel>
        <Copy>The encounter is being prepared.</Copy>
      </Panel>
    );
  const enemyTarget =
    enemies.find((e) => e.id === q?.target) ||
    enemies.find((e) => e.id === frame?.target) ||
    enemies.find((e) => e.id === frame?.actor) ||
    enemies.find((e) => e.hp > 0) ||
    enemies[0];
  const stage = {
    ...source,
    party,
    enemy: enemyTarget,
    combat: { ...combat, enemies },
  };
  const assign = (
    kind: QueuedAction["kind"],
    extra: Partial<QueuedAction> = {},
  ) => {
    if (!actor) return;
    setQueue((old) => ({
      ...old,
      [actor.id]: {
        actor: actor.id,
        kind,
        target:
          kind === "guard" || kind === "item"
            ? actor.id
            : enemies.find((e) => e.hp > 0)?.id,
        ...extra,
      },
    }));
  };
  const actions = ready.flatMap((c) => (queue[c.id] ? [queue[c.id]] : [])),
    request = {
      type: "ROUND" as const,
      battleId: combat.id,
      round: combat.round,
      actions,
      animate: true,
    };
  const issue = validateQueue(source, request),
    friendly = q?.kind === "guard" || q?.kind === "item";
  return (
    <View style={{ padding: 10, gap: 10, paddingBottom: 24 }}>
      <Eyebrow>
        ROUND {combat.round} · {source.momentum}/3 MOMENTUM
      </Eyebrow>
      <Copy muted style={{ fontSize: 12 }}>
        Initiative:{" "}
        {initiative(source)
          .map((c) => `${c.name} (${Math.round(c.speed)})`)
          .join(" → ")}
      </Copy>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {enemies.map((enemy) => (
          <Panel
            key={enemy.id}
            style={{
              flex: 1,
              padding: 7,
              gap: 5,
              opacity: enemy.hp > 0 ? 1 : 0.45,
              borderColor:
                enemy.id === enemyTarget?.id ? t.color.gold : t.color.goldDim,
            }}
          >
            <View
              style={{
                width: enemies.length === 3 ? 64 : 78,
                height: enemies.length === 3 ? 64 : 78,
                overflow: "hidden",
              }}
            >
              <Image
                source={MOTION_SHEETS[enemyVisual({ ...source, enemy }).key]}
                contentFit="fill"
                style={{
                  width: (enemies.length === 3 ? 64 : 78) * 8,
                  height: (enemies.length === 3 ? 64 : 78) * 6,
                }}
              />
            </View>
            <Copy title style={{ fontSize: 15 }}>
              {enemy.name}
            </Copy>
            <Bar value={enemy.hp} max={enemy.maxHp} />
            <Copy style={{ fontSize: 11 }}>
              {enemy.hp}/{enemy.maxHp} HP · {enemy.archetype}
            </Copy>
            {enemy.hp > 0 && (
              <Copy style={{ fontSize: 11, color: t.color.goldLight }}>
                Intent: {enemyIntent(source, enemy).power > 1 ? "Heavy · " : ""}
                {enemyIntent(source, enemy).label}
                {enemyIntent(source, enemy).targets.length
                  ? " → " +
                    enemyIntent(source, enemy)
                      .targets.map(
                        (id) => source.party.find((c) => c.id === id)?.name,
                      )
                      .join(", ")
                  : ""}
              </Copy>
            )}
            <Bar value={enemy.poise} max={enemy.maxPoise} />
            <Copy muted style={{ fontSize: 10 }}>
              Break {enemy.poise}/{enemy.maxPoise}
              {enemy.broken
                ? " · BROKEN"
                : enemy.controlWard
                  ? " · interrupt ward"
                  : ""}
            </Copy>
            {!!enemy.stage && (
              <Copy style={{ fontSize: 11 }}>Phase {enemy.stage + 1}</Copy>
            )}
          </Panel>
        ))}
      </View>
      <View style={{ height: 220 }}>
        <CombatStage
          state={stage}
          selected={frame?.actor || selected}
          cue={cue}
          playbackDuration={reduced ? 50 : 450}
          busy={!!playback}
          onSelect={setSelected}
          onReady={onReady}
          healthParty={party}
          threatened={[]}
        />
      </View>
      {playback ? (
        <>
          <Reveal key={frame?.id}>
            <Panel>
              <Copy>{frame?.text}</Copy>
            </Panel>
          </Reveal>
          <Button
            small
            label="Skip round playback"
            tone="dark"
            onPress={() => dispatch({ type: "FINISH_PLAYBACK" })}
          />
        </>
      ) : (
        <>
          <Copy muted style={{ fontSize: 12 }}>
            Queue one action per companion. Skills, Guard, Focus and items use
            that companion’s action.
          </Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {source.party.map((c) => (
              <Button
                key={c.id}
                small
                style={{ flexGrow: 1, minWidth: "40%" }}
                disabled={c.hp <= 0 || !!c.ailments.paralysis}
                tone={selected === c.id ? "gold" : "dark"}
                label={`${c.name} · ${c.hp} HP · ${c.mp} MP${c.ailments.paralysis ? " · impeded" : queue[c.id] ? " · queued" : ""}`}
                onPress={() => setSelected(c.id)}
              />
            ))}
          </View>
          {actor && actor.hp > 0 && !actor.ailments.paralysis && (
            <Panel style={{ gap: 8 }}>
              <Copy title>{actor.name}’s action</Copy>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                {(["attack", "guard", "focus", "burst"] as const).map(
                  (kind) => (
                    <Button
                      small
                      key={kind}
                      tone={q?.kind === kind ? "gold" : "dark"}
                      label={kind[0].toUpperCase() + kind.slice(1)}
                      onPress={() => assign(kind)}
                    />
                  ),
                )}
              </View>
              {actor.skills
                .map((name) => SKILLS.find((skill) => skill.name === name)!)
                .filter((skill) => !skill.passive)
                .map((skill) => (
                  <Button
                    key={skill.name}
                    small
                    tone={q?.skill === skill.name ? "gold" : "blue"}
                    label={`${skill.name} · ${skill.cost} MP${actor.cooldowns[skill.name] ? ` · ${actor.cooldowns[skill.name]} round cooldown` : ""}`}
                    disabled={
                      actor.mp < skill.cost || !!actor.cooldowns[skill.name]
                    }
                    onPress={() => assign("skill", { skill: skill.name })}
                  />
                ))}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                {[
                  "potion",
                  "greater-potion",
                  "ether",
                  "antidote",
                  "bandage",
                ].map((id) => {
                  const qty =
                    id === "potion"
                      ? source.potions
                      : source.inventory[id] || 0;
                  return qty > 0 ? (
                    <Button
                      small
                      key={id}
                      tone="dark"
                      label={`${id} ×${qty}`}
                      onPress={() => assign("item", { item: id })}
                    />
                  ) : null;
                })}
              </View>
              {q && q.kind !== "focus" && q.skill !== "Second Wind" && (
                <>
                  <Copy muted>Target</Copy>
                  {(friendly
                    ? source.party.filter((c) => c.hp > 0)
                    : enemies.filter((e) => e.hp > 0)
                  ).map((target) => (
                    <Button
                      key={target.id}
                      small
                      label={target.name}
                      tone={q.target === target.id ? "gold" : "dark"}
                      onPress={() =>
                        setQueue((old) => ({
                          ...old,
                          [actor.id]: { ...old[actor.id], target: target.id },
                        }))
                      }
                    />
                  ))}
                </>
              )}
              {q?.skill === "Second Wind" && (
                <Copy muted>Group healing: all standing allies.</Copy>
              )}
            </Panel>
          )}
          <Button
            small
            tone="dark"
            label="Queue remaining attacks"
            onPress={() =>
              setQueue((old) => ({
                ...old,
                ...Object.fromEntries(
                  ready
                    .filter((c) => !old[c.id])
                    .map((c) => [
                      c.id,
                      {
                        actor: c.id,
                        kind: "attack" as const,
                        target: enemies.find((e) => e.hp > 0)?.id,
                      },
                    ]),
                ),
              }))
            }
          />
          <Panel style={{ gap: 5 }}>
            {ready.map((c) => (
              <Copy key={c.id}>
                {c.name}:{" "}
                {queue[c.id]?.skill ||
                  queue[c.id]?.item ||
                  queue[c.id]?.kind ||
                  "Choose an action"}
                {queue[c.id]?.target
                  ? " → " +
                    (source.party.find((p) => p.id === queue[c.id].target)
                      ?.name ||
                      enemies.find((e) => e.id === queue[c.id].target)?.name ||
                      "")
                  : ""}
              </Copy>
            ))}
          </Panel>
          {!!state.message && (
            <Copy style={{ color: t.color.gold }}>{state.message}</Copy>
          )}
          <Copy muted style={{ fontSize: 12 }}>
            {issue ||
              "All actions validated. Enemy intents and initiative are shown above."}
          </Copy>
          <Button
            label="Confirm round"
            disabled={saving || !!issue}
            onPress={() => dispatch(request)}
          />
          <Button
            label="Retreat through a passage"
            small
            tone="dark"
            disabled={saving}
            onPress={() => dispatch({ ...request, actions: [], flee: true })}
          />
        </>
      )}
    </View>
  );
}

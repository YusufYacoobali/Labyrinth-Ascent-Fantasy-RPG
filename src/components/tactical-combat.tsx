import {
  playbackKey,
  playbackStep,
  type Playhead,
  eventPacing,
  arrivingEnemies,
  playbackSnapshot,
  actionLead,
  defeatedGold,
} from "@/game/combat-presentation";
import { eventFeedback } from "@/game/combat-audio";
import { chooseCommand } from "@/game/combat-planning";
import { conditionText, impeded } from "@/game/combat-status";
import {
  battleCue,
  cueDuration,
  cueContact,
  cueResponse,
  cueActionEnd,
  type CombatCue,
} from "@/game/combat-animation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CombatIntro from "./combat-intro";
import CombatEnemyDialog from "./combat-enemy-dialog";
import CombatCharacterDialog from "./combat-character-dialog";
import CombatOtherActions from "./combat-other-actions";
import CombatReinforcements from "./combat-reinforcements";
import { skillCost } from "@/game/build-equipment";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useGame } from "@/game/provider";
import {
  enemyIntent,
  validateQueue,
  type QueuedAction,
} from "@/game/round-combat";
import { SKILLS, SKILL_RANKS } from "@/game/combat-data";
import { skillRank } from "@/game/progression";
import { ITEMS } from "@/game/world";
import { Button, Choice, Copy, Eyebrow, Icon, Panel } from "./game-ui";
import CombatStage from "./combat-stage";
import { useBattleReadiness } from "./use-battle-readiness";
import { useCombatFeedback } from "./combat-motion";
import { theme as t } from "@/theme";

export default function TacticalCombat({
  practice,
}: {
  practice?: { customize: () => void; restart: () => void; exit: () => void };
} = {}) {
  const { state, dispatch, saving } = useGame(),
    playback = state.roundPlayback;
  const source = playback?.before || state,
    combat = source.combat;
  const [playhead, setPlayhead] = useState<Playhead>({ key: "", step: 0 }),
    [menu, setMenu] = useState<
      "skill" | "item" | "others" | "tactics" | "enemy" | "ally" | null
    >(null),
    [retreat, setRetreat] = useState(false),
    [inspected, setInspected] = useState(""),
    [inspectedAlly, setInspectedAlly] = useState(""),
    [allyTarget, setAllyTarget] = useState(""),
    [notice, setNotice] = useState(""),
    [submitting, setSubmitting] = useState(""),
    [impactFrame, setImpactFrame] = useState(""),
    [collectedGold, setCollectedGold] = useState<string[]>([]),
    [introDone, setIntroDone] = useState(
      () => !combat || combat.round > 1 || !!playback,
    ),
    [detailTab, setDetailTab] = useState<"help" | "log">("help"),
    [selected, setSelected] = useState(
      source.party.find((c) => c.hp > 0 && !impeded(c))?.id || "",
    ),
    [planState, setPlanState] = useState<{
      round: string;
      actions: Record<string, QueuedAction>;
    }>({ round: "", actions: {} });
  const roundKey = `${combat?.id}:${combat?.round}`;
  // Keep the arena mounted during playback, but never carry a plan into a new round.
  const queue = planState.round === roundKey ? planState.actions : {};
  const emptyRound = useRef("");
  const playKey = playbackKey(playback),
    cursor = playbackStep(playhead, playKey, playback?.events.length || 0);
  const viewport = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion(),
    ready = source.party.filter((c) => c.hp > 0 && !impeded(c));
  const frame = playback?.events[Math.min(cursor, playback.events.length - 1)];
  const actor = source.party.find((c) => c.id === selected) || ready[0];
  const inspectedCharacter = source.party.find((c) => c.id === inspectedAlly);
  const { ready: sceneReady, markReady: onReady } = useBattleReadiness();
  const finishIntro = useCallback(() => setIntroDone(true), []);
  const beginBattle = useCallback(() => {
    onReady();
    setIntroDone(true);
  }, [onReady]);
  const feedback = useCombatFeedback(),
    feedbackRef = useRef(feedback);
  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);
  const cue = useMemo(() => {
    if (
      !frame ||
      !playback ||
      [
        "round",
        "phase",
        "cancel",
        "charge",
        "interrupt",
        "recover",
        "summon",
        "status",
        "counter",
        "veil",
        "mark",
        "consume",
        "revive",
      ].includes(frame.kind)
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
    const action =
      frame.action ||
      (frame.kind === "retaliate"
        ? {
            kind: "skill" as const,
            actor: frame.actor,
            skill: "Ember Ward" as const,
          }
        : undefined);
    const generated = battleCue(before, after, {
      type: "BATTLE",
      kind: action?.kind === "taunt" ? "guard" : action?.kind || "guard",
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
        responseAt: 440,
        finishAt: 1200,
      } as CombatCue;
    return { ...generated, enemyAttacks: false };
  }, [frame, playback, cursor, source]);
  const nativeDuration = cue ? cueDuration(cue) : 0;
  const goldDrops = useMemo(
    () => defeatedGold(playback, cursor, collectedGold),
    [playback, cursor, collectedGold],
  );
  const { animationMs, stepMs } = eventPacing(
    frame,
    nativeDuration,
    state.combatSpeed,
    reduced,
    cue ? cueActionEnd(cue) : 0,
  );
  const impactKey = frame ? `${playKey}:${frame.id}` : "";
  const impactDelay =
    cue && !reduced
      ? Math.round(
          ((frame?.kind === "strike" ? cueResponse(cue) : cueContact(cue)) /
            nativeDuration) *
            animationMs,
        )
      : 0;
  const impactVisible = !cue || !impactDelay || impactFrame === impactKey;
  const snapshot = playbackSnapshot(playback, cursor, impactVisible);
  const party = snapshot?.party || source.party;
  const enemies = snapshot?.enemies || combat?.enemies || [];
  const arrivals = arrivingEnemies(playback, cursor);
  const arrivalNotice = !!frame && arrivals.length > 0;
  const finishPlayback = useCallback(() => {
    if (playback) {
      const ids = playback.events.flatMap((_, step) =>
        defeatedGold(playback, step).map((drop) => drop.enemyId),
      );
      if (ids.length)
        setCollectedGold((previous) => [...new Set([...previous, ...ids])]);
    }
    dispatch({ type: "FINISH_PLAYBACK" });
  }, [playback, dispatch]);
  const advancePlayback = useCallback(() => {
    if (!playback) return;
    if (goldDrops.length)
      setCollectedGold((previous) => [
        ...new Set([...previous, ...goldDrops.map((drop) => drop.enemyId)]),
      ]);
    if (cursor >= playback.events.length - 1) finishPlayback();
    else setPlayhead({ key: playKey, step: cursor + 1 });
  }, [playback, cursor, playKey, goldDrops, finishPlayback]);

  useEffect(() => {
    if (!impactDelay || !frame) return;
    const timer = setTimeout(() => setImpactFrame(impactKey), impactDelay);
    return () => clearTimeout(timer);
  }, [impactDelay, frame, impactKey]);
  useEffect(() => {
    if (frame && impactVisible) {
      const kind = eventFeedback(frame);
      if (kind) feedbackRef.current(kind);
    }
  }, [frame, impactVisible]);
  useEffect(() => {
    if (!playback || arrivalNotice) return;
    const timer = setTimeout(advancePlayback, stepMs);
    return () => clearTimeout(timer);
  }, [playback, advancePlayback, stepMs, arrivalNotice]);
  useEffect(() => {
    if (
      !combat ||
      combat.complete ||
      !introDone ||
      !sceneReady ||
      source.phase !== "combat" ||
      playback ||
      saving ||
      ready.length ||
      emptyRound.current === roundKey
    )
      return;
    emptyRound.current = roundKey;
    dispatch({
      type: "ROUND",
      battleId: combat.id,
      round: combat.round,
      actions: [],
      animate: true,
    });
  }, [
    combat,
    introDone,
    sceneReady,
    source.phase,
    playback,
    saving,
    ready.length,
    roundKey,
    dispatch,
  ]);
  if (!combat)
    return (
      <Panel>
        <Copy>The encounter is being prepared.</Copy>
      </Panel>
    );
  const enemyTarget =
    enemies.find((e) => e.id === frame?.target) ||
    enemies.find((e) => e.id === frame?.actor) ||
    enemies.find((e) => e.id === inspected && e.hp > 0) ||
    enemies.find((e) => e.hp > 0) ||
    enemies[0];
  const stage = {
    ...source,
    party,
    enemy: enemyTarget,
    combat: { ...combat, enemies },
  };
  const locked =
    !introDone ||
    !sceneReady ||
    !!playback ||
    saving ||
    submitting === roundKey;
  const canAct = !!actor && actor.hp > 0 && !impeded(actor) && !locked;
  const actions = ready.flatMap((c) => (queue[c.id] ? [queue[c.id]] : []));
  const intents = enemies.map((enemy) => ({
    enemy,
    intent: enemyIntent(source, enemy),
  }));
  const threatened = intents
    .filter(({ enemy }) => enemy.hp > 0)
    .flatMap(({ intent }) => intent.targets);
  const friend =
    source.party.find((c) => c.id === allyTarget && c.hp > 0) || actor;
  const selectActor = (id: string) => {
    if (locked) return;
    setSelected(id);
    setAllyTarget(id);
    setNotice("");
    setMenu(null);
    setRetreat(false);
  };
  const selectEnemy = (id: string) => {
    if (!locked && enemies.some((e) => e.id === id && e.hp > 0))
      setInspected(id);
  };
  const inspectEnemy = (id: string) => {
    if (locked) return;
    setInspected(id);
    setRetreat(false);
    setMenu("enemy");
  };
  const inspectCharacter = (id: string) => {
    if (locked || !source.party.some((c) => c.id === id)) return;
    setInspectedAlly(id);
    setRetreat(false);
    setMenu("ally");
  };
  const request = {
    type: "ROUND" as const,
    battleId: combat.id,
    round: combat.round,
    actions,
    animate: true,
  };
  const commit = (chosen: QueuedAction[]) => {
    if (locked) return;
    const issue = validateQueue(source, { ...request, actions: chosen });
    if (issue) {
      setNotice(issue);
      return;
    }
    setSubmitting(roundKey);
    setNotice("");
    setMenu(null);
    dispatch({ ...request, actions: chosen });
  };
  const assign = (
    kind: QueuedAction["kind"],
    extra: Partial<QueuedAction> = {},
  ) => {
    if (!canAct) return;
    const action: QueuedAction = {
      actor: actor.id,
      kind,
      target:
        kind === "item"
          ? friend?.id
          : kind === "guard" || kind === "taunt" || kind === "focus"
            ? actor.id
            : enemyTarget?.id,
      ...extra,
    };
    const plan = chooseCommand(source, queue, action);
    setPlanState({ round: roundKey, actions: plan.commands });
    if (plan.issue) {
      setNotice(plan.issue);
      return;
    }
    setNotice("");
    setMenu(null);
    if (plan.complete) commit(plan.actions);
    else if (plan.nextActor) {
      setSelected(plan.nextActor);
      setAllyTarget(plan.nextActor);
    }
  };
  const activeSkills =
    actor?.skills.flatMap((name) => {
      const skill = SKILLS.find((entry) => entry.name === name);
      return skill && !skill.passive ? [skill] : [];
    }) || [];
  const momentumLeft =
    source.momentum -
    actions.filter(
      (action) => action.kind === "burst" && action.actor !== actor?.id,
    ).length *
      2;
  const supplies = [
    "potion",
    "greater-potion",
    "ether",
    "antidote",
    "bandage",
  ].filter(
    (id) => (id === "potion" ? source.potions : source.inventory[id] || 0) > 0,
  );
  const enemyStatus = enemyTarget
    ? [
        enemyTarget.shield
          ? `Ward ${enemyTarget.shield} · full break shatters it`
          : "",
        enemyTarget.concealed
          ? "Concealed · 35% less damage; break or expose"
          : "",
        enemyTarget.counter?.turns
          ? `${enemyTarget.counter.element} counter · physical hits retaliate (${enemyTarget.counter.turns}r)`
          : "",
        enemyTarget.controlWard ? "Interrupt ward" : "",
        conditionText(enemyTarget.conditions),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const status =
    (frame ? (impactVisible ? frame.text : actionLead(frame, source)) : "") ||
    (saving ? "Saving actions…" : planState.round === roundKey ? notice : "");
  const readiedMove = intents.find(({ enemy }) => enemy.id === enemyTarget?.id)
    ?.intent.label;
  const menuTitle = retreat
    ? "Flee"
    : menu === "skill"
      ? `${actor?.name} · Skills`
      : menu === "item"
        ? "Shared supplies"
        : menu === "others"
          ? `${actor?.name || "Party"} · Others`
          : "Battle details";
  const allyPicker = (
    <View style={{ gap: 5 }}>
      <Copy muted style={{ fontSize: 12 }}>
        Target ally: {friend?.name}
      </Copy>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 5 }}
      >
        {source.party
          .filter((c) => c.hp > 0)
          .map((c) => (
            <Button
              key={c.id}
              label={c.name}
              small
              tone={friend?.id === c.id ? "gold" : "dark"}
              onPress={() => setAllyTarget(c.id)}
            />
          ))}
      </ScrollView>
    </View>
  );
  const commandMenu =
    (retreat || (menu && menu !== "enemy" && menu !== "ally")) && !playback ? (
      <Panel style={[StyleSheet.absoluteFill, styles.overlay]}>
        <View style={[styles.row, { padding: 8 }]}>
          {menu === "item" && !retreat && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Others"
              onPress={() => setMenu("others")}
              style={styles.iconButton}
            >
              <Icon name="chevron-left" size={22} />
            </Pressable>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow>{menuTitle}</Eyebrow>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close combat panel"
            onPress={() => {
              setMenu(null);
              setRetreat(false);
            }}
            style={styles.iconButton}
          >
            <Icon name="close" size={20} />
          </Pressable>
        </View>
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 8, gap: 8 }}
        >
          {retreat ? (
            <>
              <Copy>
                Fall back through a passage? The enemies can still respond as
                your party retreats.
              </Copy>
              <Button
                label="Flee through a passage"
                tone="red"
                disabled={locked}
                onPress={() => {
                  if (!locked) {
                    setSubmitting(roundKey);
                    dispatch({ ...request, actions: [], flee: true });
                  }
                }}
              />
              <Button
                label="Keep fighting"
                tone="dark"
                onPress={() => setRetreat(false)}
              />
            </>
          ) : menu === "others" ? (
            <CombatOtherActions
              canAct={canAct}
              canItem={supplies.length > 0}
              canFocus={!!actor && actor.mp < actor.maxMp}
              canBurst={momentumLeft >= 2}
              canFlee={!locked}
              onItem={() => setMenu("item")}
              onFocus={() => assign("focus")}
              onBurst={() => assign("burst")}
              onFlee={() => setRetreat(true)}
            />
          ) : menu === "skill" ? (
            activeSkills.length ? (
              activeSkills.map((skill) => {
                const cost = skillCost(actor, skill.name, skill.cost);
                const cooldown = actor.cooldowns[skill.name] || 0;
                return (
                  <Choice
                    key={skill.name}
                    label={skill.name}
                    icon={skill.icon}
                    tone="blue"
                    detail={
                      SKILL_RANKS[skill.name][skillRank(actor, skill.name) - 1]
                    }
                    trailing={cooldown ? `Ready in ${cooldown}r` : `${cost} MP`}
                    disabled={!canAct || actor.mp < cost || cooldown > 0}
                    onPress={() => assign("skill", { skill: skill.name })}
                  />
                );
              })
            ) : (
              <Copy muted>No active skills learned yet.</Copy>
            )
          ) : menu === "item" ? (
            <>
              {allyPicker}
              {supplies.length ? (
                supplies.map((id) => {
                  const item = ITEMS.find((entry) => entry.id === id)!;
                  const qty =
                    id === "potion"
                      ? source.potions
                      : source.inventory[id] || 0;
                  const available =
                    qty -
                    actions.filter(
                      (action) =>
                        action.actor !== actor?.id && action.item === id,
                    ).length;
                  const detail =
                    id === "ether"
                      ? "+30 MP to the selected ally"
                      : id === "antidote"
                        ? "Clear venom, chill and freeze; grant ward"
                        : id === "bandage"
                          ? "+90 HP; clear bleeding, poison and entanglement"
                          : `+${id === "greater-potion" ? 120 : 65} HP to the selected ally`;
                  return (
                    <Choice
                      key={id}
                      label={item.name}
                      icon={item.icon}
                      tone={id === "antidote" ? "green" : "blue"}
                      detail={detail}
                      trailing={`×${available}`}
                      disabled={!canAct || available <= 0}
                      onPress={() => assign("item", { item: id })}
                    />
                  );
                })
              ) : (
                <Copy muted>No combat supplies left.</Copy>
              )}
            </>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: 5 }}>
                {(["help", "log"] as const).map((tab) => (
                  <Button
                    key={tab}
                    small
                    tone={detailTab === tab ? "blue" : "dark"}
                    style={{ flex: 1 }}
                    label={tab === "help" ? "How to play" : "Action log"}
                    onPress={() => setDetailTab(tab)}
                  />
                ))}
              </View>
              {practice && (
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Button
                    label="Configure trial"
                    small
                    tone="dark"
                    style={{ flex: 1 }}
                    onPress={practice.customize}
                  />
                  <Button
                    label="Restart"
                    small
                    tone="dark"
                    style={{ flex: 1 }}
                    onPress={practice.restart}
                  />
                  <Button
                    label="Leave trial"
                    small
                    tone="dark"
                    style={{ flex: 1 }}
                    onPress={practice.exit}
                  />
                </View>
              )}
              {detailTab === "help" ? (
                <View style={{ gap: 14, paddingVertical: 6 }}>
                  {[
                    [
                      "1",
                      "Choose a companion",
                      "Tap an ally’s sprite to choose their action. Tap their name or health bar to inspect their stats and skills.",
                    ],
                    [
                      "2",
                      "Pick a target",
                      "Tap the enemy you want to hit. Tap its name or health bar to inspect its details and readied move.",
                    ],
                    [
                      "3",
                      "Choose an action",
                      "Attack costs no MP. Skill uses MP for stronger moves. Guard reduces incoming damage. Others has items, Focus and Burst.",
                    ],
                    [
                      "4",
                      "Plan for everyone",
                      "Choose one action per ally. The round plays automatically after the last choice. Tap an ally to revise their choice before then.",
                    ],
                    [
                      "F",
                      "Focus · recover MP",
                      "Others → Focus restores up to 20 MP to that ally and adds 1 shared momentum (maximum 3). It uses their action without attacking. Use it when MP is running low.",
                    ],
                    [
                      "B",
                      "Burst · spend momentum",
                      "Attack, Guard and Focus build shared momentum. Others → Burst spends 2 momentum for a hit with 35% more damage and 50 break damage. It uses the ally’s action and costs no MP.",
                    ],
                    [
                      "?",
                      "Stuck?",
                      "Use Guard before a heavy hit. Heal wounded allies with a potion under Others, or choose Flee to withdraw. Each completed round uses one expedition day.",
                    ],
                  ].map(([step, title, body]) => (
                    <View
                      key={step}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: t.color.blue,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Copy
                          style={{ fontFamily: t.font.bold, color: t.color.bg }}
                        >
                          {step}
                        </Copy>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Copy style={{ fontFamily: t.font.bold, fontSize: 16 }}>
                          {title}
                        </Copy>
                        <Copy style={{ fontSize: 14, lineHeight: 21 }}>
                          {body}
                        </Copy>
                      </View>
                    </View>
                  ))}
                  <Copy muted style={{ fontSize: 13 }}>
                    Front allies draw most attacks. Back allies are safer, but
                    hunters and attacks that hit everyone can still reach them.
                  </Copy>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {!(combat.history || []).length && (
                    <Copy muted>
                      The first round has not played yet. Every ally and enemy
                      action will appear here.
                    </Copy>
                  )}
                  {(combat.history || []).map((entry, i, entries) => (
                    <React.Fragment key={entry.id}>
                      {entries[i - 1]?.round !== entry.round && (
                        <Eyebrow>ROUND {entry.round}</Eyebrow>
                      )}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <Icon
                          name={
                            source.party.some((c) => c.id === entry.actor)
                              ? "account"
                              : entry.actor
                                ? "skull-outline"
                                : "history"
                          }
                          size={18}
                          color={
                            source.party.some((c) => c.id === entry.actor)
                              ? t.color.blue
                              : t.color.gold
                          }
                        />
                        <Copy
                          selectable
                          style={{ flex: 1, fontSize: 14, lineHeight: 21 }}
                        >
                          {entry.text}
                        </Copy>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Panel>
    ) : null;
  return (
    <View style={styles.root}>
      <View
        style={{ flex: 1 }}
        accessibilityElementsHidden={
          !introDone || menu === "enemy" || menu === "ally"
        }
        importantForAccessibility={
          introDone && menu !== "enemy" && menu !== "ally"
            ? "auto"
            : "no-hide-descendants"
        }
      >
        <View testID="combat-arena" style={{ flex: 1, minHeight: 0 }}>
          <CombatStage
            state={stage}
            selected={frame?.actor || actor?.id || ""}
            selectedEnemy={enemyTarget?.id}
            chosen={actions.map((action) => action.actor)}
            compactHud
            hudInset={insets.top + 56}
            cue={cue}
            playbackDuration={animationMs}
            goldDrops={impactVisible ? goldDrops : []}
            busy={locked}
            onSelect={selectActor}
            onSelectEnemy={selectEnemy}
            onInspectEnemy={inspectEnemy}
            onInspectCharacter={inspectCharacter}
            onReady={onReady}
            healthParty={party}
            threatened={threatened}
          />
          <View
            pointerEvents="box-none"
            style={[styles.hud, { top: insets.top + 8 }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Combat help and action log"
              accessibilityState={{
                expanded: menu === "tactics",
                disabled: locked,
              }}
              disabled={locked}
              onPress={() => {
                setRetreat(false);
                setMenu(menu === "tactics" ? null : "tactics");
              }}
              style={styles.options}
            >
              <Icon name="help-circle-outline" size={21} />
            </Pressable>
          </View>
          {!!status && !arrivalNotice && (
            <View pointerEvents="none" style={styles.caption}>
              <Copy
                numberOfLines={3}
                accessibilityRole={
                  frame?.kind === "phase" ? "alert" : undefined
                }
                accessibilityLiveRegion="polite"
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  textAlign: "center",
                  color:
                    frame?.kind === "phase" ? t.color.goldLight : t.color.text,
                }}
              >
                {status}
              </Copy>
            </View>
          )}
          {arrivalNotice && (
            <CombatReinforcements
              enemies={arrivals}
              topInset={insets.top}
              onContinue={advancePlayback}
            />
          )}
        </View>
        <View
          testID="combat-console"
          style={[
            styles.console,
            { paddingBottom: Math.max(8, insets.bottom) },
          ]}
        >
          <View style={[styles.row, { paddingHorizontal: 2, minHeight: 16 }]}>
            <Copy
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: t.font.bold,
                fontSize: 12,
                lineHeight: 16,
                color: t.color.goldLight,
              }}
            >
              {playback
                ? party.find((c) => c.id === frame?.actor)?.name ||
                  enemies.find((e) => e.id === frame?.actor)?.name ||
                  "Battle"
                : actor?.name || "Party"}
              {!playback && actor && (
                <Copy muted style={{ fontSize: 10 }}>
                  {" "}
                  · {actor.mp} MP
                </Copy>
              )}
            </Copy>
            <View
              style={styles.row}
              accessibilityLabel={`${momentumLeft} momentum available out of 3`}
            >
              {[1, 2, 3].map((n) => (
                <Icon
                  key={n}
                  name={n <= momentumLeft ? "diamond" : "diamond-outline"}
                  size={10}
                  color={n <= momentumLeft ? t.color.gold : t.color.line}
                />
              ))}
            </View>
            {playback && (
              <Copy muted style={{ fontSize: 10 }}>
                {cursor + 1}/{playback.events.length}
              </Copy>
            )}
            {playback && !arrivalNotice ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skip round playback"
                onPress={finishPlayback}
                hitSlop={10}
              >
                <Copy muted style={{ fontSize: 10 }}>
                  Skip »
                </Copy>
              </Pressable>
            ) : arrivalNotice ? (
              <Copy style={{ fontSize: 10, color: t.color.gold }}>Paused</Copy>
            ) : (
              <Copy muted style={{ fontSize: 10 }}>
                {actions.length}/{ready.length}
              </Copy>
            )}
          </View>
          <View style={styles.row}>
            <Button
              label="Attack"
              icon="sword"
              tone="red"
              small
              dense
              disabled={!canAct}
              style={{ flex: 1 }}
              onPress={() => assign("attack")}
            />
            <Button
              label="Skill"
              icon="creation"
              tone="blue"
              small
              dense
              disabled={!canAct || !activeSkills.length}
              style={{ flex: 1 }}
              onPress={() => {
                setRetreat(false);
                setMenu(menu === "skill" ? null : "skill");
              }}
            />
            <Button
              label="Guard"
              icon="shield"
              tone="dark"
              small
              dense
              disabled={!canAct}
              style={{ flex: 1 }}
              onPress={() => assign("guard")}
            />
            <Button
              label="Others"
              icon="dots-horizontal"
              tone="gold"
              small
              dense
              disabled={!canAct}
              style={{ flex: 1 }}
              onPress={() => {
                setRetreat(false);
                setMenu(menu === "others" ? null : "others");
              }}
            />
          </View>
        </View>
      </View>
      {commandMenu && (
        <View
          style={[
            styles.menuLayer,
            {
              top:
                menu === "others"
                  ? undefined
                  : menu === "tactics"
                    ? insets.top + 60
                    : Math.max(
                        insets.top + 90,
                        Math.min(380, viewport.height * 0.44),
                      ),
              height: menu === "others" ? 244 : undefined,
              bottom: insets.bottom + 84,
            },
          ]}
        >
          {commandMenu}
        </View>
      )}
      {menu === "enemy" && !playback && enemyTarget && (
        <CombatEnemyDialog
          state={source}
          enemy={enemyTarget}
          readiedMove={readiedMove}
          statusText={enemyStatus}
          onClose={() => setMenu(null)}
        />
      )}
      {menu === "ally" && !playback && inspectedCharacter && (
        <CombatCharacterDialog
          character={inspectedCharacter}
          planned={!!queue[inspectedCharacter.id]}
          onChoose={() => selectActor(inspectedCharacter.id)}
          onClose={() => setMenu(null)}
        />
      )}
      {!introDone && (
        <CombatIntro
          state={source}
          ready={sceneReady}
          onComplete={sceneReady ? finishIntro : beginBattle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: t.color.bg },
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  hud: {
    position: "absolute",
    right: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  options: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,12,21,.7)",
    borderRadius: 4,
  },
  iconButton: {
    minHeight: 36,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    zIndex: 2,
    padding: 0,
    backgroundColor: t.color.bg,
    borderColor: t.color.goldDim,
  },
  menuLayer: { position: "absolute", left: 8, right: 8, zIndex: 3 },
  caption: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 3,
    backgroundColor: "rgba(3,9,16,.78)",
  },
  console: {
    gap: 5,
    paddingTop: 6,
    paddingHorizontal: 7,
    backgroundColor: "#080f19",
    borderTopWidth: 1,
    borderTopColor: "#56452f",
  },
});

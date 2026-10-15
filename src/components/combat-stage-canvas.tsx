import { arenaFloor } from "@/game/visual-environments";
import { STATUS_COLORS, visibleStatus } from "@/game/combat-presentation";
import { SPECIES_ART } from "@/game/species-art";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Atlas,
  Path,
  Canvas,
  Circle,
  Fill,
  Group,
  Image as SkiaImage,
  LinearGradient,
  Line,
  Oval,
  FilterMode,
  MipmapMode,
  useClock,
  useImage,
  useRectBuffer,
  useRSXformBuffer,
  vec,
} from "@shopify/react-native-skia";
import Animated, {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Copy, Icon } from "./game-ui";
import { theme as t } from "@/theme";
import type { CombatEnemy } from "@/game/round-combat";
import type { Character } from "@/game/engine";
import { FLOORS } from "@/game/world";
import {
  combatPose,
  cueContact,
  cueResponse,
  cueDuration,
  partyFormation,
  enemyFormation,
  healthPanel,
  type CombatCue,
} from "@/game/combat-animation";
import type { CombatStageProps } from "./combat-stage-types";
import { battleAtlases } from "./battle-backdrop";
import { MOTION_SHEETS } from "./combat-sheets";
import {
  characterVisual,
  enemyVisual,
  mirrorEnemy,
  spriteFrame,
  type MotionKey,
} from "@/game/combat-visuals";

function Figure({
  motionKey,
  species,
  status,
  id,
  x,
  y,
  size,
  enemy = false,
  selected = false,
  fallen = false,
  time,
  clock,
  cue,
  reduced,
  destination,
  onLoaded,
}: {
  motionKey: MotionKey;
  species?: string;
  status?: string;
  id: string;
  x: number;
  y: number;
  size: number;
  enemy?: boolean;
  selected?: boolean;
  fallen?: boolean;
  time: SharedValue<number>;
  clock: SharedValue<number>;
  cue: CombatCue | null;
  reduced: boolean;
  destination: { x: number; y: number };
  onLoaded: (id: string) => void;
}) {
  const art = species ? SPECIES_ART[species] : undefined;
  const image = useImage(art ? null : MOTION_SHEETS[motionKey]);
  useEffect(() => {
    if (image || art) onLoaded(id);
  }, [image, art, id, onLoaded]);
  const cw = art?.width || (image?.width() || 8) / 8;
  const ch = art?.height || (image?.height() || 6) / 6;
  const scale = size / Math.max(cw, ch);
  const pose = useDerivedValue(() => {
    if (fallen && !(enemy && cue?.enemyDied) && !cue?.fallen.includes(id))
      return { row: 4, frame: 7, advance: 0, recoil: 0, opacity: 0.4 };
    return combatPose(
      time.get(),
      reduced ? 0 : clock.get(),
      cue,
      id,
      enemy,
      reduced,
    );
  }, [cue, id, enemy, reduced, fallen]);
  const sprites = useRectBuffer(1, (r) => {
    "worklet";
    const p = pose.get();
    r.setXYWH(spriteFrame(motionKey, p.row, p.frame) * cw, p.row * ch, cw, ch);
  });
  const transforms = useRSXformBuffer(1, (r) => {
    "worklet";
    const p = pose.get();
    const travel = destination.x - x;
    r.set(
      scale,
      0,
      x - (cw * scale) / 2 + p.advance * travel + p.recoil,
      y - ch * scale * 0.96 + p.advance * (destination.y - y),
    );
  });
  const pixelTransform = useDerivedValue(() => {
    const p = pose.get(),
      bob = reduced ? 0 : p.row === 0 ? Math.sin(clock.get() / 240) * 1.2 : 0;
    return [
      {
        translateX:
          x - (cw * scale) / 2 + p.advance * (destination.x - x) + p.recoil,
      },
      {
        translateY:
          y - ch * scale * 0.96 + p.advance * (destination.y - y) + bob,
      },
      { scaleX: scale },
      {
        scaleY:
          scale *
          (p.row === 4 && !reduced ? Math.max(0.25, 1 - p.frame * 0.09) : 1),
      },
    ];
  });
  const opacity = useDerivedValue(() => pose.get().opacity);
  // This source sheet faces right. Mirror only its pixels around the moving
  // figure centre, leaving the ground shadow and HUD in their normal coordinates.
  const mirror = useDerivedValue(() =>
    enemy && mirrorEnemy(motionKey)
      ? [
          {
            translateX:
              2 *
              (x +
                pose.get().advance * (destination.x - x) +
                pose.get().recoil),
          },
          { scaleX: -1 },
        ]
      : [],
  );
  const shadow = useDerivedValue(() => ({
    x:
      x -
      size * 0.27 +
      pose.get().advance * (destination.x - x) +
      pose.get().recoil,
    y: y - 4 + pose.get().advance * (destination.y - y),
    width: size * 0.54,
    height: 9,
  }));
  const statusOpacity = useDerivedValue(() =>
    status ? (reduced ? 0.35 : 0.3 + Math.sin(clock.get() / 350) * 0.1) : 0,
  );
  return (
    <Group opacity={opacity}>
      <Oval rect={shadow} color="rgba(0,0,0,.48)" />
      {status && (
        <Oval
          rect={shadow}
          color={STATUS_COLORS[status]}
          opacity={statusOpacity}
          style="stroke"
          strokeWidth={3}
        />
      )}
      {selected && !enemy && !fallen && (
        <Oval rect={shadow} color="#7bd1ff" style="stroke" strokeWidth={1.5} />
      )}
      {art ? (
        <Group transform={pixelTransform}>
          {art.paths.map(({ color, path }) => (
            <Path key={color} color={color} path={path} />
          ))}
        </Group>
      ) : (
        <Group transform={mirror}>
          <Atlas
            image={image}
            sprites={sprites}
            transforms={transforms}
            sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
          />
        </Group>
      )}
    </Group>
  );
}

function CharacterHealth({
  character: c,
  point,
  selected,
  threatened,
  busy,
  cue,
  time,
  reduced,
  destination,
  onSelect,
}: {
  character: Character;
  point: { x: number; y: number; size: number };
  selected: boolean;
  threatened: boolean;
  busy: boolean;
  cue: CombatCue | null;
  time: SharedValue<number>;
  reduced: boolean;
  destination: { x: number; y: number };
  onSelect: (id: string) => void;
}) {
  const motion = useAnimatedStyle(() => {
    const pose = combatPose(time.get(), 0, cue, c.id, false, reduced);
    return {
      transform: [
        { translateX: pose.advance * (destination.x - point.x) + pose.recoil },
        { translateY: pose.advance * (destination.y - point.y) },
      ],
    };
  }, [cue, c.id, reduced, point, destination]);
  const panel = healthPanel(point);
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: panel.width,
          left: panel.x,
          top: panel.y,
          opacity: c.hp <= 0 && !cue?.fallen.includes(c.id) ? 0.45 : 1,
        },
        motion,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${c.name} on battlefield`}
        accessibilityHint={`HP ${c.hp} of ${c.maxHp}, MP ${c.mp} of ${c.maxMp}`}
        accessibilityState={{ selected, disabled: busy || c.hp <= 0 }}
        disabled={busy || c.hp <= 0}
        onPress={() => onSelect(c.id)}
        style={{ minHeight: point.size + 52 }}
      >
        <View
          style={{
            paddingHorizontal: 4,
            paddingVertical: 3,
            borderWidth: 1,
            borderRadius: 4,
            borderColor: selected
              ? t.color.blue
              : threatened
                ? t.color.red
                : "#5a626b",
            backgroundColor: selected
              ? "rgba(9,32,52,.94)"
              : "rgba(5,14,23,.91)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Copy
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: t.font.bold,
                fontSize: 10,
                lineHeight: 12,
                color: selected ? "#9fdcff" : t.color.text,
              }}
            >
              {c.name}
            </Copy>
            {threatened && (
              <Icon name="sword-cross" size={10} color={t.color.red} />
            )}
            {c.ailments.paralysis > 0 ? (
              <Icon name="lightning-bolt" size={10} color="#ccabef" />
            ) : c.ailments.poison > 0 ? (
              <Icon name="snake" size={10} color={t.color.green} />
            ) : c.ailments.ward ? (
              <Icon name="shield-check" size={10} color={t.color.green} />
            ) : null}
          </View>
          <Copy style={{ fontSize: 10, lineHeight: 12, color: "#a9eac8" }}>
            HP {c.hp}/{c.maxHp}
          </Copy>
          <View
            style={{ height: 3, backgroundColor: "#273640", borderRadius: 1 }}
          >
            <View
              style={{
                height: 3,
                borderRadius: 1,
                backgroundColor: t.color.green,
                width: `${Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100))}%`,
              }}
            />
          </View>
          <Copy style={{ fontSize: 10, lineHeight: 12, color: "#b1d8ff" }}>
            MP {c.mp}/{c.maxMp}
          </Copy>
          <View
            style={{ height: 3, backgroundColor: "#273640", borderRadius: 1 }}
          >
            <View
              style={{
                height: 3,
                borderRadius: 1,
                backgroundColor: t.color.blue,
                width: `${Math.max(0, Math.min(100, (c.mp / c.maxMp) * 100))}%`,
              }}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Particle({
  n,
  time,
  x,
  y,
  color,
  start,
  reduced,
}: {
  n: number;
  time: SharedValue<number>;
  x: number;
  y: number;
  color: string;
  start: number;
  reduced: boolean;
}) {
  const cx = useDerivedValue(() => {
    const p = Math.max(0, Math.min(1, (time.get() - start) / 380));
    return x + Math.cos(n * 2.399) * p * (20 + n * 2);
  });
  const cy = useDerivedValue(() => {
    const p = Math.max(0, Math.min(1, (time.get() - start) / 380));
    return y + Math.sin(n * 2.399) * p * 24 + p * p * 16;
  });
  const opacity = useDerivedValue(() =>
    reduced || time.get() < start
      ? 0
      : Math.max(0, 1 - (time.get() - start) / 380),
  );
  return (
    <Circle
      cx={cx}
      cy={cy}
      r={n % 3 === 0 ? 2 : 1.2}
      color={color}
      opacity={opacity}
    />
  );
}

function Projectile({
  time,
  from,
  to,
  color,
  end,
  arrow = false,
  reduced,
}: {
  time: SharedValue<number>;
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  end: number;
  arrow?: boolean;
  reduced: boolean;
}) {
  const progress = useDerivedValue(() =>
    Math.max(0, Math.min(1, (time.get() - end + 220) / 220)),
  );
  const cx = useDerivedValue(() => from.x + (to.x - from.x) * progress.get());
  const cy = useDerivedValue(
    () =>
      from.y +
      (to.y - from.y) * progress.get() -
      Math.sin(progress.get() * Math.PI) * 8,
  );
  const opacity = useDerivedValue(() =>
    reduced || time.get() < end - 220 || time.get() >= end ? 0 : 1,
  );
  const length = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
  const tail = useDerivedValue(() =>
    vec(
      cx.get() - ((to.x - from.x) / length) * (arrow ? 19 : 12),
      cy.get() - ((to.y - from.y) / length) * (arrow ? 19 : 12),
    ),
  );
  const head = useDerivedValue(() => vec(cx.get(), cy.get()));
  return (
    <Group opacity={opacity}>
      <Line
        p1={tail}
        p2={head}
        color={color}
        strokeWidth={arrow ? 2 : 5}
        strokeCap="round"
      />
      <Circle cx={cx} cy={cy} r={arrow ? 2 : 4} color="#f7faff" />
    </Group>
  );
}

function Pulse({
  time,
  point,
  color,
  start,
  reduced,
  shock = false,
}: {
  time: SharedValue<number>;
  point: { x: number; y: number; size: number };
  color: string;
  start: number;
  reduced: boolean;
  shock?: boolean;
}) {
  const progress = useDerivedValue(() =>
    Math.max(0, Math.min(1, (time.get() - start) / 420)),
  );
  const rect = useDerivedValue(() => {
    const radius =
      point.size *
      (shock ? 0.25 + progress.get() * 0.65 : 0.4 + progress.get() * 0.1);
    return {
      x: point.x - radius,
      y: point.y - radius * 0.32,
      width: radius * 2,
      height: radius * 0.64,
    };
  });
  const opacity = useDerivedValue(() =>
    reduced || time.get() < start ? 0 : (1 - progress.get()) * 0.85,
  );
  return (
    <Oval
      rect={rect}
      color={color}
      style="stroke"
      strokeWidth={shock ? 3 : 2}
      opacity={opacity}
    />
  );
}

function EnvironmentLight({
  clock,
  reduced,
  x,
  y,
  color,
}: {
  clock: SharedValue<number>;
  reduced: boolean;
  x: number;
  y: number;
  color: string;
}) {
  const opacity = useDerivedValue(() =>
    reduced ? 0.055 : 0.055 + Math.sin(clock.get() / 470) * 0.012,
  );
  return <Circle cx={x} cy={y} r={55} color={color} opacity={opacity} />;
}

export default function CombatStage({
  playbackDuration,
  state,
  selected,
  cue,
  busy,
  onSelect,
  onReady,
  healthParty,
  threatened,
}: CombatStageProps) {
  const [bounds, setBounds] = useState({ width: 350, height: 290 });
  const [loaded, setLoaded] = useState<string[]>([]);
  const onLoaded = useCallback(
    (id: string) =>
      setLoaded((previous) =>
        previous.includes(id) ? previous : [...previous, id],
      ),
    [],
  );
  const { width, height } = bounds;
  const reduced = useReducedMotion();
  const clock = useClock();
  const time = useSharedValue(2500);
  const floorIndex = arenaFloor(state.floor, state.route) - 1;
  const background = useImage(battleAtlases[Math.floor(floorIndex / 4)]);
  const cell = floorIndex % 4;
  const positions = partyFormation(width, height, state.party);
  const allEnemies =
    state.combat?.enemies ||
    (state.enemy ? [{ ...state.enemy, id: "enemy" }] : []);
  const enemyPositions = enemyFormation(width, height, allEnemies.length);
  const activeEnemyId = (state.enemy as CombatEnemy | null)?.id || "enemy";
  const activePoint =
    enemyPositions[
      Math.max(
        0,
        allEnemies.findIndex((e) => e.id === activeEnemyId),
      )
    ] || enemyFormation(width, height, 1)[0];
  const { x: enemyX, y: enemyY, size: enemySize } = activePoint;
  useEffect(() => {
    if (!cue) return;
    time.set(0);
    time.set(
      withTiming(cueDuration(cue, reduced), {
        duration: playbackDuration ?? cueDuration(cue, reduced),
        easing: Easing.linear,
      }),
    );
    return () => cancelAnimation(time);
  }, [cue, reduced, time, playbackDuration]);
  const camera = useDerivedValue(() => {
    if (reduced || !cue) return [{ translateX: 0 }, { translateY: 0 }];
    const p = time.get();
    const hit = cue.beats?.find(
      (b) => b.damage > 0 && p >= b.contact && p < b.contact + 220,
    );
    const response = cueResponse(cue);
    const at = hit
      ? p - hit.contact
      : cue.enemyAttacks && p > response && p < response + 220
        ? p - response
        : -1;
    const power =
      at < 0
        ? 0
        : (cue.kind === "burst" || cue.heavy ? 3 : 1.6) * (1 - at / 220);
    return [
      { translateX: Math.sin(at * 0.13) * power },
      { translateY: Math.cos(at * 0.17) * power * 0.5 },
    ];
  }, [cue, reduced]);
  const focus = useDerivedValue(() =>
    !cue || !["item", "focus", "guard"].includes(cue.kind)
      ? 0
      : time.get() > 100 && time.get() < 850
        ? Math.sin(((time.get() - 100) / 750) * Math.PI) * 0.8
        : 0,
  );
  const actorIndex = Math.max(
    0,
    state.party.findIndex((c) => c.id === cue?.actor),
  );
  const actorPoint = positions[actorIndex] || positions[0];
  const targetIndex = Math.max(
    0,
    state.party.findIndex((c) => c.id === cue?.targets[0]),
  );
  const targetPoint = positions[targetIndex] || positions[0];
  const subjects = state.party.map((c, i) => ({
    status: visibleStatus(c),
    species: undefined as string | undefined,
    motionKey: characterVisual(c).key,
    id: c.id,
    ...positions[i],
    enemy: false,
    selected: selected === c.id,
    fallen: c.hp <= 0,
  }));
  allEnemies.forEach((enemy, i) => {
    if (enemy.hp <= 0 && !(enemy.id === activeEnemyId && cue?.enemyDied))
      return;
    subjects.push({
      status: visibleStatus(enemy),
      species: enemy.species,
      motionKey: enemyVisual({ ...state, enemy }).key,
      id: enemy.id,
      ...enemyPositions[i],
      enemy: true,
      selected: false,
      fallen: enemy.hp <= 0,
    });
  });
  subjects.sort((a, b) => a.y - b.y);
  const figuresReady = subjects.every((subject) => loaded.includes(subject.id));
  useEffect(() => {
    if (background && figuresReady) onReady();
  }, [background, figuresReady, onReady]);
  return (
    <View
      accessibilityLabel={`${
        allEnemies
          .filter((e) => e.hp > 0)
          .map((e) => e.name)
          .join(", ") || "Defeated enemies"
      } facing your party in ${FLOORS[state.floor - 1].name}`}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        if (w > 0 && h > 0)
          setBounds((previous) =>
            previous.width === w && previous.height === h
              ? previous
              : { width: w, height: h },
          );
      }}
      style={{
        flex: 1,
        width: "100%",
        overflow: "hidden",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#876b42",
        backgroundColor: "#08111d",
      }}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={camera}>
          <Group clip={{ x: 0, y: 0, width, height }}>
            <SkiaImage
              image={background}
              x={-(cell % 2) * width}
              y={
                -Math.floor(cell / 2) * width * 1.5 -
                Math.max(0, width * 1.5 - height) * 0.7
              }
              width={width * 2}
              height={width * 3}
              fit="fill"
            />
          </Group>
          <Fill color="rgba(4,12,20,.12)" />
          <EnvironmentLight
            clock={clock}
            reduced={reduced}
            x={0}
            y={height * 0.25}
            color="#ffb66b"
          />
          <EnvironmentLight
            clock={clock}
            reduced={reduced}
            x={width}
            y={height * 0.35}
            color={
              state.route === "roots"
                ? "#a6d287"
                : state.route === "forge"
                  ? "#f0a368"
                  : "#93c9e6"
            }
          />
          <Group opacity={focus}>
            <Circle
              cx={actorPoint?.x || 0}
              cy={actorPoint?.y - 35 || 0}
              r={40}
              color={cue?.kind === "item" ? "#6fdb9b55" : "#66caff44"}
            />
          </Group>
          {subjects.map((subject) => (
            <Figure
              key={subject.id}
              {...subject}
              onLoaded={onLoaded}
              time={time}
              clock={clock}
              cue={subject.enemy && subject.id !== activeEnemyId ? null : cue}
              reduced={reduced}
              destination={
                subject.enemy
                  ? {
                      x: (targetPoint?.x || width * 0.27) + enemySize * 0.5,
                      y: targetPoint?.y || height * 0.81,
                    }
                  : { x: enemyX - enemySize * 0.55, y: enemyY }
              }
            />
          ))}
          {cue?.beats
            ?.filter((b) => b.damage > 0)
            .map((beat, i) => {
              const style = beat.style;
              if (style !== "arrow" && style !== "magic") return null;
              const point =
                positions[
                  state.party.findIndex((member) => member.id === beat.actor)
                ];
              return (
                <Projectile
                  key={"shot-" + i}
                  time={time}
                  from={{
                    x: point.x + point.size * 0.3,
                    y: point.y - point.size * 0.5,
                  }}
                  to={{
                    x: enemyX - enemySize * 0.2,
                    y: enemyY - enemySize * 0.45,
                  }}
                  color={beat.color}
                  end={beat.contact}
                  arrow={style === "arrow"}
                  reduced={reduced}
                />
              );
            })}
          {cue &&
            (cue.actorStyle === "heal" || cue.kind === "item") &&
            state.party.map((c, i) =>
              c.hp > 0 ? (
                <Pulse
                  key={"heal-" + c.id}
                  time={time}
                  point={positions[i]}
                  start={cueContact(cue) - 120}
                  color="#8fffc0"
                  reduced={reduced}
                />
              ) : null,
            )}
          {cue?.enemyAttacks &&
            cue.targets.map((id) => {
              const point =
                positions[state.party.findIndex((c) => c.id === id)];
              if (!point) return null;
              return cue.enemyStyle === "magic" ? (
                <Projectile
                  key={"enemy-shot-" + id}
                  time={time}
                  from={{
                    x: enemyX - enemySize * 0.3,
                    y: enemyY - enemySize * 0.5,
                  }}
                  to={{ x: point.x, y: point.y - point.size * 0.5 }}
                  color={cue.enemyColor || "#ef9689"}
                  end={cueResponse(cue)}
                  reduced={reduced}
                />
              ) : cue.enemyStyle === "slam" ? (
                <Pulse
                  key={"slam-" + id}
                  time={time}
                  point={point}
                  color={cue.enemyColor || "#7de5ff"}
                  start={cueResponse(cue)}
                  reduced={reduced}
                  shock
                />
              ) : null;
            })}
          {cue?.beats
            ?.filter((b) => b.damage > 0)
            .flatMap((beat) =>
              Array.from({ length: 14 }, (_, n) => (
                <Particle
                  key={`hit-${beat.actor}-${n}`}
                  n={n}
                  time={time}
                  x={enemyX - enemySize * 0.3}
                  y={enemyY - enemySize * 0.5}
                  color={beat.color}
                  start={beat.contact}
                  reduced={reduced}
                />
              )),
            )}
          {cue?.enemyAttacks &&
            cue.targets.map((id) => {
              const point =
                positions[state.party.findIndex((c) => c.id === id)];
              return point
                ? Array.from({ length: 8 }, (_, n) => (
                    <Particle
                      key={`${id}-${n}`}
                      n={n}
                      time={time}
                      x={point.x}
                      y={point.y - point.size * 0.5}
                      color={cue.kind === "guard" ? "#8bd7ff" : "#ef9689"}
                      start={cueResponse(cue)}
                      reduced={reduced}
                    />
                  ))
                : null;
            })}
          <Fill>
            <LinearGradient
              start={vec(0, height * 0.7)}
              end={vec(0, height)}
              colors={["transparent", "#07121d99"]}
            />
          </Fill>
        </Group>
      </Canvas>
      {healthParty.map((c, i) => (
        <CharacterHealth
          key={c.id}
          character={c}
          point={positions[i]}
          selected={selected === c.id}
          threatened={threatened.includes(c.id)}
          busy={busy}
          cue={cue}
          time={time}
          reduced={reduced}
          destination={{ x: enemyX - enemySize * 0.55, y: enemyY }}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

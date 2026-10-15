import type { Action, Game } from "./engine";
import {
  characterVisual,
  enemyVisual,
  type MotionStyle,
} from "./combat-visuals";

export type CombatBeat = {
  actor: string;
  name: string;
  kind: string;
  style: MotionStyle | "heal";
  color: string;
  start: number;
  contact: number;
  end: number;
  damage: number;
};
export type CombatCue = {
  id: number;
  actor: string;
  kind: string;
  enemyAttacks: boolean;
  heavy: boolean;
  enemyDied: boolean;
  enemyHit: boolean;
  targets: string[];
  fallen: string[];
  styles?: Record<string, MotionStyle>;
  actorStyle?: MotionStyle | "heal";
  enemyStyle?: MotionStyle;
  color?: string;
  enemyColor?: string;
  healing?: Record<string, number>;
  participants?: string[];
  beats?: CombatBeat[];
  responseAt?: number;
  finishAt?: number;
  deathAt?: number;
  poisonAt?: number;
};
export const COMBAT_TIMING = {
  contact: 520,
  enemyContact: 1440,
  turn: 1980,
  death: 2200,
  reduced: 280,
} as const;
export function healthPanel(point: { x: number; y: number; size: number }) {
  const width = Math.max(68, Math.min(86, point.size + 8));
  return {
    x: point.x - width / 2,
    y: point.y - point.size * 0.96 - 52,
    width,
    height: 50,
  };
}
/** Stable slots keep survivors in place while another enemy reacts or falls. */
export function enemyFormation(width: number, height: number, count: number) {
  const points =
    count <= 1
      ? [[0.77, 0.61]]
      : count === 2
        ? [
            [0.78, 0.42],
            [0.78, 0.81],
          ]
        : [
            [0.73, 0.36],
            [0.87, 0.59],
            [0.73, 0.83],
          ];
  const size = Math.min(
    count <= 1 ? 140 : count === 2 ? 104 : 88,
    width * (count <= 1 ? 0.36 : 0.25),
    height * (count <= 1 ? 0.38 : 0.28),
  );
  return points.map(([x, y]) => ({ x: width * x, y: height * y, size }));
}
export function battleCue(
  before: Game,
  after: Game,
  action: Extract<Action, { type: "BATTLE" }>,
): CombatCue {
  const actor =
    before.party.find((c) => c.id === action.actor && c.hp > 0) ||
    before.party.find((c) => c.hp > 0);
  const visual = actor ? characterVisual(actor) : null;
  const foe = enemyVisual(before);
  const heal = action.kind === "skill" && action.skill === "Second Wind";
  const cue: CombatCue = {
    id: after.effects.id,
    actor: actor?.id || "",
    kind: action.kind,
    styles: Object.fromEntries(
      before.party.map((c) => [c.id, characterVisual(c).style]),
    ),
    participants: before.party
      .filter((c) => c.hp > 0 && c.ailments.paralysis === 0)
      .map((c) => c.id),
    actorStyle: heal
      ? "heal"
      : action.skill === "Arcane Bolt"
        ? "magic"
        : action.skill === "Venom Fang"
          ? "arrow"
          : visual?.style,
    enemyStyle: foe.style,
    color: heal
      ? "#8fffc0"
      : action.skill === "Venom Fang"
        ? "#86e890"
        : action.skill === "Arcane Bolt"
          ? "#bca0ff"
          : visual?.color,
    enemyColor: foe.color,
    healing:
      after.effects.healing ||
      Object.fromEntries(
        before.party
          .filter((c) => c.hp > 0)
          .map((c) => [
            c.id,
            heal
              ? Math.min(c.maxHp - c.hp, Math.round(c.maxHp * 0.22))
              : action.kind === "item" &&
                  ["potion", "greater-potion", "bandage"].includes(
                    action.item || "potion",
                  )
                ? Math.min(
                    c.maxHp - c.hp,
                    action.item === "bandage"
                      ? c.id === actor?.id
                        ? 90
                        : 0
                      : action.item === "greater-potion"
                        ? 120
                        : 65,
                  )
                : 0,
          ]),
      ),
    enemyAttacks:
      after.effects.enemyDamage > 0 &&
      !after.effects.stunned &&
      !!after.enemy?.hp,
    heavy: (before.turn - 1) % 4 === 2,
    enemyDied: after.enemy?.hp === 0,
    enemyHit: after.effects.damage > 0 || after.effects.poisonDamage > 0,
    targets: Object.keys(after.effects.targets),
    fallen: after.party
      .filter(
        (c) =>
          c.hp <= 0 && (before.party.find((p) => p.id === c.id)?.hp || 0) > 0,
      )
      .map((c) => c.id),
  };
  const ordered = [
    actor,
    ...before.party.filter((c) => c.id !== actor?.id),
  ].filter(
    (c) =>
      c &&
      c.hp > 0 &&
      (c.ailments.paralysis === 0 ||
        (c.id === actor?.id && action.kind === "item")),
  );
  const beats: CombatBeat[] = [];
  let remainingHp = before.enemy?.hp || 0;
  for (const c of ordered) {
    if (!c) continue;
    const selected = c.id === actor?.id;
    const damage = after.effects.strikes?.[c.id] || 0;
    if (!damage && !selected) continue;
    const style = selected
      ? cue.actorStyle || "melee"
      : characterVisual(c).style;
    const start = beats.length ? beats[beats.length - 1].end + 70 : 0;
    const contact = start + (style === "melee" ? 440 : 600);
    beats.push({
      actor: c.id,
      name: c.name,
      kind: selected ? action.kind : "attack",
      style,
      color: selected ? cue.color || "#ffdd95" : characterVisual(c).color,
      start,
      contact,
      end: start + 900,
      damage,
    });
    remainingHp = Math.max(0, remainingHp - damage);
    if (!remainingHp) {
      cue.deathAt = contact;
      break;
    }
  }
  const end = beats.length ? beats[beats.length - 1].end : 0;
  cue.beats = beats;
  cue.poisonAt = end + 80;
  if (cue.enemyDied && cue.deathAt === undefined) cue.deathAt = cue.poisonAt;
  cue.responseAt = end + 430;
  cue.finishAt = cue.enemyDied
    ? Math.max(end + 120, (cue.deathAt || 0) + 1600)
    : cue.responseAt + 620;
  return cue;
}
export function cueContact(cue: CombatCue | null, reduced = false) {
  "worklet";
  return reduced
    ? 0
    : cue?.beats?.length
      ? cue.beats[0].contact
      : cue?.actorStyle && cue.actorStyle !== "melee"
        ? 700
        : COMBAT_TIMING.contact;
}
export function cueResponse(cue: CombatCue | null, reduced = false) {
  "worklet";
  return reduced ? 0 : (cue?.responseAt ?? COMBAT_TIMING.enemyContact);
}
export function cueDuration(cue: CombatCue, reduced = false) {
  return reduced
    ? COMBAT_TIMING.reduced
    : cue.finishAt !== undefined
      ? cue.finishAt
      : cue.enemyDied
        ? COMBAT_TIMING.death
        : COMBAT_TIMING.turn;
}

/** Each HP change is revealed only when its own strike (or poison tick) lands. */
export function battleEnemyAt(
  before: Game,
  after: Game,
  cue: CombatCue | null,
  elapsed: number,
) {
  if (!cue?.beats)
    return elapsed >= cueContact(cue) ? after.enemy! : before.enemy!;
  const damage = cue.beats.reduce(
    (n, beat) => n + (elapsed >= beat.contact ? beat.damage : 0),
    0,
  );
  const poison =
    elapsed >= (cue.poisonAt || 0) ? after.effects.poisonDamage : 0;
  return {
    ...(elapsed >= cueContact(cue) ? after.enemy! : before.enemy!),
    hp: Math.max(0, before.enemy!.hp - damage - poison),
  };
}

function sequencedPose(
  elapsed: number,
  cue: CombatCue,
  id: string,
  enemy: boolean,
  idle: {
    row: number;
    frame: number;
    advance: number;
    recoil: number;
    opacity: number;
  },
) {
  "worklet";
  const response = cueResponse(cue);
  const frame = (start: number, duration: number, count = 8) =>
    Math.min(
      count - 1,
      Math.max(0, Math.floor(((elapsed - start) / duration) * count)),
    );
  if (enemy) {
    const death = cue.deathAt ?? Infinity;
    if (cue.enemyDied && elapsed >= death + 100)
      return {
        ...idle,
        row: 4,
        frame: frame(death + 100, 880),
        opacity: Math.max(0, Math.min(1, 1 - (elapsed - death - 1100) / 350)),
      };
    if (
      cue.enemyAttacks &&
      elapsed >= response - 330 &&
      elapsed < response + 400
    )
      return {
        ...idle,
        row: cue.heavy ? 5 : 2,
        frame: frame(response - 330, 730),
        advance:
          cue.enemyStyle === "magic" || cue.enemyStyle === "slam"
            ? 0
            : Math.sin(((elapsed - response + 330) / 730) * Math.PI),
      };
    const hit = cue.beats!.find(
      (b) => b.damage > 0 && elapsed >= b.contact && elapsed < b.contact + 280,
    );
    if (hit)
      return {
        ...idle,
        row: 3,
        frame: frame(hit.contact, 280, 4),
        recoil: Math.sin(((elapsed - hit.contact) / 280) * Math.PI) * 9,
      };
    return idle;
  }
  if (cue.fallen.includes(id) && elapsed >= response + 10)
    return { ...idle, row: 4, frame: frame(response + 10, 510) };
  if (
    cue.targets.includes(id) &&
    elapsed >= response &&
    elapsed < response + 340
  )
    return {
      ...idle,
      row: 3,
      frame: frame(response, 340, 4),
      recoil: -Math.sin(((elapsed - response) / 340) * Math.PI) * 9,
    };
  const beat = cue.beats!.find(
    (b) => b.actor === id && elapsed >= b.start && elapsed < b.end,
  );
  if (!beat) return idle;
  const local = elapsed - beat.start;
  if (["guard", "item", "focus"].includes(beat.kind))
    return { ...idle, frame: 2 };
  const row = ["skill", "burst"].includes(beat.kind) ? 5 : 2;
  if (beat.style !== "melee")
    return { ...idle, row, frame: frame(beat.start, 900) };
  if (local < 180)
    return {
      ...idle,
      row: 1,
      frame: frame(beat.start, 180),
      advance: local / 180,
    };
  if (local < 660)
    return { ...idle, row, frame: frame(beat.start + 180, 480), advance: 1 };
  return {
    ...idle,
    row: 1,
    frame: 7 - frame(beat.start + 660, 240),
    advance: 1 - (local - 660) / 240,
  };
}

/** Health changes at contact, enemy damage at response; MP costs are shown when committed to the move. */
export function battlePartyAt(
  before: Game,
  after: Game,
  cue: CombatCue | null,
  impact: boolean,
  response: boolean,
) {
  if (response) return after.party;
  return after.party.map((c) => {
    const previous = before.party.find((old) => old.id === c.id);
    return {
      ...c,
      hp: Math.min(
        c.maxHp,
        (previous?.hp ?? c.hp) + (impact ? cue?.healing?.[c.id] || 0 : 0),
      ),
      ailments:
        impact && cue?.actorStyle === "heal" && c.id === cue.actor
          ? { poison: 0, paralysis: 0 }
          : previous?.ailments || c.ailments,
    };
  });
}

/** Pure pose selection is also a worklet: sprites, recoil and motion share one clock. */
export function combatPose(
  elapsed: number,
  idleClock: number,
  cue: CombatCue | null,
  id: string,
  enemy: boolean,
  reduced: boolean,
) {
  "worklet";
  const idle = {
    row: 0,
    frame: reduced ? 0 : Math.floor(idleClock / 145) % 6,
    advance: 0,
    recoil: 0,
    opacity: 1,
  };
  if (!cue) return idle;
  if (reduced)
    return {
      ...idle,
      row: (enemy && cue.enemyDied) || cue.fallen.includes(id) ? 4 : 0,
      frame: (enemy && cue.enemyDied) || cue.fallen.includes(id) ? 7 : 0,
    };
  if (cue.beats) return sequencedPose(elapsed, cue, id, enemy, idle);
  const frame = (start: number, duration: number, count = 8) =>
    Math.min(
      count - 1,
      Math.max(0, Math.floor(((elapsed - start) / duration) * count)),
    );
  const contact = cueContact(cue);
  if (enemy) {
    if (cue.enemyDied && elapsed >= contact + 100)
      return {
        ...idle,
        row: 4,
        frame: frame(contact + 100, 880),
        opacity: elapsed < 1750 ? 1 : Math.max(0, 1 - (elapsed - 1750) / 350),
      };
    if (cue.enemyAttacks && elapsed >= 1110 && elapsed < 1740)
      return {
        ...idle,
        row: cue.heavy ? 5 : 2,
        frame: frame(1110, 630),
        advance:
          cue.enemyStyle === "magic" || cue.enemyStyle === "slam"
            ? 0
            : Math.sin(((elapsed - 1110) / 630) * Math.PI),
      };
    if (cue.enemyHit && elapsed >= contact && elapsed < contact + 280)
      return {
        ...idle,
        row: 3,
        frame: frame(contact, 280, 4),
        recoil: Math.sin(((elapsed - contact) / 280) * Math.PI) * 9,
      };
    return idle;
  }
  if (cue.fallen.includes(id) && elapsed >= 1450)
    return { ...idle, row: 4, frame: frame(1450, 510) };
  if (cue.targets.includes(id) && elapsed >= 1440 && elapsed < 1780)
    return {
      ...idle,
      row: 3,
      frame: frame(1440, 340, 4),
      recoil: -Math.sin(((elapsed - 1440) / 340) * Math.PI) * 9,
    };
  if (id === cue.actor) {
    if (["attack", "skill", "burst"].includes(cue.kind)) {
      if (cue.actorStyle && cue.actorStyle !== "melee") {
        if (elapsed < 1060)
          return {
            ...idle,
            row: cue.kind === "attack" ? 2 : 5,
            frame: frame(160, 880),
            advance: 0,
          };
        return idle;
      }
      if (elapsed < 240)
        return {
          ...idle,
          row: 1,
          frame: frame(0, 240),
          advance: elapsed / 240,
        };
      if (elapsed < 790)
        return {
          ...idle,
          row: cue.kind === "skill" || cue.kind === "burst" ? 5 : 2,
          frame: frame(240, 550),
          advance: 1,
        };
      if (elapsed < 1050)
        return {
          ...idle,
          row: 1,
          frame: 7 - frame(790, 260),
          advance: 1 - (elapsed - 790) / 260,
        };
    }
    if (cue.kind === "guard" && elapsed < 1740) return { ...idle, frame: 2 };
  } else if (
    (!cue.participants || cue.participants.includes(id)) &&
    ["attack", "skill", "burst", "focus"].includes(cue.kind) &&
    elapsed > 280 &&
    elapsed < 800
  ) {
    return {
      ...idle,
      row: 2,
      frame: frame(280, 520),
      advance:
        cue.styles?.[id] === "arrow" || cue.styles?.[id] === "magic" ? 0 : 0.08,
    };
  }
  return idle;
}

export function formation(width: number, height: number, count: number) {
  const size = Math.min(100, width * 0.23, height * 0.24);
  // Two ranks leave each head enough space for its own readable HP/MP placard.
  const points =
    count === 1
      ? [[0.28, 0.82]]
      : [
          [0.4, 0.91],
          [0.13, 0.91],
          [0.4, 0.45],
          [0.13, 0.45],
        ];
  return points
    .slice(0, count)
    .map(([x, y]) => ({ x: width * x, y: height * y, size }));
}

import type { CombatCue } from "@/game/combat-animation";
import type { Character, Game } from "@/game/engine";
export type CombatStageProps = {
  state: Game;
  selected: string;
  cue: CombatCue | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onReady: () => void;
  healthParty: Character[];
  threatened: string[];
};

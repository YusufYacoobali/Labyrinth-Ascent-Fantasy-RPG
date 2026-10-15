import type { Phase } from "./engine";
import type { Route } from "./world";

export type StoryCategory = "unique" | "floor" | "route" | "generic";
export interface StoryChoice {
  id: string;
  label: string;
  outcome: string;
  approved?: boolean;
  harmful?: boolean;
  pair?: { ids: [string, string]; change: number };
  gold?: number;
  item?: string;
  faction?: "guild" | "stag" | Route;
  standing?: number;
}
export interface StoryStage {
  id: string;
  title: string;
  body: string;
  location: "town" | "field";
  floor?: number;
  bestFloor?: number;
  principal?: boolean;
  site?: "shelter" | "portal";
  choices: StoryChoice[];
}
export interface StoryChain {
  id: string;
  category: StoryCategory;
  title: string;
  companion?: string;
  floor?: number;
  route?: Route;
  stages: StoryStage[];
  aftermath: string;
}
export interface StoryState {
  stages: Record<string, number>;
  outcomes: Record<string, string>;
  loyalty: Record<string, number>;
  pairs: Record<string, number>;
  factions: Record<Route, number>;
  genericHistory: Record<string, number>;
  genericBag: string[];
  genericFamily: string;
  history: {
    stage: string;
    title: string;
    outcome: string;
    expedition: number;
  }[];
  active: { chain: string; stage: string; resume: Phase } | null;
}
export const newStoryState = (): StoryState => ({
  stages: {},
  outcomes: {},
  loyalty: {},
  pairs: {},
  factions: { roots: 0, frost: 0, forge: 0, crypt: 0 },
  genericHistory: {},
  genericBag: [],
  genericFamily: "",
  history: [],
  active: null,
});

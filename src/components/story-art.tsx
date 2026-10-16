import { STORY_ILLUSTRATIONS } from "@/game/story-illustrations";
import type { StoryStage } from "@/game/story-types";
import type { ArrivalScene } from "@/game/story";
import {
  ARRIVAL_ILLUSTRATIONS,
  EVENT_ILLUSTRATIONS,
  entryIllustration,
  environmentIllustration,
} from "@/game/scene-illustrations";
import { SceneIllustration } from "./scene-illustration";
import type { Route } from "@/game/world";

export function ArrivalArt({ scene }: { scene: ArrivalScene }) {
  return <SceneIllustration illustration={ARRIVAL_ILLUSTRATIONS[scene.id]} />;
}
export function EntryArt({
  floor,
  route = null,
}: {
  floor: number;
  route?: Route | null;
}) {
  return <SceneIllustration illustration={entryIllustration(floor, route)} />;
}
export function EventArt({ id }: { id: string }) {
  return <SceneIllustration illustration={EVENT_ILLUSTRATIONS[id]} />;
}
export function EnvironmentArt({
  floor,
  route = null,
  label,
}: {
  floor: number;
  route?: Route | null;
  label?: string;
}) {
  return (
    <SceneIllustration
      illustration={environmentIllustration(floor, route, label)}
    />
  );
}
export function StoryStageArt({ stage }: { stage: StoryStage }) {
  return <SceneIllustration illustration={STORY_ILLUSTRATIONS[stage.id]} />;
}

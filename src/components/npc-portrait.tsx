import { Image } from "expo-image";
import { WORLD_NPCS, type WorldNpcId } from "@/game/world-npcs";
import { theme as t } from "@/theme";

export const NPC_PORTRAITS: Record<WorldNpcId, number> = {
  elian: require("../../assets/story/npc-elian-portrait.png"),
  tamsin: require("../../assets/story/npc-tamsin-portrait.png"),
  sable: require("../../assets/story/npc-sable-portrait.png"),
};

export function NpcPortrait({
  id,
  width = 66,
}: {
  id: string;
  width?: number;
}) {
  const source = NPC_PORTRAITS[id as WorldNpcId];
  if (!source) return null;
  return (
    <Image
      source={source}
      accessibilityLabel={WORLD_NPCS[id as WorldNpcId].name}
      contentFit="cover"
      contentPosition="top"
      cachePolicy="disk"
      style={{
        width,
        height: (width * 4) / 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: t.color.goldDim,
      }}
    />
  );
}

import { View } from "react-native";
import { Image } from "expo-image";
import type { SceneIllustration as Illustration } from "@/game/scene-illustrations";
import { illustrationBounds } from "@/game/illustration-bounds";
import { SCENE_ART_SOURCES } from "./scene-art-sources";
import { SceneMotion } from "./scene-motion";

export function SceneIllustration({
  illustration,
}: {
  illustration?: Illustration;
}) {
  if (!illustration) return null;
  const source = SCENE_ART_SOURCES[illustration.sheet];
  const bounds = illustrationBounds(illustration);
  // Missing art is never replaced with an unrelated floor or another character.
  if (!source || !bounds) return null;
  const key = `${illustration.sheet}-${illustration.panel}`;
  return (
    <View
      key={key}
      testID={`scene-art-${key}`}
      style={{
        width: "100%",
        aspectRatio: bounds.aspectRatio,
        overflow: "hidden",
      }}
    >
      <SceneMotion style={{ flex: 1 }}>
        <Image
          source={source}
          accessibilityLabel={illustration.label}
          recyclingKey={key}
          contentFit="fill"
          cachePolicy="disk"
          style={{
            position: "absolute",
            width: `${bounds.width}%`,
            height: `${bounds.height}%`,
            left: `${bounds.left}%`,
            top: `${bounds.top}%`,
          }}
        />
      </SceneMotion>
    </View>
  );
}

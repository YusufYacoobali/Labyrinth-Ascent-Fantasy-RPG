import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { SceneIllustration as Illustration } from "@/game/scene-illustrations";
import { illustrationBounds } from "@/game/illustration-bounds";
import { SCENE_ART_SOURCES } from "./scene-art-sources";
import { SceneMotion } from "./scene-motion";
import { Button } from "./game-ui";

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
        flexShrink: 0,
        aspectRatio: bounds.aspectRatio,
        overflow: "hidden",
        transform: illustration.mirrored ? [{ scaleX: -1 }] : undefined,
      }}
    >
      <SceneMotion style={StyleSheet.absoluteFill}>
        <IllustrationImage
          key={key}
          source={source}
          illustration={illustration}
          bounds={bounds}
        />
      </SceneMotion>
    </View>
  );
}

function IllustrationImage({
  source,
  illustration,
  bounds,
}: {
  source: number;
  illustration: Illustration;
  bounds: NonNullable<ReturnType<typeof illustrationBounds>>;
}) {
  const [failures, setFailures] = useState(0);
  return failures >= 2 ? (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button
        label="Retry picture"
        small
        tone="dark"
        onPress={() => setFailures(0)}
      />
    </View>
  ) : (
    <Image
      key={failures}
      source={source}
      accessibilityLabel={illustration.label}
      recyclingKey={`${illustration.sheet}-${illustration.panel}-${failures}`}
      contentFit="fill"
      cachePolicy={failures ? "none" : "disk"}
      onError={() => setFailures((n) => n + 1)}
      style={{
        position: "absolute",
        width: `${bounds.width}%`,
        height: `${bounds.height}%`,
        left: `${bounds.left}%`,
        top: `${bounds.top}%`,
      }}
    />
  );
}

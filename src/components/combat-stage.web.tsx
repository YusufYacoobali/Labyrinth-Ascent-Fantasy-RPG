import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { ActivityIndicator, View } from "react-native";
import type { CombatStageProps } from "./combat-stage-types";
const loadStage = () => import("./combat-stage-canvas");
export default function CombatStage(props: CombatStageProps) {
  return (
    <WithSkiaWeb
      getComponent={loadStage}
      componentProps={props}
      opts={{ locateFile: () => "/canvaskit.wasm" }}
      fallback={
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color="#e4bc6b" />
        </View>
      }
    />
  );
}

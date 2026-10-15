import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { ActivityIndicator, View } from "react-native";
import type { MapCanvasProps } from "./route-map-drawing";
const loadMap = () => import("./route-map-drawing");
export default function MapCanvas(props: MapCanvasProps) {
  return (
    <WithSkiaWeb
      getComponent={loadMap}
      componentProps={props}
      opts={{ locateFile: () => "/canvaskit.wasm" }}
      fallback={
        <View style={{ height: props.height || 260 }}>
          <ActivityIndicator />
        </View>
      }
    />
  );
}

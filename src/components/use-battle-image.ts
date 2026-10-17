import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { Skia, type SkImage } from "@shopify/react-native-skia";

/** Skia's useImage leaves rejected URI reads pending. Resolve bundled assets first,
 * catch both read and decode errors, and retry without blocking the battle. */
export function useBattleImage(source: number) {
  const [result, setResult] = useState<{
    source: number;
    image: SkImage | null;
    failed: boolean;
  }>({ source, image: null, failed: false });
  useEffect(() => {
    let active = true;
    const load = async () => {
      for (let attempt = 0; attempt < 2 && active; attempt++) {
        try {
          const [asset] = await Asset.loadAsync(source);
          const data = await Skia.Data.fromURI(asset.localUri || asset.uri);
          const image = Skia.Image.MakeImageFromEncoded(data);
          if (!image) throw new Error("Battle image could not be decoded");
          if (active) setResult({ source, image, failed: false });
          return;
        } catch {
          if (attempt === 1 && active)
            setResult({ source, image: null, failed: true });
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [source]);
  return result.source === source
    ? result
    : { source, image: null, failed: false };
}

import { ILLUSTRATION_LAYOUTS } from "./illustration-layouts";
import type { SceneIllustration } from "./scene-illustrations";

/** Cover one selected cell without stretching it or exposing any neighbouring scene. */
export function illustrationBounds(illustration: SceneIllustration) {
  const layout = ILLUSTRATION_LAYOUTS[illustration.sheet];
  if (
    !layout ||
    illustration.panel < 0 ||
    illustration.panel >= layout.columns * layout.rows
  )
    return;
  const aspectRatio = illustration.aspectRatio || 1.6;
  const cellAspect =
    layout.width / layout.columns / (layout.height / layout.rows);
  const bleed = layout.columns === 1 && layout.rows === 3 ? 1.04 : 1.008;
  const xScale = Math.max(1, cellAspect / aspectRatio) * bleed;
  const yScale = (xScale * aspectRatio) / cellAspect;
  const focus = Math.max(0, Math.min(1, illustration.focus ?? 0.5));
  return {
    aspectRatio,
    width: layout.columns * xScale * 100,
    height: layout.rows * yScale * 100,
    left:
      -(illustration.panel % layout.columns) * xScale * 100 - (xScale - 1) * 50,
    top:
      -Math.floor(illustration.panel / layout.columns) * yScale * 100 -
      (yScale - 1) * focus * 100,
  };
}

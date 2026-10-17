import { useCallback, useEffect, useState } from "react";

export const ARENA_LOAD_LIMIT_MS = 6000;
export function useBattleReadiness() {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    if (ready) return;
    // A slow image must never lock combat or a resumed saved battle.
    const timer = setTimeout(markReady, ARENA_LOAD_LIMIT_MS);
    return () => clearTimeout(timer);
  }, [ready, markReady]);
  return { ready, markReady };
}

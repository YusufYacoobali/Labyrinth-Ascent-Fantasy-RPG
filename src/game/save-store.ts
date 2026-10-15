export interface SaveStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export const SAVE_KEY = "labyrinth-awaits-save-v2";
export const LEGACY_KEY = "labyrinth-awaits-save-v1";
export const LEGACY_BACKUP_KEY = "labyrinth-awaits-development-v1-backup";

export async function loadSave(storage: SaveStorage) {
  const raw = await storage.getItem(SAVE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (
      parsed.version !== 2 ||
      !Array.isArray(parsed.party) ||
      !Number.isFinite(parsed.day) ||
      !parsed.party.every((c: { skills?: unknown }) => Array.isArray(c.skills))
    )
      throw new Error("Unreadable save retained");
    if (
      Object.values(parsed.journey?.maps || {}).some(
        (map) => (map as { version?: number }).version === 1,
      )
    ) {
      const backup = "labyrinth-awaits-development-before-spatial-maps";
      if (!(await storage.getItem(backup))) await storage.setItem(backup, raw);
      return { save: null, backedUp: true };
    }
    if (parsed.rulesVersion !== 3 && parsed.rulesVersion !== 4) {
      const key = "labyrinth-awaits-development-before-tactical-rounds";
      if (!(await storage.getItem(key))) await storage.setItem(key, raw);
      return { save: null, backedUp: true };
    }
    if (parsed.rulesVersion === 3) {
      const key = "labyrinth-awaits-development-before-stories";
      if (!(await storage.getItem(key))) await storage.setItem(key, raw);
    }
    if (parsed.skillEncoding !== "id-v1") {
      const key = "labyrinth-awaits-development-before-skill-identities";
      if (!(await storage.getItem(key))) await storage.setItem(key, raw);
    }
    return { save: parsed, backedUp: false };
  }
  const legacy = await storage.getItem(LEGACY_KEY);
  if (legacy && !(await storage.getItem(LEGACY_BACKUP_KEY))) {
    await storage.setItem(LEGACY_BACKUP_KEY, legacy);
    return { save: null, backedUp: true };
  }
  return { save: null, backedUp: false };
}

/** A failed snapshot is retained; later snapshots and retries cannot overtake writes. */
export function saveWriter(storage: SaveStorage) {
  let tail = Promise.resolve();
  let pending: string | null = null;
  const save = (snapshot: string) => {
    pending = snapshot;
    const operation = tail.then(async () => {
      await storage.setItem(SAVE_KEY, snapshot);
      if (pending === snapshot) pending = null;
    });
    tail = operation.catch(() => {});
    return operation;
  };
  return { save, retry: () => (pending ? save(pending) : tail) };
}

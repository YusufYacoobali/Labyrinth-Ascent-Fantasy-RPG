import type { Character } from "./engine";
export const formationOf = (c: Character) =>
  c.formation || (/mage|ranger|archer|warden/i.test(c.job) ? "back" : "front");

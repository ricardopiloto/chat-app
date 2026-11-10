import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export function syncDice(
  source = resolve(here, "../node_modules/@3d-dice/dice-box-threejs/public"),
  target = resolve(here, "../public/dice-box-threejs"),
) {
  if (!existsSync(source)) return false;
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
  return true;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(syncDice() ? "dice assets synced" : "dice assets unavailable");

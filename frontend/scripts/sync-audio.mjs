// Copies the sound effects kept in <repo>/assets/audio into public/audio so Vite serves them at /audio/.
// Missing source folder or files are fine: the app then simply has no sounds.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function syncAudio(
  source = resolve(here, "../../assets/audio"),
  target = resolve(here, "../public/audio"),
) {
  if (!existsSync(source)) return [];
  const files = readdirSync(source).filter((name) => name.toLowerCase().endsWith(".mp3"));
  if (files.length === 0) return [];
  mkdirSync(target, { recursive: true });
  for (const name of files) copyFileSync(join(source, name), join(target, name));
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(`synced: ${syncAudio().join(", ") || "nothing"}`);

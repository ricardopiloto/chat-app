import { emptyServerJokes } from "../i18n";

/** Locale-aware empty-server jokes (041 / 074). */
export { emptyServerJokes };

/** Random joke per call (may repeat). */
export function pickEmptyServerJoke(): string {
  const jokes = emptyServerJokes();
  const i = Math.floor(Math.random() * jokes.length);
  return jokes[i] ?? jokes[0]!;
}

export function emptyServerJokeCount(): number {
  return emptyServerJokes().length;
}

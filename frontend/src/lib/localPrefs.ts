// Device-local preferences. A browser can refuse storage (private window, quota, policy); in that
// case a read finds nothing and a write is skipped, and the app carries on with its defaults.
const attempt = <R>(action: (store: Storage) => R, otherwise: R): R => {
  try {
    return action(localStorage);
  } catch {
    return otherwise;
  }
};

export const readString = (key: string): string | null => attempt((store) => store.getItem(key), null);

export const writeString = (key: string, value: string): void => attempt((store) => store.setItem(key, value), undefined);

export function readJson<T>(key: string, fallback: T): T {
  const stored = readString(key);
  return attempt(() => (stored ? (JSON.parse(stored) as T) : fallback), fallback);
}

export const writeJson = (key: string, value: unknown): void => writeString(key, JSON.stringify(value));

/**
 * Thin localStorage get/set helpers. Prefer these over ad-hoc getItem/setItem.
 * Migrated surfaces: see specs/053-frontend-build-optimize/inventory.md C4.
 * Keys must stay stable (FR-008).
 */
export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

export function readFlag(key: string, trueValue = "1"): boolean {
  return readString(key) === trueValue;
}

export function writeFlag(key: string, on: boolean, trueValue = "1", falseValue = "0"): void {
  writeString(key, on ? trueValue : falseValue);
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  writeString(key, JSON.stringify(value));
}

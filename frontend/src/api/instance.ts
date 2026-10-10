// Which Mesa instance this client talks to, and the session token used instead of the cookie.
// The web build never reads or writes this: `isNative()` is false and every save is a no-op.
// Inside Electron the values live in a JSON file owned by the main process. A dev-only flag
// simulates native mode in a browser and then uses localStorage.
const DEV_KEY = "mesa.dev.native";
const LOCAL_URL = "mesa.instance.baseUrl";
const LOCAL_TOKEN = "mesa.instance.sessionToken";

export interface InstanceState {
  baseUrl: string | null;
  sessionToken: string | null;
}

interface NativeBridge {
  loadInstance(): Promise<InstanceState>;
  saveInstanceUrl(url: string): Promise<void>;
  saveSessionToken(token: string): Promise<void>;
  clearSessionToken(): Promise<void>;
  clearInstance(): Promise<void>;
}

let state: InstanceState = { baseUrl: null, sessionToken: null };
const listeners = new Set<() => void>();

export function currentInstance(): InstanceState {
  return state;
}

/** Relative on the web. Absolute against the configured instance when native. */
export function absoluteResource(path: string): string {
  if (!isNative()) return path;
  const base = currentInstance().baseUrl;
  if (!base) return path;
  return new URL(path, base).toString();
}

export function subscribeInstance(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  for (const listener of listeners) listener();
}

function page(): { __MESA_NATIVE__?: boolean; mesaNative?: NativeBridge } | undefined {
  return (globalThis as { window?: { __MESA_NATIVE__?: boolean; mesaNative?: NativeBridge } }).window;
}

/** True inside the Electron shell, or in dev when `?native=1` / localStorage `mesa.dev.native=1`. */
export function isNative(): boolean {
  return Boolean(page()?.__MESA_NATIVE__) || devSimulation();
}

function nativeBridge(): NativeBridge | null {
  return page()?.mesaNative ?? null;
}

function devSimulation(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    const params = new URLSearchParams(globalThis.location?.search ?? "");
    if (params.get("native") === "1") {
      globalThis.localStorage?.setItem(DEV_KEY, "1");
      return true;
    }
    return globalThis.localStorage?.getItem(DEV_KEY) === "1";
  } catch {
    return false;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function readPersisted(): Promise<InstanceState> {
  const bridge = nativeBridge();
  if (bridge) return bridge.loadInstance();
  return {
    baseUrl: asString(globalThis.localStorage?.getItem(LOCAL_URL)),
    sessionToken: asString(globalThis.localStorage?.getItem(LOCAL_TOKEN)),
  };
}

async function writePersisted(next: InstanceState): Promise<void> {
  const bridge = nativeBridge();
  if (bridge) {
    if (next.baseUrl) await bridge.saveInstanceUrl(next.baseUrl);
    if (next.sessionToken) await bridge.saveSessionToken(next.sessionToken);
    else await bridge.clearSessionToken();
    if (!next.baseUrl) await bridge.clearInstance();
    return;
  }
  const storage = globalThis.localStorage;
  if (!storage) return;
  if (next.baseUrl) storage.setItem(LOCAL_URL, next.baseUrl);
  else storage.removeItem(LOCAL_URL);
  if (next.sessionToken) storage.setItem(LOCAL_TOKEN, next.sessionToken);
  else storage.removeItem(LOCAL_TOKEN);
}

export async function loadInstance(): Promise<InstanceState> {
  if (!isNative()) {
    state = { baseUrl: null, sessionToken: null };
    return state;
  }
  try {
    state = await readPersisted();
  } catch {
    state = { baseUrl: null, sessionToken: null };
  }
  return state;
}

export async function saveInstanceUrl(url: string): Promise<void> {
  if (!isNative()) return;
  state = { ...state, baseUrl: url };
  await writePersisted(state);
  emit();
}

export async function saveSessionToken(token: string): Promise<void> {
  if (!isNative()) return;
  state = { ...state, sessionToken: token };
  await writePersisted(state);
}

/** Drops the token and keeps the instance URL. Logout stays on the same Mesa. */
export async function clearSessionToken(): Promise<void> {
  if (!isNative()) return;
  state = { ...state, sessionToken: null };
  await writePersisted(state);
}

/** Drops the URL and the token. The next launch asks for an instance again. */
export async function clearInstance(): Promise<void> {
  state = { baseUrl: null, sessionToken: null };
  if (isNative()) {
    try {
      const bridge = nativeBridge();
      if (bridge) await bridge.clearInstance();
      else await writePersisted(state);
    } catch {
      /* the in-memory clear still wins */
    }
  }
  emit();
}

export function normalizeInstanceUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("empty");
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("invalid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
  return url.origin;
}

/** Confirms `GET /health` returns `{ ok: true }` and returns the origin to store. */
export async function checkInstance(raw: string): Promise<string> {
  const base = normalizeInstanceUrl(raw);
  let response: Response;
  try {
    response = await fetch(new URL("/health", base).toString());
  } catch {
    throw new Error("unreachable");
  }
  if (!response.ok) throw new Error("unexpected");
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("unexpected");
  }
  if (!body || typeof body !== "object" || (body as { ok?: unknown }).ok !== true) throw new Error("unexpected");
  return base;
}

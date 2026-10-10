// Transport for the REST API. Plain TypeScript: no framework imports, so any layer can call it.
// The backend contract this implements: JSON bodies, 204 for "no content", and errors shaped as
// { error, code?, message? } where `message` (when present) is the human text and `error` then
// carries the machine code. The web build sends the session cookie on the same origin. Native
// mode resolves each path against the configured instance and sends Authorization instead.
import { currentInstance, isNative } from "./instance";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = { error?: unknown; code?: unknown; message?: unknown };

function describeFailure(res: Response, raw: string): ApiError {
  let body: ErrorBody | null = null;
  try {
    body = raw ? (JSON.parse(raw) as ErrorBody) : null;
  } catch {
    body = null;
  }
  const text = typeof body?.message === "string" ? body.message : typeof body?.error === "string" ? body.error : res.statusText;
  const code = typeof body?.code === "string" ? body.code : typeof body?.message === "string" && typeof body?.error === "string" ? body.error : undefined;
  return new ApiError(res.status, text, code);
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised as JSON. */
  json?: unknown;
  /** Sent as-is with `application/octet-stream`. */
  bytes?: Uint8Array | Blob;
  headers?: Record<string, string>;
  /** Lets the request outlive the page (used when leaving a call while the tab closes). */
  keepalive?: boolean;
  signal?: AbortSignal;
};

interface PlannedRequest {
  url: string;
  transport: "browser";
  init: RequestInit;
}

function toInit(opts: RequestOptions, credentials: RequestCredentials, headers: Headers): RequestInit {
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(opts.json);
  } else if (opts.bytes !== undefined) {
    headers.set("content-type", "application/octet-stream");
    body = opts.bytes as BodyInit;
  }
  return { method: opts.method ?? "GET", headers, body, credentials, keepalive: opts.keepalive, signal: opts.signal };
}

/** Relative path and cookie on the web. Absolute URL and bearer token when native. */
export function planRequest(path: string, opts: RequestOptions = {}): PlannedRequest {
  const headers = new Headers(opts.headers);
  if (!isNative()) return { url: path, transport: "browser", init: toInit(opts, "include", headers) };
  const base = currentInstance().baseUrl;
  if (!base) throw new ApiError(0, "No Mesa instance is configured");
  const token = currentInstance().sessionToken;
  if (token) headers.set("authorization", `Bearer ${token}`);
  return {
    url: new URL(path, base).toString(),
    transport: "browser",
    init: toInit(opts, "omit", headers),
  };
}

async function send(path: string, opts: RequestOptions): Promise<Response> {
  const planned = planRequest(path, opts);
  return fetch(planned.url, planned.init);
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await send(path, opts);
  const raw = await res.text();
  if (!res.ok) throw describeFailure(res, raw);
  return (raw ? JSON.parse(raw) : undefined) as T;
}

export async function requestBytes(path: string, opts: RequestOptions = {}): Promise<{ bytes: Uint8Array; headers: Headers }> {
  const res = await send(path, opts);
  if (!res.ok) throw describeFailure(res, await res.text());
  return { bytes: new Uint8Array(await res.arrayBuffer()), headers: res.headers };
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: "POST", json }),
  put: <T>(path: string, json?: unknown) => request<T>(path, { method: "PUT", json }),
  patch: <T>(path: string, json?: unknown) => request<T>(path, { method: "PATCH", json }),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Header that carries the original image type for avatar and attachment uploads/downloads. */
export const MEDIA_TYPE_HEADER = "X-Mesa-Media-Type";

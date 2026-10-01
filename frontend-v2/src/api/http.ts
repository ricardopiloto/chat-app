// Transport for the REST API. Plain TypeScript: no framework imports, so any layer can call it.
// The backend contract this implements: JSON bodies, 204 for "no content", cookie session on the
// same origin, and errors shaped as { error, code?, message? } where `message` (when present)
// is the human text and `error` then carries the machine code.

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

function toInit(opts: RequestOptions): RequestInit {
  const headers = new Headers(opts.headers);
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(opts.json);
  } else if (opts.bytes !== undefined) {
    headers.set("content-type", "application/octet-stream");
    body = opts.bytes as BodyInit;
  }
  return { method: opts.method ?? "GET", headers, body, credentials: "include", keepalive: opts.keepalive, signal: opts.signal };
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await fetch(path, toInit(opts));
  const raw = await res.text();
  if (!res.ok) throw describeFailure(res, raw);
  return (raw ? JSON.parse(raw) : undefined) as T;
}

export async function requestBytes(path: string, opts: RequestOptions = {}): Promise<{ bytes: Uint8Array; headers: Headers }> {
  const res = await fetch(path, toInit(opts));
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

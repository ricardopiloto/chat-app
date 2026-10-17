// PiP scenario capture (2026-10-13). Polls CDP, records console/log, CPU profile,
// and a 1+1 heartbeat. Does not touch application code.
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const logPath = join(dir, "pip-console.log");
const statusPath = join(dir, "pip-status.txt");
const summaryPath = join(dir, "pip-summary.json");
mkdirSync(dir, { recursive: true });

const CDP = "http://127.0.0.1:9222/json";
const WAIT_TARGET_MS = 3 * 60 * 1000;
const RECORD_MS = 8 * 60 * 1000;
const POLL_MS = 2000;
const HEARTBEAT_GAP_MS = 3000;
const HEARTBEAT_TIMEOUT_MS = 15000;
const STOP_TIMEOUT_MS = 20000;

const sessions = new Map();
let recordDeadline = 0;
let freeze = null;
let stopping = false;

function stamp() {
  return new Date().toISOString();
}

function log(line) {
  const text = `${stamp()} ${line}\n`;
  appendFileSync(logPath, text);
  appendFileSync(statusPath, text);
  if (!line.startsWith("EVENT ")) console.log(text.trimEnd());
}

for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(sig, () => {
    log(`SIGNAL ${sig}`);
    try {
      writeSummary({ reason: `signal-${sig}` });
    } catch {
      // summary helper is defined below; ignore if this races startup
    }
    process.exit(1);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeSummary(extra) {
  writeFileSync(summaryPath, JSON.stringify({
    capturedAt: stamp(),
    waitTargetMs: WAIT_TARGET_MS,
    recordMs: RECORD_MS,
    heartbeatTimeoutMs: HEARTBEAT_TIMEOUT_MS,
    freeze,
    sessions: [...sessions.values()].map((session) => ({
      label: session.label,
      url: session.url,
      heartbeatOk: session.heartbeatOk,
      profileFile: session.profileFile ?? null,
      profileError: session.profileError ?? null,
    })),
    ...extra,
  }, null, 2));
}

async function listTargets() {
  const response = await fetch(CDP, { signal: AbortSignal.timeout(2000) });
  if (!response.ok) throw new Error(`${CDP} ${response.status}`);
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

function send(session, method, params, timeoutMs) {
  if (session.ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error(`socket not open ${method}`));
  }
  const id = ++session.nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      session.pending.delete(id);
      reject(new Error(`timeout ${timeoutMs}ms ${method}`));
    }, timeoutMs);
    session.pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    session.ws.send(JSON.stringify({ id, method, params }));
  });
}

function messageText(raw) {
  if (typeof raw === "string") return raw;
  if (Buffer.isBuffer(raw)) return raw.toString("utf8");
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString("utf8");
  return null;
}

function onMessage(session, raw) {
  const text = messageText(raw);
  if (text === null) return;
  let message;
  try {
    message = JSON.parse(text);
  } catch {
    return;
  }
  if (message.id && session.pending.has(message.id)) {
    const waiter = session.pending.get(message.id);
    session.pending.delete(message.id);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result ?? {});
    return;
  }
  if (!message.method) return;
  const method = message.method;
  if (
    method === "Console.messageAdded"
    || method === "Log.entryAdded"
    || method === "Runtime.consoleAPICalled"
    || method === "Runtime.exceptionThrown"
    || method === "Runtime.exceptionRevoked"
  ) {
    log(`EVENT ${session.label} ${method} ${JSON.stringify(message.params)}`);
  }
}

function rank(target) {
  const url = target.url ?? "";
  if (target.type !== "page" || !target.webSocketDebuggerUrl) return 100;
  if (url.includes("/call-popout/")) return 50;
  if (url.includes("devtools://")) return 40;
  if (url.includes("127.0.0.1:1421") || url.includes("localhost:1421")) return 0;
  return 10;
}

async function attach(target) {
  const key = target.id ?? target.webSocketDebuggerUrl;
  if (sessions.has(key) || !target.webSocketDebuggerUrl) return;
  const label = `${target.type}:${target.title || target.url || key}`.replace(/\s+/g, " ");
  const session = {
    key,
    label,
    url: target.url ?? "",
    title: target.title ?? "",
    nextId: 0,
    pending: new Map(),
    ws: new WebSocket(target.webSocketDebuggerUrl),
    started: false,
    heartbeatOk: 0,
    watching: false,
  };
  sessions.set(key, session);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ws open timeout ${label}`)), 5000);
    session.ws.addEventListener("open", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
    session.ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error(`ws error ${label}`));
    }, { once: true });
  });
  session.ws.addEventListener("message", (event) => onMessage(session, event.data));
  session.ws.addEventListener("close", () => {
    log(`CLOSED ${label}`);
    for (const waiter of session.pending.values()) waiter.reject(new Error(`socket closed during pending call`));
    session.pending.clear();
  });
  for (const method of ["Console.enable", "Log.enable", "Runtime.enable", "Profiler.enable"]) {
    await send(session, method, {}, 4000);
  }
  await send(session, "Profiler.start", {}, 4000);
  session.started = true;
  log(`ATTACHED ${label} url=${session.url}`);
  if (recordDeadline && !session.watching) {
    session.watching = true;
    void watch(session);
  }
}

let lastPollSignature = "";
let lastPollLog = 0;

async function pollOnce() {
  const targets = await listTargets();
  const pages = targets
    .filter((target) => target.webSocketDebuggerUrl)
    .sort((a, b) => rank(a) - rank(b));
  const signature = pages.map((target) => `${target.id}:${target.type}:${target.url || target.title || ""}`).join(" | ") || "(none)";
  const now = Date.now();
  if (signature !== lastPollSignature || now - lastPollLog > 30000) {
    log(`POLL targets=${pages.length} ${signature}`);
    lastPollSignature = signature;
    lastPollLog = now;
  }
  for (const target of pages) {
    if (rank(target) >= 100) continue;
    if (!sessions.has(target.id ?? target.webSocketDebuggerUrl)) {
      await attach(target);
    }
  }
  return pages.length;
}

function captureElectronPs(reason) {
  let output = "";
  try {
    output = execFileSync("bash", ["-lc", "ps aux | grep electron || true"], { encoding: "utf8" });
  } catch (error) {
    output = `ps failed: ${error.message}`;
  }
  const file = join(dir, reason === "freeze" ? "pip-ps-electron.txt" : "pip-ps-end.txt");
  writeFileSync(file, `${stamp()} reason=${reason}\n${output}`);
  log(`PS ${reason} file=${file} bytes=${Buffer.byteLength(output)}`);
  return file;
}

function stopProfiler(session) {
  if (!session.started) return Promise.resolve();
  if (session.stopPromise) return session.stopPromise;
  session.stopPromise = stopProfilerOnce(session);
  return session.stopPromise;
}

async function stopProfilerOnce(session) {
  const safe = session.label.replace(/[^\w.-]+/g, "_").slice(0, 80);
  try {
    const result = await send(session, "Profiler.stop", {}, STOP_TIMEOUT_MS);
    const profile = result.profile;
    const file = join(dir, `pip-${stamp().replace(/[:.]/g, "-")}-${safe}.cpuprofile`);
    writeFileSync(file, JSON.stringify(profile));
    session.profileFile = file;
    session.profileNodes = profile?.nodes?.length ?? 0;
    session.profileSamples = profile?.samples?.length ?? 0;
    log(`PROFILE ${session.label} file=${file} nodes=${session.profileNodes} samples=${session.profileSamples}`);
  } catch (error) {
    session.profileError = error.message;
    const file = join(dir, `pip-${stamp().replace(/[:.]/g, "-")}-${safe}.no-profile.txt`);
    writeFileSync(file, `${stamp()} ${session.label}\n${error.message}\n`);
    log(`PROFILE-FAIL ${session.label} ${error.message}`);
  }
}

async function onFreeze(session, sentAt) {
  if (freeze) return;
  const detectedAt = stamp();
  freeze = {
    detectedAt,
    evaluateSentAt: new Date(sentAt).toISOString(),
    unansweredMs: Date.now() - sentAt,
    target: session.label,
    url: session.url,
  };
  log(`possível travamento detectado ${detectedAt} target=${session.label} evaluate_sent_at=${freeze.evaluateSentAt} unanswered_ms=${freeze.unansweredMs}`);
  captureElectronPs("freeze");
  await stopProfiler(session);
  for (const other of sessions.values()) {
    if (other !== session) await stopProfiler(other);
  }
}

async function watch(session) {
  while (!stopping && !freeze && Date.now() < recordDeadline) {
    if (session.ws.readyState !== WebSocket.OPEN) {
      log(`HEARTBEAT-SKIP ${session.label} socket not open`);
      return;
    }
    const sentAt = Date.now();
    try {
      const result = await send(session, "Runtime.evaluate", {
        expression: "1+1",
        returnByValue: true,
      }, HEARTBEAT_TIMEOUT_MS);
      session.heartbeatOk += 1;
      const value = result?.result?.value;
      if (session.heartbeatOk === 1 || session.heartbeatOk % 10 === 0) {
        log(`HEARTBEAT ok ${session.label} n=${session.heartbeatOk} value=${value}`);
      }
    } catch (error) {
      const message = error.message ?? String(error);
      if (message.includes(`timeout ${HEARTBEAT_TIMEOUT_MS}ms`)) {
        await onFreeze(session, sentAt);
        return;
      }
      log(`HEARTBEAT-FAIL ${session.label} ${message}`);
      if (session.ws.readyState !== WebSocket.OPEN) return;
    }
    const remain = recordDeadline - Date.now();
    if (remain <= 0 || freeze) break;
    await sleep(Math.min(HEARTBEAT_GAP_MS, remain));
  }
}

async function finish(reason) {
  if (stopping) return;
  stopping = true;
  log(`FINISH ${reason}`);
  if (!freeze) captureElectronPs("end");
  for (const session of sessions.values()) await stopProfiler(session);
  for (const session of sessions.values()) {
    try {
      session.ws.close();
    } catch {
      // already closed
    }
  }
  writeSummary({ reason, recordDeadline: recordDeadline ? new Date(recordDeadline).toISOString() : null });
  log(`SUMMARY ${summaryPath}`);
}

writeFileSync(logPath, "");
writeFileSync(statusPath, "");
log(`pip-capture started wait<=${WAIT_TARGET_MS}ms record=${RECORD_MS}ms heartbeat=${HEARTBEAT_GAP_MS}ms/${HEARTBEAT_TIMEOUT_MS}ms endpoint=${CDP}`);

const waitStarted = Date.now();
let found = 0;
while (Date.now() - waitStarted < WAIT_TARGET_MS) {
  try {
    found = await pollOnce();
  } catch (error) {
    log(`POLL-WAIT ${error.message}`);
    found = 0;
  }
  if ([...sessions.values()].some((session) => session.started)) break;
  await sleep(POLL_MS);
}

if (![...sessions.values()].some((session) => session.started)) {
  log(`NO-TARGET after ${Date.now() - waitStarted}ms`);
  writeSummary({ reason: "no-target", waitedMs: Date.now() - waitStarted });
  process.exit(0);
}

recordDeadline = Date.now() + RECORD_MS;
log(`RECORDING until ${new Date(recordDeadline).toISOString()} sessions=${sessions.size}`);
for (const session of sessions.values()) {
  if (!session.watching) {
    session.watching = true;
    void watch(session);
  }
}

while (!freeze && Date.now() < recordDeadline) {
  await sleep(POLL_MS);
  if (stopping) break;
  try {
    await pollOnce();
  } catch (error) {
    log(`POLL-FAIL ${error.message}`);
  }
}

await finish(freeze ? "freeze" : "time-limit");
process.exit(freeze ? 2 : 0);

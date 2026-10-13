// Records CDP console logs and a CPU profile for every Electron page (and the main
// process inspector) until evidence/STOP appears. Then Profiler.stop() is attempted
// on each target; a timeout is recorded when the target does not answer.
import { appendFileSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const logPath = join(dir, "console.log");
const statusPath = join(dir, "status.txt");
const stopPath = join(dir, "STOP");
mkdirSync(dir, { recursive: true });

const endpoints = ["http://127.0.0.1:9222", "http://127.0.0.1:9229"];
const sessions = new Map();
let stopping = false;

function stamp() {
  return new Date().toISOString();
}

function log(line) {
  appendFileSync(logPath, `${stamp()} ${line}\n`);
}

function status(line) {
  writeFileSync(statusPath, `${stamp()} ${line}\n`);
  log(`STATUS ${line}`);
}

async function listTargets(base) {
  const response = await fetch(`${base}/json/list`, { signal: AbortSignal.timeout(2000) });
  if (!response.ok) throw new Error(`${base} ${response.status}`);
  return response.json();
}

function interesting(target) {
  return target.webSocketDebuggerUrl && (target.type === "page" || target.type === "node" || target.type === "browser");
}

function send(session, method, params, timeoutMs) {
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

function onMessage(session, raw) {
  let message;
  try {
    message = JSON.parse(raw);
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
  if (method === "Console.messageAdded" || method === "Log.entryAdded" || method === "Runtime.consoleAPICalled" || method === "Runtime.exceptionThrown" || method === "Runtime.exceptionRevoked") {
    log(`EVENT ${session.label} ${method} ${JSON.stringify(message.params)}`);
  }
}

async function attach(base, target) {
  const key = target.id ?? target.webSocketDebuggerUrl;
  if (sessions.has(key)) return;
  const label = `${target.type}:${target.title || target.url || key}`;
  const session = {
    key,
    label,
    base,
    nextId: 0,
    pending: new Map(),
    ws: new WebSocket(target.webSocketDebuggerUrl),
    started: false,
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
    sessions.delete(key);
  });
  const domains = target.type === "node"
    ? ["Runtime.enable", "Profiler.enable"]
    : ["Console.enable", "Log.enable", "Runtime.enable", "Profiler.enable"];
  try {
    for (const method of domains) await send(session, method, {}, 4000);
    await send(session, "Profiler.start", {}, 4000);
    session.started = true;
    log(`ATTACHED ${label} url=${target.url ?? ""}`);
  } catch (error) {
    sessions.delete(key);
    session.ws.close();
    throw error;
  }
}

async function poll() {
  const found = [];
  for (const base of endpoints) {
    try {
      const targets = await listTargets(base);
      for (const target of targets) {
        if (!interesting(target)) continue;
        found.push(`${target.type}:${target.title || target.url || target.id}`);
        if (!sessions.has(target.id ?? target.webSocketDebuggerUrl)) {
          await attach(base, target).catch((error) => log(`ATTACH-FAIL ${target.url ?? target.id} ${error.message}`));
        }
      }
    } catch (error) {
      log(`LIST-FAIL ${base} ${error.message}`);
    }
  }
  status(`attached=${sessions.size} targets=${found.join(" | ") || "(none)"}`);
}

function processSnapshot() {
  try {
    const listing = execFileSync("ps", ["-eo", "pid,stat,pcpu,pmem,wchan:20,args"], { encoding: "utf8" });
    const lines = listing.split("\n").filter((line) => /electron|mesa-chat|capture\.mjs/.test(line));
    writeFileSync(join(dir, "ps.txt"), `${stamp()}\n${lines.join("\n")}\n`);
    const pids = [];
    for (const line of lines) {
      const match = /^\s*(\d+)/.exec(line);
      if (!match) continue;
      const pid = match[1];
      if (line.includes("--type=renderer") || line.includes("electron/dist/main.js") || line.includes(" type=renderer")) pids.push(pid);
    }
    let proc = "";
    for (const pid of pids) {
      try {
        const text = readFileSync(`/proc/${pid}/status`, "utf8");
        const state = text.split("\n").find((row) => row.startsWith("State:")) ?? "State: ?";
        proc += `pid ${pid} ${state}\n`;
      } catch (error) {
        proc += `pid ${pid} unreadable ${error.message}\n`;
      }
    }
    writeFileSync(join(dir, "proc-status.txt"), `${stamp()}\n${proc}`);
  } catch (error) {
    log(`PS-FAIL ${error.message}`);
  }
}

async function stopOne(session) {
  if (!session.started) {
    log(`STOP-SKIP ${session.label} profiler was not started`);
    return;
  }
  const safe = session.label.replace(/[^\w.-]+/g, "_").slice(0, 80);
  try {
    const result = await send(session, "Profiler.stop", {}, 15000);
    const profile = result.profile;
    const file = join(dir, `${stamp().replace(/[:.]/g, "-")}-${safe}.cpuprofile`);
    writeFileSync(file, JSON.stringify(profile));
    const nodes = profile?.nodes?.length ?? 0;
    const samples = profile?.samples?.length ?? 0;
    log(`PROFILE ${session.label} file=${file} nodes=${nodes} samples=${samples}`);
  } catch (error) {
    log(`PROFILE-TIMEOUT ${session.label} ${error.message} — target did not answer Profiler.stop`);
    writeFileSync(join(dir, `${stamp().replace(/[:.]/g, "-")}-${safe}.no-profile.txt`), `${stamp()} ${session.label}\n${error.message}\n`);
  }
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  log("STOP requested");
  processSnapshot();
  const current = [...sessions.values()];
  for (const session of current) await stopOne(session);
  log("STOP finished");
  process.exit(0);
}

log("capture started");
if (existsSync(stopPath)) log("STOP already present; ignoring until removed and recreated");
let sawStop = existsSync(stopPath);
setInterval(() => {
  if (stopping) return;
  const present = existsSync(stopPath);
  if (present && !sawStop) void shutdown();
  sawStop = present;
}, 400);
setInterval(() => {
  if (!stopping) void poll();
}, 1000);
void poll();
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

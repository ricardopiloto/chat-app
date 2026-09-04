import { captureLocal } from "./media";
import { publishLocal, wireRoom } from "./livekit";
import { fetchJoinToken } from "./token";
import { dumpIce } from "./ice";
import { probeEncodedTransform } from "./e2ee-probe";
import { createE2eeRoom } from "./e2ee";
import { xorLoopbackRoundTrip } from "./e2ee-xor";
import { attachVideo, clearSlot } from "./grid";
import type { Room } from "livekit-client";

const logEl = () => document.getElementById("log") as HTMLElement;
const iceEl = () => document.getElementById("ice") as HTMLElement;
const e2eeEl = () => document.getElementById("e2ee") as HTMLElement;

function log(line: string): void {
  logEl().textContent += `${line}\n`;
}

let room: Room | undefined;
let localStream: MediaStream | undefined;

function identity(): string {
  return (document.getElementById("identity") as HTMLSelectElement).value;
}

async function join(): Promise<void> {
  await leave();
  const id = identity();
  const urlInput = (document.getElementById("url") as HTMLInputElement).value.trim();
  const useSvc = (document.getElementById("useTokenSvc") as HTMLInputElement).checked;
  const e2eeOn = (document.getElementById("e2eeOn") as HTMLInputElement).checked;
  let token: string;
  let url = urlInput;

  if (useSvc) {
    const base = (document.getElementById("tokenUrl") as HTMLInputElement).value.trim();
    const res = await fetchJoinToken(base, id);
    token = res.token;
    url =
      window.location.protocol === "https:"
        ? `wss://${window.location.host}`
        : res.url;
    log(`token from POST /token signaling=${url}`);
  } else {
    token = (document.getElementById("jwt") as HTMLInputElement).value.trim();
    if (!token) throw new Error("cole um JWT (mint-dev-token) ou ligue usar POST /token");
  }

  localStream = await captureLocal(log);
  if (e2eeOn) {
    room = await createE2eeRoom();
    log("E2EE enabled (test key)");
  } else {
    const { Room } = await import("livekit-client");
    room = new Room({ adaptiveStream: true, dynacast: true });
  }
  wireRoom(room, id, log);
  await room.connect(url, token);
  await publishLocal(room, localStream, id);
  log(`joined as ${id} url=${url}`);
}

async function leave(): Promise<void> {
  const id = identity();
  if (room) {
    await room.disconnect();
    room = undefined;
  }
  localStream?.getTracks().forEach((t) => t.stop());
  localStream = undefined;
  clearSlot(id);
}

function $id(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el;
}

const pageHost = window.location.hostname || "127.0.0.1";
const secure = window.location.protocol === "https:";
($id("tokenUrl") as HTMLInputElement).value = secure
  ? window.location.origin
  : `http://${pageHost}:8080`;
($id("url") as HTMLInputElement).value = secure
  ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`
  : `ws://${pageHost}:7880`;

$id("join").addEventListener("click", () => {
  join().catch((e) => log(String(e)));
});
$id("leave").addEventListener("click", () => {
  leave().catch((e) => log(String(e)));
});
$id("probe").addEventListener("click", () => {
  const r = probeEncodedTransform();
  e2eeEl().textContent = JSON.stringify(r, null, 2);
  log(`probe ${JSON.stringify(r)}`);
});
$id("xor").addEventListener("click", () => {
  xorLoopbackRoundTrip()
    .then((r) => {
      e2eeEl().textContent += `\nXOR ${r.ok}: ${r.detail}`;
      log(`xor ${r.ok} ${r.detail}`);
    })
    .catch((e) => log(String(e)));
});
$id("ice").addEventListener("click", () => {
  if (!room) {
    iceEl().textContent = "not connected";
    return;
  }
  dumpIce(room)
    .then((lines) => {
      iceEl().textContent = lines.join("\n") || "(empty)";
    })
    .catch((e) => {
      iceEl().textContent = String(e);
    });
});

attachVideo("alice", null);
attachVideo("bob", null);

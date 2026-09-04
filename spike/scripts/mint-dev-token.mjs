#!/usr/bin/env node
/**
 * Onda 1 only: mint a LiveKit JWT with the test API secret.
 * Do not ship this secret in the Tauri bundle (US4 uses POST /token).
 */
import { createHmac } from "node:crypto";

const apiKey = process.env.LIVEKIT_API_KEY ?? "spikekey";
const apiSecret =
  process.env.LIVEKIT_API_SECRET ?? "spikesecretspikesecretspikesecret";
const identity = process.argv[2] || "alice";
const room = process.argv[3] || "spike-room";

function b64url(value) {
  const buf = Buffer.from(
    typeof value === "string" ? value : JSON.stringify(value),
  );
  return buf.toString("base64url");
}

const now = Math.floor(Date.now() / 1000);
const header = { alg: "HS256", typ: "JWT" };
const payload = {
  iss: apiKey,
  sub: identity,
  name: identity,
  nbf: now - 10,
  exp: now + 600,
  video: {
    room: room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  },
};
const data = `${b64url(header)}.${b64url(payload)}`;
const sig = createHmac("sha256", apiSecret).update(data).digest("base64url");
process.stdout.write(`${data}.${sig}\n`);

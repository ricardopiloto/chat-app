import { ExternalE2EEKeyProvider, Room } from "livekit-client";

/** Shared test key — not a product protocol. Same value on alice and bob. */
export const SPIKE_E2EE_KEY = "spike-fase0-test-key";

export async function createE2eeRoom(): Promise<Room> {
  const keyProvider = new ExternalE2EEKeyProvider();
  await keyProvider.setKey(SPIKE_E2EE_KEY);
  let worker: Worker | undefined;
  try {
    worker = new Worker(
      new URL("livekit-client/e2ee-worker", import.meta.url),
      { type: "module" },
    );
  } catch (err) {
    throw new Error(`e2ee worker failed to start: ${err}`);
  }
  const room = new Room({
    encryption: { keyProvider, worker },
    adaptiveStream: true,
    dynacast: true,
  });
  await room.setE2EEEnabled(true);
  return room;
}

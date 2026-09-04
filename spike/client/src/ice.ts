import type { Room } from "livekit-client";

type EngineRoom = {
  engine?: {
    pcManager?: {
      publisher?: { pc?: RTCPeerConnection };
      subscriber?: { pc?: RTCPeerConnection };
    };
  };
};

export async function dumpIce(room: Room): Promise<string[]> {
  const lines: string[] = [];
  const pcs = [
    (room as unknown as EngineRoom).engine?.pcManager?.publisher?.pc,
    (room as unknown as EngineRoom).engine?.pcManager?.subscriber?.pc,
  ].filter((pc): pc is RTCPeerConnection => !!pc);

  if (pcs.length === 0) {
    lines.push("no RTCPeerConnection exposed on room.engine; ICE dump skipped");
    return lines;
  }

  for (const pc of pcs) {
    const stats = await pc.getStats();
    stats.forEach((r) => {
      const rec = r as { type: string; candidateType?: string; protocol?: string; state?: string; nominated?: boolean };
      if (rec.type === "local-candidate") {
        lines.push(`local ${rec.candidateType ?? "?"} ${rec.protocol ?? ""}`);
      }
      if (rec.type === "remote-candidate") {
        lines.push(`remote ${rec.candidateType ?? "?"} ${rec.protocol ?? ""}`);
      }
      if (rec.type === "candidate-pair" && rec.nominated) {
        lines.push(`nominated pair state=${rec.state ?? "?"}`);
      }
    });
  }
  return lines;
}

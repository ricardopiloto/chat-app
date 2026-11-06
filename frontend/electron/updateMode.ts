import { dirname, isAbsolute, join } from "node:path";

export type UpdateMode = "auto" | "notify" | "off";

export function resolveUpdateMode(input: {
  platform: NodeJS.Platform;
  isPackaged: boolean;
  env: NodeJS.ProcessEnv;
  execPath: string;
  fileExists: (path: string) => boolean;
  isWritable: (path: string) => boolean;
}): UpdateMode {
  if (!input.isPackaged) return "off";
  if (input.platform === "win32") {
    return input.fileExists(join(dirname(input.execPath), "Uninstall Parley.exe")) ? "auto" : "notify";
  }
  if (input.platform === "linux") {
    const appImage = input.env.APPIMAGE;
    return appImage && isAbsolute(appImage) && input.isWritable(dirname(appImage)) ? "auto" : "notify";
  }
  return "notify";
}

function versionParts(value: string): number[] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value);
  return match ? match.slice(1).map(Number) : null;
}

export function isNewerVersion(candidate: string, current: string): boolean {
  const next = versionParts(candidate);
  const installed = versionParts(current);
  if (!next || !installed) return false;
  for (let index = 0; index < 3; index++) {
    if (next[index] !== installed[index]) return next[index] > installed[index];
  }
  return false;
}

export function parseReleaseTag(location: string, origin = "https://github.com"): { version: string; url: string } | null {
  try {
    const base = new URL(origin);
    const url = new URL(location, base);
    if (url.origin !== base.origin || url.search || url.hash) return null;
    const match = /^\/ricardopiloto\/chat-app\/releases\/tag\/v(\d+\.\d+\.\d+)$/.exec(url.pathname);
    return match ? { version: match[1], url: url.href } : null;
  } catch { return null; }
}

export function isLoopbackFeedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
      !url.username && !url.password;
  } catch { return false; }
}

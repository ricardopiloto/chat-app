export type EntryPhase = "loading" | "anonymous" | "locked" | "ready";
export type NativeEntry = "home" | "login" | "register";
export type EntryDestination = "home-web" | "home-desktop" | "auth" | "recover" | "invite" | "foundation" | "terms" | "privacy" | "call-popout" | "loading" | "unlock" | "app";

export function entryScreen(input: {
  native: boolean;
  baseUrl: string | null;
  phase: EntryPhase;
  pathname: string;
  search: string;
  hash: string;
  initialSetup?: boolean;
  nativeEntry: NativeEntry;
}): EntryDestination {
  const { native, baseUrl, phase, pathname, search, hash, initialSetup, nativeEntry } = input;
  if (pathname === "/__foundation") return "foundation";
  if (pathname === "/terms") return "terms";
  if (pathname === "/privacy") return "privacy";
  if (native && !baseUrl) return "home-desktop";
  if (phase === "loading") return "loading";
  if (pathname.startsWith("/invite/") && !search.includes("signin") && (phase === "anonymous" || phase === "ready")) return "invite";
  if (phase === "anonymous") {
    if (pathname === "/recover") return "recover";
    if (new URLSearchParams(search).has("invite") || pathname === "/register" || pathname === "/login" || search.includes("signin") || hash.includes("email_token=")) return "auth";
    if (native) return nativeEntry === "home" ? "home-desktop" : "auth";
    return pathname === "/" && initialSetup !== true ? "home-web" : "auth";
  }
  if ((phase === "locked" || phase === "ready") && (/^\/call-popout\/[^/]+/.test(pathname) || /^#\/call-popout\/[^/]+/.test(hash))) return "call-popout";
  if (phase === "locked") return "unlock";
  return "app";
}

import { app, BrowserWindow, desktopCapturer, ipcMain, net, protocol, session, shell } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEV_URL = "https://127.0.0.1:1421";
const APP_ORIGIN = "mesa://app";
const BACKGROUND = "#10131c";
const INSTANCE_FILE = "mesa-instance.json";
const LATEST_RELEASE = "https://api.github.com/repos/ricardopiloto/chat-app/releases/latest";
const UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000;

interface InstanceState {
  baseUrl: string | null;
  sessionToken: string | null;
}

const isDev = process.env.MESA_ELECTRON_DEV === "1";
let instance: InstanceState = { baseUrl: null, sessionToken: null };
let availableUpdate: { version: string; url: string } | null = null;

function versionParts(value: string): number[] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] ? Number(match[4]) : 0];
}

function isNewerVersion(candidate: string, current: string): boolean {
  const next = versionParts(candidate);
  const installed = versionParts(current);
  if (!next || !installed) return false;
  for (let index = 0; index < 4; index++) {
    if (next[index] !== installed[index]) return next[index] > installed[index];
  }
  return false;
}

async function checkForUpdate(): Promise<void> {
  try {
    const response = await net.fetch(LATEST_RELEASE, {
      headers: { Accept: "application/vnd.github+json", "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`GitHub releases returned ${response.status}`);
    const release = await response.json() as { tag_name?: unknown; html_url?: unknown; draft?: unknown; prerelease?: unknown };
    if (release.draft || release.prerelease || typeof release.tag_name !== "string" || typeof release.html_url !== "string") return;
    if (!isNewerVersion(release.tag_name, app.getVersion())) return;
    const url = new URL(release.html_url);
    if (url.protocol !== "https:" || url.hostname !== "github.com" || !url.pathname.startsWith("/ricardopiloto/chat-app/releases/tag/")) return;
    availableUpdate = { version: release.tag_name.replace(/^v/, ""), url: url.href };
    for (const window of BrowserWindow.getAllWindows()) window.webContents.send("mesa:update-available", availableUpdate);
  } catch (error) {
    console.warn("update check failed", error);
  }
}

function registerUpdateIpc(): void {
  ipcMain.handle("mesa:available-update", () => availableUpdate);
}

function instancePath(): string {
  return join(app.getPath("userData"), INSTANCE_FILE);
}

async function readInstance(): Promise<InstanceState> {
  try {
    const raw = JSON.parse(await readFile(instancePath(), "utf8")) as Partial<InstanceState>;
    return {
      baseUrl: typeof raw.baseUrl === "string" && raw.baseUrl.length > 0 ? raw.baseUrl : null,
      sessionToken: typeof raw.sessionToken === "string" && raw.sessionToken.length > 0 ? raw.sessionToken : null,
    };
  } catch {
    return { baseUrl: null, sessionToken: null };
  }
}

async function writeInstance(next: InstanceState): Promise<void> {
  instance = next;
  const path = instancePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(next), "utf8");
  applyAuthFilter();
}

function applyAuthFilter(): void {
  // Only requests to the configured instance enter this callback. Replacing the
  // listener also replaces the URL filter, so a switch of instance stops the
  // previous origin from receiving the token.
  const urls = instance.baseUrl ? [`${instance.baseUrl}/*`] : ["https://mesa.invalid/*"];
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls }, (details, callback) => {
    const headers = { ...details.requestHeaders };
    if (instance.sessionToken && instance.baseUrl && details.url.startsWith(instance.baseUrl)) {
      delete headers.authorization;
      delete headers.Authorization;
      headers.Authorization = `Bearer ${instance.sessionToken}`;
    }
    callback({ requestHeaders: headers });
  });
}

function distDirectory(): string {
  const root = fileURLToPath(new URL("../../dist/", import.meta.url));
  return root.endsWith(sep) ? root : `${root}${sep}`;
}

// Production loads the Vite build, whose script and stylesheet URLs are absolute (`/assets/...`).
// `file://` resolves those against the filesystem root, so the window stays blank. A standard
// scheme keeps the same URLs and maps them onto the packaged `dist` directory.
function registerAppProtocol(): void {
  const root = distDirectory();
  protocol.handle("mesa", (request) => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response("bad request", { status: 400 });
    }
    const file = normalize(join(root, pathname.replace(/^\/+/, "")));
    if (file !== root.slice(0, -1) && !file.startsWith(root)) {
      return new Response("not found", { status: 404 });
    }
    return net.fetch(pathToFileURL(file).href);
  });
}

function isAppDocument(url: string): boolean {
  try {
    const origin = isDev ? new URL(DEV_URL).origin : APP_ORIGIN;
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function openOutside(url: string): void {
  if (isAppDocument(url)) return;
  void shell.openExternal(url);
}

function createWindow(): BrowserWindow {
  const icon = join(dirname(fileURLToPath(import.meta.url)), "../icons/icon.png");
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: BACKGROUND,
    icon,
    // Native window decorations are the default; do not set frame: false.
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // The document is always this app's own package. Same-origin policy is off
      // only so that package can call the instance the user configured at runtime.
      // External navigations are refused below and opened in the system browser.
      webSecurity: false,
      preload: fileURLToPath(new URL("./preload.cjs", import.meta.url)),
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (isAppDocument(url)) return;
    event.preventDefault();
    openOutside(url);
  });

  if (isDev) {
    void win.loadURL(DEV_URL);
  } else {
    void win.loadURL(`${APP_ORIGIN}/index.html`);
  }
  return win;
}

function onWayland(): boolean {
  return Boolean(process.env.WAYLAND_DISPLAY);
}

// Chromium inside Electron has no screen picker of its own. getDisplayMedia stays
// refused until this process hands back a DesktopCapturer source. On Wayland the
// system portal is already that picker, so a single returned source is granted.
// On X11 the capturer lists every screen and window, and this window is the picker.
function installScreenShare(): void {
  let queue: Promise<void> = Promise.resolve();
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    const run = queue.then(() => fulfillScreenShare(request, callback));
    queue = run.then(
      () => undefined,
      () => undefined,
    );
  });
}

async function fulfillScreenShare(
  request: Electron.DisplayMediaRequestHandlerHandlerRequest,
  callback: (streams: Electron.Streams) => void,
): Promise<void> {
  if (!request.videoRequested) {
    callback({});
    return;
  }
  let sources: Electron.DesktopCapturerSource[];
  try {
    sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: onWayland() ? { width: 0, height: 0 } : { width: 320, height: 180 },
      fetchWindowIcons: false,
    });
  } catch (error) {
    console.error("screen share sources failed", error);
    callback({});
    return;
  }
  const chosen =
    onWayland() && sources.length === 1 ? sources[0] : await pickScreenSource(sources);
  if (!chosen) {
    callback({});
    return;
  }
  callback({ video: { id: chosen.id, name: chosen.name } });
}

function pickScreenSource(
  sources: Electron.DesktopCapturerSource[],
): Promise<Electron.DesktopCapturerSource | undefined> {
  const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  const picker = new BrowserWindow({
    parent,
    modal: Boolean(parent),
    width: 760,
    height: 560,
    minWidth: 480,
    minHeight: 360,
    backgroundColor: BACKGROUND,
    autoHideMenuBar: true,
    title: "Compartilhar a tela",
    webPreferences: {
      // Local dialog only. Navigation away from this file is refused below.
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });
  picker.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  picker.webContents.on("will-navigate", (event) => event.preventDefault());

  return new Promise((resolve) => {
    let settled = false;
    const finish = (source: Electron.DesktopCapturerSource | undefined) => {
      if (settled) return;
      settled = true;
      ipcMain.removeListener("mesa:screen-pick", onPick);
      resolve(source);
      if (!picker.isDestroyed()) picker.close();
    };
    const onPick = (event: Electron.IpcMainEvent, id: unknown) => {
      if (event.sender.id !== picker.webContents.id) return;
      finish(typeof id === "string" ? sources.find((source) => source.id === id) : undefined);
    };
    ipcMain.on("mesa:screen-pick", onPick);
    picker.on("closed", () => finish(undefined));
    void picker.loadFile(fileURLToPath(new URL("./screen-picker.html", import.meta.url))).then(() => {
      if (picker.isDestroyed()) return;
      picker.webContents.send(
        "mesa:screen-sources",
        sources.map((source) => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.isEmpty() ? "" : source.thumbnail.toDataURL(),
        })),
      );
    });
  });
}

interface PopoutRequest {
  channelId: string;
  serverId: string;
  e2ee: boolean;
  serverKey: string | null;
}

let popout: BrowserWindow | null = null;
let popoutHandoff: PopoutRequest | null = null;
let popoutOpener: Electron.WebContents | null = null;

function readPopoutRequest(value: unknown): PopoutRequest | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.channelId !== "string" || raw.channelId.length === 0) return null;
  if (typeof raw.serverId !== "string" || raw.serverId.length === 0) return null;
  if (typeof raw.e2ee !== "boolean") return null;
  const serverKey = typeof raw.serverKey === "string" && raw.serverKey.length > 0 ? raw.serverKey : null;
  if (raw.serverKey != null && serverKey === null) return null;
  return { channelId: raw.channelId, serverId: raw.serverId, e2ee: raw.e2ee, serverKey };
}

function tellOpener(channel: "mesa:call-popout-opened" | "mesa:call-popout-closed", channelId: string): void {
  if (popoutOpener && !popoutOpener.isDestroyed()) popoutOpener.send(channel, channelId);
}

function registerPopoutIpc(): void {
  ipcMain.handle("mesa:open-call-popout", (event, payload: unknown) => {
    const request = readPopoutRequest(payload);
    if (!request) throw new Error("invalid call popout request");
    popoutHandoff = request;
    popoutOpener = event.sender;
    const route = `/call-popout/${encodeURIComponent(request.channelId)}`;
    if (popout && !popout.isDestroyed()) {
      if (isDev) void popout.loadURL(`${DEV_URL}${route}`);
      else void popout.loadURL(`${APP_ORIGIN}/index.html#${route}`);
      popout.focus();
      tellOpener("mesa:call-popout-opened", request.channelId);
      return;
    }
    const icon = join(dirname(fileURLToPath(import.meta.url)), "../icons/icon.png");
    const window = new BrowserWindow({
      width: 960,
      height: 640,
      minWidth: 240,
      minHeight: 180,
      backgroundColor: BACKGROUND,
      icon,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false,
        preload: fileURLToPath(new URL("./preload.cjs", import.meta.url)),
      },
    });
    popout = window;
    window.on("closed", () => {
      const channelId = popoutHandoff?.channelId ?? request.channelId;
      popout = null;
      popoutHandoff = null;
      tellOpener("mesa:call-popout-closed", channelId);
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
      openOutside(url);
      return { action: "deny" };
    });
    window.webContents.on("will-navigate", (nav, url) => {
      if (isAppDocument(url)) return;
      nav.preventDefault();
      openOutside(url);
    });
    if (isDev) {
      void window.loadURL(`${DEV_URL}${route}`);
    } else {
      void window.loadURL(`${APP_ORIGIN}/index.html#${route}`);
    }
    tellOpener("mesa:call-popout-opened", request.channelId);
  });

  ipcMain.handle("mesa:close-call-popout", () => {
    if (popout && !popout.isDestroyed()) popout.close();
  });

  ipcMain.handle("mesa:take-call-popout", () => popoutHandoff);
}

function registerInstanceIpc(): void {
  ipcMain.handle("mesa:load-instance", () => instance);
  ipcMain.handle("mesa:save-instance-url", (_event, url: string) => writeInstance({ ...instance, baseUrl: url }));
  ipcMain.handle("mesa:save-session-token", (_event, token: string) => writeInstance({ ...instance, sessionToken: token }));
  ipcMain.handle("mesa:clear-session-token", () => writeInstance({ ...instance, sessionToken: null }));
  ipcMain.handle("mesa:clear-instance", () => writeInstance({ baseUrl: null, sessionToken: null }));
}

if (process.platform === "linux") {
  // Wayland screen capture goes through PipeWire. The switch is ignored where X11 is the capturer.
  app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");
}

// This Chromium build's HTTP/3 can take about a minute to deliver a response that
// HTTP/2 returns immediately. Session restore waits on that request, so the window
// stays on the loading screen. WebRTC media does not use QUIC.
app.commandLine.appendSwitch("disable-quic");

if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "mesa",
      privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
    },
  ]);
}

app.whenReady().then(async () => {
  if (isDev) {
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      if (request.hostname === "127.0.0.1" || request.hostname === "localhost") callback(0);
      else callback(-3);
    });
  }
  if (!isDev) registerAppProtocol();
  instance = await readInstance();
  applyAuthFilter();
  installScreenShare();
  registerInstanceIpc();
  registerPopoutIpc();
  registerUpdateIpc();
  createWindow();
  if (!isDev) {
    void checkForUpdate();
    const timer = setInterval(() => void checkForUpdate(), UPDATE_INTERVAL_MS);
    app.on("before-quit", () => clearInterval(timer));
  }
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

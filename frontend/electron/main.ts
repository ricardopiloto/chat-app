import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, Menu, nativeImage, net, Notification, protocol, session, shell, Tray } from "electron";
import { access, appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { accessSync, constants, createWriteStream, existsSync } from "node:fs";
import { dirname, join, normalize, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { promisify } from "node:util";
import { runLegacyCleanup, type LegacyPlatform } from "./legacy-cleanup.js";
import { isLoopbackFeedUrl, isNewerVersion, parseReleaseTag, resolveUpdateMode } from "./updateMode.js";
import updater from "electron-updater";

const { autoUpdater } = updater;

const execFileAsync = promisify(execFile);
const DEV_URL = "https://127.0.0.1:1421";
const APP_ORIGIN = "mesa://app";
const BACKGROUND = "#10131c";
const INSTANCE_FILE = "mesa-instance.json";
const LATEST_RELEASE = "https://github.com/ricardopiloto/chat-app/releases/latest";

/** Main BrowserWindow kept for tray / activate / OS notifications. */
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function electronIconsDir(): string {
  // Packaged: electron/dist/main.js → ../icons (and asarUnpack → app.asar.unpacked/…).
  // Dev: same relative layout under frontend/electron/.
  const besideMain = join(dirname(fileURLToPath(import.meta.url)), "../icons");
  if (existsSync(join(besideMain, "icon.png"))) return besideMain;
  const unpacked = besideMain.replace(`${sep}app.asar${sep}`, `${sep}app.asar.unpacked${sep}`);
  if (unpacked !== besideMain && existsSync(join(unpacked, "icon.png"))) return unpacked;
  return besideMain;
}

function appIconPath(): string {
  return join(electronIconsDir(), "icon.png");
}

function trayIconPath(): string {
  const dir = electronIconsDir();
  if (process.platform === "darwin") return join(dir, "16x16.png");
  if (process.platform === "win32") return join(dir, "32x32.png");
  // StatusNotifier / AppIndicator: 22–32px PNGs are the most reliable on Linux trays.
  return join(dir, "32x32.png");
}

function loadTrayImage(): Electron.NativeImage {
  const candidates = [trayIconPath(), appIconPath(), join(electronIconsDir(), "24x24.png"), join(electronIconsDir(), "48x48.png")];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const image = nativeImage.createFromPath(path);
    if (!image.isEmpty()) return process.platform === "linux" ? image.resize({ width: 32, height: 32 }) : image;
  }
  console.warn("tray icon missing; tray may be invisible", { dir: electronIconsDir() });
  return nativeImage.createEmpty();
}

function trayLabels(): { open: string; quit: string; tooltip: string } {
  const locale = app.getLocale().toLowerCase();
  if (locale.startsWith("en")) return { open: "Open", quit: "Quit", tooltip: "Parley" };
  return { open: "Abrir", quit: "Fechar", tooltip: "Parley" };
}

function showMainWindow(): void {
  const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  if (typeof win.setSkipTaskbar === "function") win.setSkipTaskbar(false);
}

function quitFromTray(): void {
  isQuitting = true;
  app.quit();
}

function createTray(): void {
  if (tray) return;
  tray = new Tray(loadTrayImage());
  const labels = trayLabels();
  tray.setToolTip(labels.tooltip);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: labels.open, click: () => showMainWindow() },
      { label: labels.quit, click: () => quitFromTray() },
    ]),
  );
  // Windows/Linux: click opens. macOS uses the menu bar menu as the primary affordance.
  if (process.platform !== "darwin") {
    tray.on("click", () => showMainWindow());
  }
}

function attachMainWindowLifecycle(win: BrowserWindow): void {
  win.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    win.hide();
  });
}

function registerNotifyOsIpc(): void {
  ipcMain.removeHandler("mesa:notify-os");
  ipcMain.handle("mesa:notify-os", (_event, payload: unknown) => {
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
    if (!win || win.isFocused()) return;
    if (!Notification.isSupported()) return;
    if (!payload || typeof payload !== "object") return;
    const raw = payload as Record<string, unknown>;
    const title = typeof raw.title === "string" ? raw.title : "";
    const body = typeof raw.body === "string" ? raw.body : "";
    if (!title && !body) return;
    try {
      const note = new Notification({
        title: title || "Parley",
        body,
        icon: appIconPath(),
      });
      note.on("click", () => showMainWindow());
      note.show();
    } catch (error) {
      console.warn("OS notification failed", error);
    }
  });
}

interface InstanceState {
  baseUrl: string | null;
  sessionToken: string | null;
}

const isDev = process.env.PARLEY_ELECTRON_DEV === "1";
let instance: InstanceState = { baseUrl: null, sessionToken: null };
type UpdateState = { kind: "notify" | "ready"; version: string; url: string };
let availableUpdate: UpdateState | null = null;
let restartRequested = false;

function publishUpdate(state: UpdateState): void {
  availableUpdate = state;
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send("mesa:update-state", state);
}

function updateFeed(): string | null {
  const feed = process.env.PARLEY_UPDATE_FEED_URL;
  if (!feed) return null;
  if (isLoopbackFeedUrl(feed)) return feed;
  console.warn("Ignoring non-loopback update feed");
  return null;
}

function releaseUrl(version: string, origin: string): string {
  return new URL(`/ricardopiloto/chat-app/releases/tag/v${version}`, origin).href;
}

async function checkForUpdate(feed: string | null): Promise<void> {
  try {
    const endpoint = feed && isLoopbackFeedUrl(feed) ? new URL("releases/latest", feed.endsWith("/") ? feed : `${feed}/`).href : LATEST_RELEASE;
    const redirectUrl = await new Promise<string | null>(resolve => {
      const request = net.request({ url: endpoint, redirect: "manual" });
      let settled = false;
      const finish = (url: string | null): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(url);
      };
      const timeout = setTimeout(() => {
        finish(null);
        request.abort();
        console.warn("update check timed out");
      }, 10_000);
      request.on("redirect", (_status, _method, url) => {
        finish(url);
        request.abort();
      });
      request.on("response", response => {
        if (response.statusCode !== 200) console.warn("unexpected update response", response.statusCode);
        finish(null);
        request.abort();
      });
      request.on("error", error => {
        if (!settled) console.warn("update check failed", error);
        finish(null);
      });
      request.end();
    });
    const release = redirectUrl && parseReleaseTag(redirectUrl, feed ? new URL(feed).origin : undefined);
    if (!release || !isNewerVersion(release.version, app.getVersion())) return;
    publishUpdate({ kind: "notify", ...release });
  } catch (error) {
    console.warn("update check failed", error);
  }
}

async function checkAutomatically(feed: string | null): Promise<void> {
  const origin = feed ? new URL(feed).origin : "https://github.com";
  let candidate: string | null = null;
  let failed = false;
  let writeLog = (level: string, message: unknown): void => { console.warn(`updater ${level}`, message); };
  try {
    const logDir = app.getPath("logs");
    await mkdir(logDir, { recursive: true });
    const log = createWriteStream(join(logDir, "parley-updater.log"), { flags: "a" });
    log.on("error", error => {
      console.warn("updater log failed", error);
      writeLog = (level, message) => { console.warn(`updater ${level}`, message); };
    });
    writeLog = (level, message) => {
      try { log.write(`${new Date().toISOString()} ${level} ${String(message)}\n`); }
      catch (error) { console.warn("updater log failed", error); }
    };
  } catch (error) {
    console.warn("updater log setup failed", error);
  }
  try {
    autoUpdater.logger = {
      info: message => writeLog("INFO", message),
      warn: message => writeLog("WARN", message),
      error: message => writeLog("ERROR", message),
      debug: message => writeLog("DEBUG", message),
    };
  } catch (error) {
    console.warn("updater logger setup failed", error);
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  if (feed) autoUpdater.setFeedURL(feed);
  autoUpdater.on("update-available", info => { candidate = info.version; });
  autoUpdater.on("update-downloaded", info => {
    if (failed || availableUpdate?.kind === "ready" || !isNewerVersion(info.version, app.getVersion())) return;
    publishUpdate({ kind: "ready", version: info.version, url: releaseUrl(info.version, origin) });
  });
  const fallBack = (error: unknown): void => {
    writeLog("ERROR", error);
    if (failed || availableUpdate?.kind === "ready") return;
    failed = true;
    if (candidate && isNewerVersion(candidate, app.getVersion())) {
      publishUpdate({ kind: "notify", version: candidate, url: releaseUrl(candidate, origin) });
    } else {
      void checkForUpdate(feed);
    }
  };
  autoUpdater.on("error", fallBack);
  try { await autoUpdater.checkForUpdates(); } catch (error) { fallBack(error); }
}

function registerUpdateIpc(): void {
  ipcMain.handle("mesa:available-update", () => availableUpdate);
  ipcMain.handle("mesa:update-restart", () => {
    if (availableUpdate?.kind !== "ready" || restartRequested) return;
    restartRequested = true;
    if (popout && !popout.isDestroyed()) popout.close();
    autoUpdater.quitAndInstall(false, true);
  });
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
  const icon = appIconPath();
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: BACKGROUND,
    icon,
    ...(process.platform === "win32" ? {
      titleBarStyle: "hidden" as const,
      titleBarOverlay: { color: BACKGROUND, symbolColor: "#e3e2e9", height: 32 },
    } : process.platform === "darwin" ? {
      titleBarStyle: "hidden" as const,
      trafficLightPosition: { x: 12, y: 8 },
    } : process.platform === "linux" ? { frame: false } : {}),
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

function registerWindowControlsIpc(mainWindow: BrowserWindow): void {
  ipcMain.removeHandler("mesa:minimize");
  ipcMain.removeHandler("mesa:toggle-maximize");
  ipcMain.removeHandler("mesa:is-maximized");
  ipcMain.removeHandler("mesa:close");
  ipcMain.handle("mesa:minimize", () => mainWindow.minimize());
  ipcMain.handle("mesa:toggle-maximize", () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
  ipcMain.handle("mesa:is-maximized", () => mainWindow.isMaximized());
  ipcMain.handle("mesa:close", () => mainWindow.close());
  mainWindow.on("maximize", () => mainWindow.webContents.send("mesa:window-maximized", true));
  mainWindow.on("unmaximize", () => mainWindow.webContents.send("mesa:window-maximized", false));
}

async function runPackagedLegacyCleanup(window: BrowserWindow): Promise<void> {
  if (!app.isPackaged || isDev) return;
  const platform = process.platform as LegacyPlatform;
  if (!["win32", "darwin", "linux"].includes(platform)) return;
  const data = app.getPath("userData");
  const marker = join(data, "legacy-cleanup.done");
  const logFile = join(data, "legacy-cleanup.log");
  const exists = async (path: string) => { try { await access(path); return true; } catch { return false; } };
  const registry = async () => {
    if (platform !== "win32") return [];
    const entries: { key: string; displayName: string; uninstall: string; location: string; scope: "HKCU" | "HKLM" }[] = [];
    for (const scope of ["HKCU", "HKLM"] as const) {
      const root = `${scope}\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall`;
      let output = "";
      try { output = (await execFileAsync("reg", ["query", root, "/s"], { windowsHide: true })).stdout; } catch { continue; }
      for (const block of output.split(/(?=HKEY_)/i)) {
        const key = block.match(/^([^\r\n]+)/)?.[1]?.trim() ?? "";
        const field = (name: string) => block.match(new RegExp(`^\\s*${name}\\s+REG_SZ\\s+(.+)$`, "im"))?.[1]?.trim() ?? "";
        if (key) entries.push({ key, displayName: field("DisplayName"), uninstall: field("UninstallString"), location: field("InstallLocation"), scope });
      }
    }
    return entries;
  };
  await runLegacyCleanup(platform, homedir(), app.getPath("exe"), {
    exists,
    remove: async path => rm(path, { recursive: true, force: true }),
    registry,
    packages: async () => {
      if (platform !== "linux") return [];
      const result: ("deb" | "rpm")[] = [];
      try { await execFileAsync("dpkg-query", ["-W", "-f=${Status}", "mesa-chat-app"]); result.push("deb"); } catch { /* absent */ }
      try { await execFileAsync("rpm", ["-q", "mesa-chat-app"]); result.push("rpm"); } catch { /* absent */ }
      return result;
    },
    execute: async (file, args) => { await execFileAsync(file, args, { windowsHide: true }); },
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
    markerExists: () => exists(marker),
    mark: async () => { await writeFile(marker, new Date().toISOString(), "utf8"); },
    confirm: async () => (await dialog.showMessageBox(window, { type: "question", buttons: ["Remover Mesa", "Agora não"], defaultId: 1, cancelId: 1, title: "Instalação anterior", message: "Remover o Mesa instalado?", detail: "Feche o Mesa antes de continuar. Seus dados antigos serão preservados." })).response === 0,
    inform: async message => { await dialog.showMessageBox(window, { type: "info", title: "Remoção manual do Mesa", message: "A instalação anterior pode ser removida manualmente.", detail: message }); },
    log: async message => { await appendFile(logFile, `${new Date().toISOString()} ${message}\n`, "utf8"); },
  });
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
    const icon = appIconPath();
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
  registerNotifyOsIpc();
  mainWindow = createWindow();
  attachMainWindowLifecycle(mainWindow);
  registerWindowControlsIpc(mainWindow);
  createTray();
  if (app.isPackaged && !isDev) mainWindow.webContents.once("did-finish-load", () => { void runPackagedLegacyCleanup(mainWindow!).catch(error => console.error("legacy cleanup failed", error)); });
  mainWindow.webContents.once("did-finish-load", () => {
    const mode = resolveUpdateMode({ platform: process.platform, isPackaged: app.isPackaged && !isDev, env: process.env, execPath: process.execPath,
      fileExists: existsSync, isWritable: path => { try { accessSync(path, constants.W_OK); return true; } catch { return false; } } });
    if (mode === "auto") void checkAutomatically(updateFeed());
    else if (mode === "notify") void checkForUpdate(updateFeed());
  });
  app.on("activate", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = createWindow();
      attachMainWindowLifecycle(mainWindow);
      registerWindowControlsIpc(mainWindow);
    } else {
      showMainWindow();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  // Hide-on-close keeps the main window alive in the tray; only quit when Fechar was chosen
  // (or before-quit already set the flag). Do not quit merely because the window was hidden.
  if (isQuitting) return;
  if (process.platform !== "darwin" && !tray) app.quit();
});

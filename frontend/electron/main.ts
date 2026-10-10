import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEV_URL = "https://127.0.0.1:1421";
const BACKGROUND = "#10131c";
const INSTANCE_FILE = "mesa-instance.json";

interface InstanceState {
  baseUrl: string | null;
  sessionToken: string | null;
}

const isDev = process.env.MESA_ELECTRON_DEV === "1";
let instance: InstanceState = { baseUrl: null, sessionToken: null };

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

function isAppDocument(url: string): boolean {
  if (isDev) {
    try {
      return new URL(url).origin === new URL(DEV_URL).origin;
    } catch {
      return false;
    }
  }
  return url.startsWith("file:");
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
    void win.loadFile(fileURLToPath(new URL("../../dist/index.html", import.meta.url)));
  }
  return win;
}

function registerInstanceIpc(): void {
  ipcMain.handle("mesa:load-instance", () => instance);
  ipcMain.handle("mesa:save-instance-url", (_event, url: string) => writeInstance({ ...instance, baseUrl: url }));
  ipcMain.handle("mesa:save-session-token", (_event, token: string) => writeInstance({ ...instance, sessionToken: token }));
  ipcMain.handle("mesa:clear-session-token", () => writeInstance({ ...instance, sessionToken: null }));
  ipcMain.handle("mesa:clear-instance", () => writeInstance({ baseUrl: null, sessionToken: null }));
}

app.whenReady().then(async () => {
  if (isDev) {
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      if (request.hostname === "127.0.0.1" || request.hostname === "localhost") callback(0);
      else callback(-3);
    });
  }
  instance = await readInstance();
  applyAuthFilter();
  registerInstanceIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

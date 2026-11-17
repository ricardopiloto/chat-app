import { contextBridge, ipcRenderer } from "electron";

export interface InstanceState {
  baseUrl: string | null;
  sessionToken: string | null;
}

export interface CallPopoutRequest {
  channelId: string;
  serverId: string;
  e2ee: boolean;
  serverKey: string | null;
}

export type CallPopoutCommand =
  | { channelId: string; action: "setMic"; value: boolean }
  | { channelId: string; action: "setCam"; value: boolean }
  | { channelId: string; action: "setScreen"; value: boolean }
  | { channelId: string; action: "toggleDeafened" }
  | { channelId: string; action: "leave" };

export interface CallPopoutOwnerState {
  channelId: string;
  live: boolean;
  mic: boolean;
  cam: boolean;
  screen: boolean;
  deafened: boolean;
  quality: "excellent" | "good" | "poor" | "lost" | "unknown";
  canSpeak: boolean;
  available: boolean;
}

export interface UpdateState {
  kind: "notify" | "ready";
  version: string;
  url: string;
}

// Set before the page runs. The renderer treats this flag as "inside the Mesa shell"
// and does not sniff the user agent.
contextBridge.exposeInMainWorld("__MESA_NATIVE__", true);
contextBridge.exposeInMainWorld("mesaPlatform", process.platform);

contextBridge.exposeInMainWorld("mesaNative", {
  loadInstance: (): Promise<InstanceState> => ipcRenderer.invoke("mesa:load-instance"),
  saveInstanceUrl: (url: string): Promise<void> => ipcRenderer.invoke("mesa:save-instance-url", url),
  saveSessionToken: (token: string): Promise<void> => ipcRenderer.invoke("mesa:save-session-token", token),
  clearSessionToken: (): Promise<void> => ipcRenderer.invoke("mesa:clear-session-token"),
  clearInstance: (): Promise<void> => ipcRenderer.invoke("mesa:clear-instance"),
  minimize: (): Promise<void> => ipcRenderer.invoke("mesa:minimize"),
  toggleMaximize: (): Promise<void> => ipcRenderer.invoke("mesa:toggle-maximize"),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke("mesa:is-maximized"),
  close: (): Promise<void> => ipcRenderer.invoke("mesa:close"),
  getCloseBehavior: (): Promise<"tray" | "quit" | null> => ipcRenderer.invoke("mesa:get-close-behavior"),
  setCloseBehavior: (behavior: "tray" | "quit"): Promise<"tray" | "quit"> => ipcRenderer.invoke("mesa:set-close-behavior", behavior),
  onClosePrompt: (listener: (requestId: string) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, requestId: string) => listener(requestId);
    ipcRenderer.on("mesa:close-prompt", wrapped);
    return () => ipcRenderer.removeListener("mesa:close-prompt", wrapped);
  },
  respondToClosePrompt: (requestId: string, choice: "tray" | "quit" | null): void => {
    ipcRenderer.send("mesa:close-prompt-response", { requestId, choice });
  },
  notifyOs: (payload: { title: string; body: string }): Promise<void> => ipcRenderer.invoke("mesa:notify-os", payload),
  onWindowMaximizedChange: (listener: (maximized: boolean) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, maximized: boolean) => listener(maximized);
    ipcRenderer.on("mesa:window-maximized", wrapped);
    return () => ipcRenderer.removeListener("mesa:window-maximized", wrapped);
  },
  openCallPopout: (request: CallPopoutRequest): Promise<void> => ipcRenderer.invoke("mesa:open-call-popout", request),
  closeCallPopout: (): Promise<void> => ipcRenderer.invoke("mesa:close-call-popout"),
  takeCallPopout: (): Promise<CallPopoutRequest | null> => ipcRenderer.invoke("mesa:take-call-popout"),
  sendCallPopoutCommand: (command: CallPopoutCommand): void => {
    ipcRenderer.send("mesa:call-popout-command", command);
  },
  requestCallPopoutOwnerState: (channelId: string): void => {
    ipcRenderer.send("mesa:call-popout-request-state", channelId);
  },
  publishCallPopoutOwnerState: (state: CallPopoutOwnerState): void => {
    ipcRenderer.send("mesa:call-popout-owner-state", state);
  },
  onCallPopoutCommand: (listener: (command: CallPopoutCommand) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, command: CallPopoutCommand) => listener(command);
    ipcRenderer.on("mesa:call-popout-command", wrapped);
    return () => ipcRenderer.removeListener("mesa:call-popout-command", wrapped);
  },
  onCallPopoutStateRequest: (listener: (channelId: string) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, channelId: string) => listener(channelId);
    ipcRenderer.on("mesa:call-popout-request-state", wrapped);
    return () => ipcRenderer.removeListener("mesa:call-popout-request-state", wrapped);
  },
  onCallPopoutOwnerState: (listener: (state: CallPopoutOwnerState) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, state: CallPopoutOwnerState) => listener(state);
    ipcRenderer.on("mesa:call-popout-owner-state", wrapped);
    return () => ipcRenderer.removeListener("mesa:call-popout-owner-state", wrapped);
  },
  updateState: (): Promise<UpdateState | null> => ipcRenderer.invoke("mesa:available-update"),
  restartForUpdate: (): Promise<void> => ipcRenderer.invoke("mesa:update-restart"),
  onUpdateState: (listener: (update: UpdateState) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, update: UpdateState) => listener(update);
    ipcRenderer.on("mesa:update-state", wrapped);
    return () => ipcRenderer.removeListener("mesa:update-state", wrapped);
  },
  onCallPopoutClosed: (listener: (channelId: string) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, channelId: string) => listener(channelId);
    ipcRenderer.on("mesa:call-popout-closed", wrapped);
    return () => ipcRenderer.removeListener("mesa:call-popout-closed", wrapped);
  },
});

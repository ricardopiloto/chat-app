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

// Set before the page runs. The renderer treats this flag as "inside the Mesa shell"
// and does not sniff the user agent.
contextBridge.exposeInMainWorld("__MESA_NATIVE__", true);

contextBridge.exposeInMainWorld("mesaNative", {
  loadInstance: (): Promise<InstanceState> => ipcRenderer.invoke("mesa:load-instance"),
  saveInstanceUrl: (url: string): Promise<void> => ipcRenderer.invoke("mesa:save-instance-url", url),
  saveSessionToken: (token: string): Promise<void> => ipcRenderer.invoke("mesa:save-session-token", token),
  clearSessionToken: (): Promise<void> => ipcRenderer.invoke("mesa:clear-session-token"),
  clearInstance: (): Promise<void> => ipcRenderer.invoke("mesa:clear-instance"),
  openCallPopout: (request: CallPopoutRequest): Promise<void> => ipcRenderer.invoke("mesa:open-call-popout", request),
  closeCallPopout: (): Promise<void> => ipcRenderer.invoke("mesa:close-call-popout"),
  takeCallPopout: (): Promise<CallPopoutRequest | null> => ipcRenderer.invoke("mesa:take-call-popout"),
  onCallPopoutClosed: (listener: (channelId: string) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, channelId: string) => listener(channelId);
    ipcRenderer.on("mesa:call-popout-closed", wrapped);
    return () => ipcRenderer.removeListener("mesa:call-popout-closed", wrapped);
  },
});

/// <reference types="vite/client" />
declare const __APP_VERSION__: string;

interface CallPopoutRequest {
  channelId: string;
  serverId: string;
  e2ee: boolean;
  serverKey: string | null;
}

type CallPopoutCommand =
  | { channelId: string; action: "setMic"; value: boolean }
  | { channelId: string; action: "setCam"; value: boolean }
  | { channelId: string; action: "setScreen"; value: boolean }
  | { channelId: string; action: "toggleDeafened" }
  | { channelId: string; action: "leave" };

interface CallPopoutOwnerState {
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

interface MesaNativeBridge {
  loadInstance(): Promise<{ baseUrl: string | null; sessionToken: string | null }>;
  saveInstanceUrl(url: string): Promise<void>;
  saveSessionToken(token: string): Promise<void>;
  clearSessionToken(): Promise<void>;
  clearInstance(): Promise<void>;
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  isMaximized(): Promise<boolean>;
  close(): Promise<void>;
  getCloseBehavior(): Promise<"tray" | "quit" | null>;
  setCloseBehavior(behavior: "tray" | "quit"): Promise<"tray" | "quit">;
  onClosePrompt(listener: (requestId: string) => void): () => void;
  respondToClosePrompt(requestId: string, choice: "tray" | "quit" | null): void;
  notifyOs(payload: { title: string; body: string }): Promise<void>;
  onWindowMaximizedChange(listener: (maximized: boolean) => void): () => void;
  openCallPopout(request: CallPopoutRequest): Promise<void>;
  closeCallPopout(): Promise<void>;
  takeCallPopout(): Promise<CallPopoutRequest | null>;
  sendCallPopoutCommand(command: CallPopoutCommand): void;
  requestCallPopoutOwnerState(channelId: string): void;
  publishCallPopoutOwnerState(state: CallPopoutOwnerState): void;
  onCallPopoutCommand(listener: (command: CallPopoutCommand) => void): () => void;
  onCallPopoutStateRequest(listener: (channelId: string) => void): () => void;
  onCallPopoutOwnerState(listener: (state: CallPopoutOwnerState) => void): () => void;
  updateState(): Promise<{ kind: "notify" | "ready"; version: string; url: string } | null>;
  onUpdateState(listener: (update: { kind: "notify" | "ready"; version: string; url: string }) => void): () => void;
  restartForUpdate(): Promise<void>;
  onCallPopoutClosed(listener: (channelId: string) => void): () => void;
}

interface Window {
  __MESA_NATIVE__?: boolean;
  mesaNative?: MesaNativeBridge;
  mesaPlatform?: NodeJS.Platform;
}

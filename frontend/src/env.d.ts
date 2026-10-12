/// <reference types="vite/client" />
declare const __APP_VERSION__: string;

interface CallPopoutRequest {
  channelId: string;
  serverId: string;
  e2ee: boolean;
  serverKey: string | null;
}

interface MesaNativeBridge {
  loadInstance(): Promise<{ baseUrl: string | null; sessionToken: string | null }>;
  saveInstanceUrl(url: string): Promise<void>;
  saveSessionToken(token: string): Promise<void>;
  clearSessionToken(): Promise<void>;
  clearInstance(): Promise<void>;
  openCallPopout(request: CallPopoutRequest): Promise<void>;
  closeCallPopout(): Promise<void>;
  takeCallPopout(): Promise<CallPopoutRequest | null>;
  onCallPopoutClosed(listener: (channelId: string) => void): () => void;
}

interface Window {
  __MESA_NATIVE__?: boolean;
  mesaNative?: MesaNativeBridge;
}

/// <reference types="vite/client" />
declare const __APP_VERSION__: string;

interface MesaNativeBridge {
  loadInstance(): Promise<{ baseUrl: string | null; sessionToken: string | null }>;
  saveInstanceUrl(url: string): Promise<void>;
  saveSessionToken(token: string): Promise<void>;
  clearSessionToken(): Promise<void>;
  clearInstance(): Promise<void>;
}

interface Window {
  __MESA_NATIVE__?: boolean;
  mesaNative?: MesaNativeBridge;
}

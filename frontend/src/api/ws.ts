// Transitional alias for screens written against the old module name. New code imports from "./realtime".
import { connectRealtime, type DeliveryState, type RealtimeConnection, type RealtimeEnvelope } from "./realtime";

export type WsEnvelope = RealtimeEnvelope;
export type LiveDeliveryStatus = DeliveryState;
export type LiveWsHandle = RealtimeConnection;

export const connectLiveWs = (onEvent: (message: WsEnvelope) => void, onStatus: (status: LiveDeliveryStatus) => void): LiveWsHandle =>
  connectRealtime({ onEvent, onState: onStatus });

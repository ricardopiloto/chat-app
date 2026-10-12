export function typingFrame(channelId: string, active: boolean): string {
  return JSON.stringify({ type: "typing", channel_id: channelId, active });
}

/** Sends only while the socket is open. A closed socket drops the frame; nothing is queued for reconnect. */
export function deliverTyping(socket: { isOpen(): boolean; send(data: string): void } | null, channelId: string, active: boolean): void {
  if (!socket?.isOpen()) return;
  socket.send(typingFrame(channelId, active));
}

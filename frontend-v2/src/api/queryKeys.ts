// One place that names every cache entry, so invalidation after a mutation or a real-time event
// cannot drift from the code that reads the data.
export const queryKeys = {
  account: ["account"] as const,
  servers: ["servers"] as const,
  channels: (serverId: string) => ["servers", serverId, "channels"] as const,
  members: (serverId: string) => ["servers", serverId, "members"] as const,
  presence: (serverId: string) => ["servers", serverId, "presence"] as const,
  roles: (serverId: string) => ["servers", serverId, "roles"] as const,
  welcome: (serverId: string) => ["servers", serverId, "welcome"] as const,
  voiceOccupancy: (serverId: string) => ["servers", serverId, "voice-occupancy"] as const,
  channel: (channelId: string) => ["channels", channelId] as const,
  acl: (channelId: string) => ["channels", channelId, "acl"] as const,
  mutes: (channelId: string) => ["channels", channelId, "mutes"] as const,
  messages: (channelId: string) => ["channels", channelId, "messages"] as const,
  notifications: ["notifications"] as const,
};

export type DesktopPlatform = "windows" | "macos" | "linux";

export function detectPlatform(navigatorInfo: Pick<Navigator, "platform" | "userAgent"> & { userAgentData?: { platform?: string } }): DesktopPlatform | null {
  const value = `${navigatorInfo.userAgentData?.platform ?? ""} ${navigatorInfo.platform} ${navigatorInfo.userAgent}`.toLowerCase();
  if (value.includes("windows") || value.includes("win32")) return "windows";
  if (value.includes("mac") || value.includes("darwin")) return "macos";
  if (value.includes("linux") || value.includes("x11")) return "linux";
  return null;
}

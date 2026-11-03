import type { InstanceStatus } from "../api/endpoints/instance";

export type SetupVariant = "setup" | "normal";
export type AuthMode = "login" | "register";

export function resolveSetupVariant(
  status: InstanceStatus | undefined,
  queryError?: unknown,
  registerErrorStatus?: number,
): SetupVariant {
  if (queryError || registerErrorStatus === 403) return "normal";
  return status?.initial_setup === true ? "setup" : "normal";
}

export function inviteForVariant(variant: SetupVariant, invite: string): string {
  return variant === "setup" ? "" : invite.trim();
}

export function modeForSetupVariant(variant: SetupVariant, currentMode: AuthMode): AuthMode {
  return variant === "setup" ? "register" : currentMode;
}

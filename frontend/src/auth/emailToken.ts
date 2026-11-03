export function readEmailTokenFragment(hash: string): string | undefined {
  if (!hash.startsWith("#")) return undefined;
  const token = new URLSearchParams(hash.slice(1)).get("email_token");
  return token && /^[a-fA-F0-9]{64}$/.test(token) ? token : undefined;
}

export function takeEmailTokenFragment(
  location: Pick<Location, "hash" | "pathname" | "search">,
  history: Pick<History, "replaceState" | "state">,
): { present: boolean; token?: string } {
  if (!location.hash.startsWith("#email_token=")) return { present: false };
  const token = readEmailTokenFragment(location.hash);
  history.replaceState(history.state, "", location.pathname + location.search);
  return { present: true, token };
}

export function emailErrorKey(code?: string): string {
  switch (code) {
    case "registration_closed": return "emailRegistration.registrationClosed";
    case "terms_required": return "emailRegistration.termsRequired";
    case "email_invalid": return "emailRegistration.emailInvalid";
    case "email_domain_blocked": return "emailRegistration.emailDomainBlocked";
    case "captcha_failed": return "emailRegistration.captchaFailed";
    case "email_token_invalid": return "emailRegistration.emailTokenInvalid";
    case "email_taken": return "emailRegistration.emailTaken";
    case "too_many": return "auth.tooMany";
    default: return "auth.genericError";
  }
}

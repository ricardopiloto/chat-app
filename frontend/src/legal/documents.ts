import type { AppLocale } from "../i18n";
import officialTermsEn from "./official/terms.en.md?raw";
import officialTermsPt from "./official/terms.pt-BR.md?raw";
import officialPrivacyEn from "./official/privacy.en.md?raw";
import officialPrivacyPt from "./official/privacy.pt-BR.md?raw";
import templateTermsEn from "./template/terms.en.md?raw";
import templateTermsPt from "./template/terms.pt-BR.md?raw";
import templatePrivacyEn from "./template/privacy.en.md?raw";
import templatePrivacyPt from "./template/privacy.pt-BR.md?raw";

type DocumentKind = "terms" | "privacy";
const official = { terms: { en: officialTermsEn, "pt-BR": officialTermsPt }, privacy: { en: officialPrivacyEn, "pt-BR": officialPrivacyPt } };
const template = { terms: { en: templateTermsEn, "pt-BR": templateTermsPt }, privacy: { en: templatePrivacyEn, "pt-BR": templatePrivacyPt } };

export function legalDocument(kind: DocumentKind, locale: AppLocale): string {
  const source = (import.meta.env.VITE_LEGAL_DOCUMENT_VARIANT === "official" ? official : template)[kind][locale];
  const name = import.meta.env.VITE_LEGAL_OPERATOR_NAME?.trim() || "[OPERATOR NAME NOT CONFIGURED — set VITE_LEGAL_OPERATOR_NAME]";
  const contact = import.meta.env.VITE_LEGAL_OPERATOR_CONTACT?.trim() || "[OPERATOR CONTACT NOT CONFIGURED — set VITE_LEGAL_OPERATOR_CONTACT]";
  const jurisdiction = import.meta.env.VITE_LEGAL_OPERATOR_JURISDICTION?.trim() || "[OPERATOR JURISDICTION NOT CONFIGURED — set VITE_LEGAL_OPERATOR_JURISDICTION]";
  return source.replaceAll("{{LEGAL_OPERATOR_NAME}}", name).replaceAll("{{LEGAL_OPERATOR_CONTACT}}", contact).replaceAll("{{LEGAL_OPERATOR_JURISDICTION}}", jurisdiction);
}

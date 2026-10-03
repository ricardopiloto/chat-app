import type { Config } from "tailwindcss";
const colorTokens = ["background","surface","surface-dim","surface-bright","surface-container-lowest","surface-container-low","surface-container","surface-container-high","surface-container-highest","surface-variant","on-background","on-surface","on-surface-variant","outline","outline-variant","primary","on-primary","primary-container","on-primary-container","inverse-primary","secondary","on-secondary","secondary-container","on-secondary-container","tertiary","on-tertiary","tertiary-container","on-tertiary-container","error","on-error","error-container","on-error-container","inverse-surface","inverse-on-surface","surface-tint","primary-fixed","primary-fixed-dim","on-primary-fixed","on-primary-fixed-variant","secondary-fixed","secondary-fixed-dim","on-secondary-fixed","on-secondary-fixed-variant","tertiary-fixed","tertiary-fixed-dim","on-tertiary-fixed","on-tertiary-fixed-variant"];
const colors = Object.fromEntries(colorTokens.map((token) => [token, `var(--${token})`]));
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: { mobile: { max: "767px" }, tablet: "768px", desktop: "1025px", sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
    extend: {
      colors,
      fontFamily: { display: ["Plus Jakarta Sans", "sans-serif"], body: ["Inter", "sans-serif"], code: ["JetBrains Mono", "monospace"] },
      fontSize: { "display-lg": ["36px", { lineHeight: "44px", fontWeight: "700" }], "display-lg-mobile": ["28px", { lineHeight: "36px", fontWeight: "700" }], "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "600" }], "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }], "headline-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }], "body-lg": ["16px", { lineHeight: "24px" }], "body-md": ["14px", { lineHeight: "20px" }], "body-sm": ["12px", { lineHeight: "18px" }], "label-code-md": ["13px", { lineHeight: "18px", fontWeight: "500" }], "label-code-sm": ["11px", { lineHeight: "16px", fontWeight: "500" }], "label-ui": ["12px", { lineHeight: "16px", fontWeight: "600" }] },
      spacing: { "space-xs": "0.25rem", "space-sm": "0.5rem", "space-md": "1rem", "space-lg": "1.5rem", "space-xl": "2.5rem", gutter: "1rem", "gutter-desktop": "1.5rem", margin: "1rem", "margin-desktop": "2rem" },
      borderRadius: { sm: "0.25rem", DEFAULT: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem", full: "9999px" },
      boxShadow: { floating: "var(--shadow-floating)", stage: "var(--shadow-stage)" }
    }
  },
  plugins: []
};
export default config;

import type { JSX } from "solid-js";
import { onMount } from "solid-js";
import IconUsers from "./icons/IconUsers";
import { APP_VERSION } from "../lib/appVersion";
import { bootTheme } from "../theme/theme";

type Props = {
  children: JSX.Element;
};

/**
 * Two-pane auth chrome (brand | form). Applies resolved theme (system or stored override);
 * no theme control on auth surfaces.
 */
export default function AuthShell(props: Props) {
  let root: HTMLDivElement | undefined;
  onMount(() => {
    bootTheme(root ?? null);
  });

  return (
    <div class="app auth-screen" ref={(el) => (root = el)}>
      <div class="auth-shell">
        <aside class="auth-pane-brand">
          <div class="auth-brand-block">
            <div class="auth-brand-row" aria-label="Mesa">
              <img
                class="topbar-mark auth-mark"
                src="/mesa-logo.png"
                alt=""
                width={160}
                height={160}
              />
              <span class="topbar-name auth-brand-name">Mesa</span>
            </div>
            <p class="auth-tagline">Converse com foco. No seu servidor, do seu jeito.</p>
          </div>
          <div class="auth-brand-footer">
            <p class="auth-instance-note">
              <IconUsers size={16} class="auth-instance-icon" />
              <span>
                Esta é uma instância self-hosted do Mesa. Não possui federação com outras
                instâncias.
              </span>
            </p>
            <p class="app-version auth-app-version" aria-label={`Versão ${APP_VERSION}`}>
              {APP_VERSION}
            </p>
          </div>
        </aside>
        <div class="auth-pane-form">{props.children}</div>
      </div>
    </div>
  );
}

import type { JSX } from "solid-js";
import IconUsers from "./icons/IconUsers";

type Props = {
  children: JSX.Element;
};

/**
 * Two-pane auth chrome (brand | form). Forces dark tokens on the local .app
 * root without flipping document theme via applyTheme.
 */
export default function AuthShell(props: Props) {
  return (
    <div class="app auth-screen" data-theme="dark">
      <div class="auth-shell">
        <aside class="auth-pane-brand">
          <div class="auth-brand-block">
            <div class="auth-brand-row">
              <span class="topbar-mark auth-mark" aria-hidden="true" />
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
          </div>
        </aside>
        <div class="auth-pane-form">{props.children}</div>
      </div>
    </div>
  );
}

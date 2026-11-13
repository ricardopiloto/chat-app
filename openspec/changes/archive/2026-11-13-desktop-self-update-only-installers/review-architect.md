# Review — Arquiteto de Soluções

**Change:** desktop-self-update-only-installers  
**Data:** 2026-11-13  
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: OK

- Stack inalterada (Electron + electron-builder + GitHub Actions + electron-updater). A change só estreita o conjunto de artefactos — coerente com a arquitectura desktop já descrita em `docs/arquitetura-tecnica.md` (self-update NSIS/AppImage; macOS em aviso).
- Responsabilidades claras: packaging/CI vs runtime `updateMode` vs docs/scripts. Sem novos componentes de backend/frontend de chat.
- Escalabilidade N/A (distribuição de binários, não carga de sessão).

## 2. Integração com a infraestrutura existente
Veredito: OK

- Não toca Nginx, systemd, LiveKit, SQLite nem mesma-origem do homeserver.
- Integração relevante é só o pipeline `desktop-release.yml` e o feed GitHub Releases — alinhado ao padrão já documentado em `docs/desktop-release.md`.
- D1 (não construir o que não se publica) evita artefacts “fantasma” no `workflow_dispatch` — boa higiene operacional.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção

- Segurança/E2EE: N/A (empacotamento). Assinatura/notarização continua fora de escopo (Non-Goal) — consistente com o requisito existente de binários sem assinatura documentados.
- Trade-off MSI silencioso vs self-update está explícito em Risks — aceite razoável para o produto actual.
- **Atenção:** a asserção “exactamente 3 instaladores” (`design.md` D2 / spec packaging) assume **um** artefacto por plataforma/runner. Se no futuro o workflow passar a emitir múltiplas arquitecturas (ex. AppImage `x86_64` + `arm64`), a contagem parte sem nova change. Recomendação: na implementação, documentar no comentário do job `release` que “3” = um por plataforma no layout actual; ou parametrizar a lista de globs esperados.
- Migração de utilizadores legados só via docs (D5) é aceitável; risco residual baixo se a release notes/CHANGELOG marcarem **BREAKING** com caminho AppImage/NSIS.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `design.md` traz D1–D5 com alternativa rejeitada em D1 — formato ADR adequado.
- Diagrama N/A (mudança linear de targets/CI).
- Specs: REMOVED+ADDED em `desktop/packaging` e MODIFIED em `desktop/self-update` cobrem o contrato observável; a frase “releases oficiais SHALL NOT publicar deb/rpm/msi” no self-update duplica packaging — redundância útil para quem lê só updates, não bloqueante.

## 5. Ponte entre produto e técnico
Veredito: OK

- Why/What (só formatos com self-updater + manter macOS) traduz-se directamente em D1–D5 e tasks 1–5.
- **BREAKING** está marcado no proposal; Impact cobre utilizadores MSI/deb/rpm e CI.
- Scripts de install já alinhados (AppImage/NSIS) — redução de risco de regressão na ponte produto↔distribuição.

## Bloqueantes antes de implementar
- nenhum

# Proposal

## Why

`native-client-auth` e `frontend-instance-connect` já dão ao frontend tudo o que precisa para falar com uma instância Mesa arbitrária sem depender de cookies same-origin — mas nenhum dos dois produz um binário instalável. Esta change é a que materializa a decisão já confirmada com o utilizador (cliente desktop **só-cliente**, Tauri, Windows/Mac/Linux) num shell real: embrulha o `frontend/dist` já existente — sem o reescrever — numa janela nativa por plataforma, com a identidade visual oficial da Mesa (`docs/v2/mesa_logo`, `frontend/src/assets/logo.png`/`emblem.png`, já referenciados por `openspec/specs/frontend-v2/brand-identity/spec.md`) como ícone da aplicação.

## What Changes

- Novo crate Rust `frontend/src-tauri/` (convenção padrão do Tauri para um frontend Vite existente: `src-tauri` como vizinho do `package.json`, com `frontendDist` a apontar para `../dist`), com `tauri.conf.json` a definir nome do produto, identificador reverso (`com.mesa.app` — a confirmar), ícones por plataforma, e tamanho/mínimo de janela.
- Ícones de aplicação gerados a partir de uma fonte única em alta resolução (via `cargo tauri icon`) para todos os formatos que cada SO precisa (`.ico` Windows, `.icns` macOS, conjunto de PNGs Linux) — mesma marca em todas as plataformas, sem variação.
- Configuração de rede do shell (CSP da webview e `capabilities` do Tauri v2) para permitir que os plugins já decididos em `frontend-instance-connect` (`@tauri-apps/plugin-http`, `plugin-websocket`, `plugin-store`) alcancem **qualquer** endereço que o utilizador configure como instância — ao contrário do padrão recomendado pelo Tauri de restringir `capabilities` a domínios conhecidos em build-time, aqui o domínio só é conhecido em runtime (ver `design.md`, Decisão sobre o âmbito das `capabilities`).
- Janela com decoração nativa do SO (barra de título padrão), sem chrome personalizado — o conteúdo visível (`AppShell`, topbar, etc.) já é inteiramente controlado pelo `frontend/dist`, igual ao build web; esta change não adiciona nem remove nada da UI em si.
- **Fora de escopo explícito**: os instaladores finais por plataforma e qualquer automação de CI (`desktop-packaging-ci`, change seguinte — esta change entrega o crate e a configuração; `cargo tauri build` local já produz um binário funcional, mas a esteira repetível/distribuível fica para a próxima change), tray icon, menu nativo, auto-update, janela frameless/custom titlebar, "single instance" lock.

## Capabilities

### New Capabilities

- `desktop/shell`: o shell Tauri em si — janela, ícone da aplicação, configuração de rede necessária para o cliente nativo (decidido em `frontend-instance-connect`) funcionar dentro dele.

### Modified Capabilities

(nenhuma — `frontend-v2/brand-identity` já exige o logo oficial em "todas as superfícies de marca"; o ícone da aplicação desktop é uma superfície nova coberta pela mesma marca, não uma mudança de requisito existente.)

## Impact

- **Novo** (`frontend/src-tauri/`): crate Rust standalone (sem juntar a um workspace com `backend/`, que continua um crate Rust completamente independente — ver `design.md`), `Cargo.toml`, `tauri.conf.json`, ícones gerados.
- **Frontend** (`frontend/package.json`): dependência de dev `@tauri-apps/cli`; nenhum ficheiro de `frontend/src` é alterado por esta change (já foi todo o trabalho de `frontend-instance-connect`).
- **Depende de** `frontend-instance-connect` (o shell só é útil com o módulo de instância/transporte já implementado) e, transitivamente, de `native-client-auth`. **É consumida por** `desktop-packaging-ci`.
- **Sem impacto**: `backend/`, qualquer ecrã ou lógica de `frontend/src` além de configuração de build/rede do próprio Tauri.

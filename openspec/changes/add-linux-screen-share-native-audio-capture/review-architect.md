# Review — Arquiteto de Soluções

**Change:** add-linux-screen-share-native-audio-capture
**Data:** 2026-11-18
**Veredito geral:** Bloqueado

## 1. Definição da arquitetura técnica

Veredito: Atenção

- A escolha de stack (Rust + `napi-rs` + `pipewire-rs`, addon nativo no processo main) é tecnicamente coerente com a conclusão do `design.md` da change anterior (gate de API falhou de vez, confirmado por mim nesta sessão: `getDisplayMedia` retorna zero faixas de áudio e a UI do Chromium restringe áudio a Chrome Tab no Linux). A justificativa de rejeitar addon C++ hand-rolled e pacotes npm nicho (`node-pipewire`, `pw-client`) é sólida e documentada com alternativas rejeitadas — padrão ADR correto.
- **Achado relevante que muda o peso da decisão**: `design.md` (D1) afirma "This repo has no Rust toolchain today", mas confirmei em `backend/Cargo.toml` que o **backend já é inteiramente Rust** (Axum + SQLx + `livekit-api`). A equipe não está adotando Rust do zero — está trazendo Rust para o *pipeline de build do frontend/Electron* pela primeira vez, o que é uma afirmação mais fraca e mais fácil de sustentar do que "primeira dependência nativa" sugere. Recomendo corrigir essa frase no `design.md` para não subestimar a familiaridade real da equipe com a linguagem.
- Arquitetura do fluxo de áudio (main process → IPC → `AudioWorkletNode` → `MediaStreamDestination` → publish) é um padrão novo e não-trivial para este projeto, mas corretamente justificado como a única rota possível dado que os renderers rodam com `contextIsolation: true`/`nodeIntegration: false` (confirmado) e `setDisplayMediaRequestHandler` não aceita uma fonte de áudio arbitrária do processo main — isso bate com o que confirmei da API do Electron.
- Escalabilidade: N/A — é captura/publicação por-cliente, sem novo componente de servidor.

## 2. Integração com a infraestrutura existente

Veredito: **Bloqueante**

- **Achado crítico**: `design.md` (Non-Goals) afirma "A Linux CI pipeline (none exists today for this repo...)" — isso é **incorreto**. Confirmei `.github/workflows/desktop-release.yml`: existe um job `linux` (`runs-on: ubuntu-latest`) que já compila e empacota o AppImage oficial a cada tag `v*` e sob `workflow_dispatch`. É esse pipeline — não um build manual ad-hoc — que produz o artefato que os usuários finais instalam (confirmado também por `docs/desktop-release.md`).
- Isso significa que `tasks.md` está incompleto de um jeito que bloqueia a entrega real: nenhuma task (5.1/5.2 ou outra) altera `.github/workflows/desktop-release.yml` para (a) instalar `pipewire-0.3-dev`/`libpipewire-0.3-dev` via `apt-get` no job `linux` antes do build, e (b) garantir/():fixar uma toolchain Rust utilizável nesse runner (runners `ubuntu-latest` da GitHub normalmente já trazem Rust/Cargo pré-instalados, mas depender disso implicitamente sem fixar versão é frágil — version drift não detectado até o próximo release falhar silenciosamente ou produzir um binário incompatível). Sem essa task, a feature nunca chega ao AppImage que o workflow publica — ela só existiria no ambiente de dev de quem a implementou.
- Isso **não invalida** a arquitetura escolhida (D1-D5 continuam corretas), mas é uma lacuna real de integração com a infraestrutura de release já estabelecida — exatamente o tipo de achado que esta dimensão existe para capturar. Recomendo bloquear a implementação até `tasks.md` ganhar uma task explícita cobrindo a atualização do workflow de CI (idealmente no grupo 5, junto do empacotamento do `electron-builder.yml`).
- Fora esse ponto: sem mudança de backend/banco/protocolo LiveKit — confirmado, nenhuma task toca `backend/`.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança: D2 (dependência runtime leve, não hard-link) e o fallback silencioso video-only em qualquer falha (addon ausente, build falhou, captura falhou) preservam a garantia existente de "screen sharing SHALL NOT break or block" — consistente com o padrão já aceito para Windows loopback.
- Nova superfície de supply-chain (crates Rust `pipewire-rs`/dependências de `napi-rs`) é um risco real, mas não encontrei nenhuma convenção de auditoria de dependências já estabelecida neste projeto (sem `cargo-deny`, sem `npm audit` em CI, sem Dependabot) — não é um padrão que esta change esteja quebrando, só algo que nenhuma change neste projeto segue hoje. Não bloqueante, apenas registrado.
- Performance/latência: D4 (gate de prototipagem audível antes da integração completa) é exatamente o controle certo para o risco mais real desta arquitetura (IPC + Web Audio como substituto de um caminho nativo do Chromium) — mesmo rigor do gate D1 da change anterior.
- Manutenibilidade: escopo da D1 (addon mínimo, só captura + entrega de frames) é apropriado para uma equipe pequena — não tenta reimplementar mais da API do PipeWire do que o necessário.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- `design.md` segue o padrão já estabelecido no projeto (decisão + alternativas rejeitadas + motivo) com o mesmo nível de rigor das changes anteriores desta leva. D1-D5 são decisões genuínas, não redundantes com a change anterior (corretamente não reaproveita D2/D3 antigos sem revisão, como a change anterior já havia sinalizado que seria necessário).
- Falta o diagrama do fluxo de dados (main process → IPC → AudioWorklet → LiveKit) — a complexidade aqui (processo cruzado, duas pontes: nativo→JS no main, e main→renderer via IPC) já justificaria um diagrama mermaid simples de sequência; hoje só está descrito em prosa em D3. Não bloqueante sozinho, mas recomendo adicionar.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why" do `proposal.md` está bem ancorado em evidência real (gate da change anterior + precedente externo do Discord, ambos verificados nesta sessão, não assumidos). A tradução para `design.md` é tecnicamente sustentável dentro do que foi investigado.
- O recorte de escopo (sem X11, sem áudio por-janela, sem multi-arch) está claramente justificado e não promete mais do que a arquitetura escolhida pode sustentar.

## Bloqueantes antes de implementar

- Atualizar `tasks.md` (e possivelmente `design.md`) para cobrir explicitamente a mudança necessária em `.github/workflows/desktop-release.yml` (instalar `libpipewire-0.3-dev` no job `linux`, fixar/verificar a toolchain Rust do runner) — sem isso, a feature não chega ao AppImage que o pipeline de release já publica hoje.

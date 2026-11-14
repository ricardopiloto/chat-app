# Review — Arquiteto de Soluções

**Change:** add-screen-share-audio-and-popout-controls
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Stack coerente com o que já existe (SolidJS + Electron + LiveKit client, `README.md`: "Rust (Axum + SQLite), SolidJS (Vite + Tailwind), Electron, LiveKit"). Nenhuma dependência nova: `setScreenShareEnabled(on, { audio })` já existe no `livekit-client` instalado (`LocalParticipant.d.ts:102-105`), e o relay typed popout↔owner já existe e está a ser estendido, não reinventado (`CallPopoutCommand`/`CallPopoutOwnerState`, `env.d.ts:11-29`, `preload.ts:15-33`).
- Responsabilidades claras: captura e publicação ficam sempre no processo dono (D1), o popout só envia comandos e lê estado relayed (D2) — mesma fronteira já estabelecida por `add-popout-call-controls` e `add-connection-quality-indicator`.
- Escalabilidade: N/A — feature local por chamada, sem fan-out novo, sem carga de servidor adicional.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- A change integra correctamente com o modelo que **está realmente implementado**: um booleano `screen_on` por participante em `backend/src/domain/voice_occupancy.rs:18,29`, reportado pelo cliente (`callSession.tsx` → `report({ screen_on: ... })`). Confirmei por grep que não existe no backend nada do `active_screen_shares` (conjunto canónico), `channel_layout` (transição scene↔grid automática) ou dos eventos `voice.screen_share_changed`/`channel.layout_changed` descritos em `docs/screen-share.md` — esse PRD está marcado como "Rascunho para validação técnica (spike pendente)" e nunca foi construído. A change em avaliação correctamente não depende dessa máquina inexistente; mas nem `design.md` nem `proposal.md` mencionam essa divergência. Recomendação: uma frase no `design.md` deixando explícito que esta change opera sobre o modelo `screen_on` leve já em produção, não sobre o desenho mais elaborado do PRD, para que um leitor futuro não assuma a existência de layout automático ou eventos WS que não existem.
- Achado positivo de rastreabilidade: `docs/screen-share.md:39` já antecipava "Suporta captura de áudio do sistema/aba quando o browser permitir" — ou seja, o pedido de áudio não é novo, só nunca foi implementado. Vale uma referência cruzada de uma linha no `proposal.md`.
- Sem mudança de protocolo LiveKit nem de backend — correctamente declarado em `proposal.md`: "No backend or LiveKit protocol change is proposed."

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- Segurança: a extensão do relay popout (`setScreen` em `CallPopoutCommand`, `screen` em `CallPopoutOwnerState`) mantém a validação existente (sender/opener/channel em `readPopoutCommand`/`readPopoutOwnerState`, `main.ts:736-775,836-866`) — risco baixo, é um campo booleano a mais no mesmo contrato já validado.
- Trade-off bem resolvido em D1: "derive displayed state from actual local publications rather than the requested flag" — evita a UI afirmar que há áudio partilhado quando a captura falhou silenciosamente, o que seria uma promessa falsa ao utilizador.
- As duas "Open questions for architect review" são exactamente as decisões certas para não fechar sem dados: (1) política de fallback de áudio por plataforma (Windows vs. X11 vs. Wayland, dado que `main.ts:611-614` já distingue portal vs. picker custom só para vídeo) e (2) se reabrir screen-share no popout — e só screen-share, mantendo blur/background/output-device/segundo-popout fora, como o D3 original de `add-popout-call-controls` pedia — precisa de elegibilidade adicional além do `canSpeak()` já usado por mic/cam.
- Ponto a decidir explicitamente na revisão (não é bloqueante, mas fica como recomendação técnica): dado que `docs/screen-share.md:32` já tinha decidido "Permissões granulares (ex.: só o mestre pode compartilhar) — no MVP, qualquer participante do canal pode" para o ecrã principal, a pergunta 2 do `design.md` sobre elegibilidade no popout deveria herdar essa mesma regra (qualquer participante elegível a falar) em vez de inventar uma nova, para não divergir silenciosamente da decisão de produto já tomada.
- Performance: N/A, sem caminho crítico novo.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- `design.md` segue o padrão já estabelecido nesta leva de changes: Decisões com "Alternative rejected" justificada (D1: rejeita sessão de áudio separada por duplicar semântica de stop/start; D2: rejeita invocar `setScreen` no `useCall()` do popout por este não possuir a sessão publicadora).
- A secção "Open questions for architect review", separada das Decisions, é um padrão novo nesta leva mas justificado: o próprio pedido do dono do produto foi "isso requer uma análise do arquiteto antes de seguir" — não fechar essas duas perguntas como Decisions prematuras está correcto.
- Sem diagrama — correcto, é a mesma topologia single-relay já descrita textualmente nas changes anteriores (owner↔popout via IPC validado), sem componente novo que justifique um mermaid.

## 5. Ponte entre produto e técnico

Veredito: OK

- O pedido de produto (áudio de jogo para quem assiste a stream, paridade de controlo no popout) está traduzido fielmente: `proposal.md` nomeia exactamente o que o LiveKit e o Electron já suportam (`ScreenShareCaptureOptions.audio`, `Streams.audio` no `setDisplayMediaRequestHandler`), sem prometer uma garantia cross-platform que a stack não tem — e isso é reforçado pela pergunta 1 em aberto em vez de uma afirmação optimista.
- O corte de escopo do `add-popout-call-controls` original (D3) é respeitado e reaberto apenas na fatia que o pedido do dono do produto pediu (screen share), não nas outras três áreas que aquele D3 excluiu — boa disciplina de não aproveitar a oportunidade para alargar escopo.

## Bloqueantes antes de implementar

- nenhum

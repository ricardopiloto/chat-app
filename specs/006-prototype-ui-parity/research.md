# Research: 006 — Fidelidade protótipo + E2EE/gravar + rail/delete

Fecha decisões de implementação da [spec.md](./spec.md) (clarifications 2026-09-04) sobre o código 004/005.

---

## D1 — Continuidade de vídeo após `grid.updated` / Salvar cena

- **Decision**: Tratar o freeze como bug de **reattach DOM**, não de sala LiveKit. Em `layoutMedia` (e após `grid.updated` / mudança de `layout_key` / saída do editor): (1) limpar contentores de slot/grade de elementos `<video>` órfãos; (2) voltar a `attach` tracks remotos e o local nos nós correctos; (3) chamar `play()` nos elementos após move; (4) `queueMicrotask` + opcional `requestAnimationFrame` após resize/stage. Não exigir leave/rejoin.
- **Rationale**: SC-006; sessão LiveKit já permanece; só o mapa muda.
- **Alternatives considered**: Forçar reconnect LiveKit — rejeitado (pior UX). Ignorar e documentar — rejeitado pela spec.

---

## D2 — Enquadramento cover / centrado

- **Decision**: CSS nos tiles: `video { width:100%; height:100%; object-fit: cover; object-position: center; }` (e equivalente no contentor). Remover `object-fit: contain` onde existir. Placeholder de slot vazio inalterado.
- **Rationale**: FR-011 / SC-007.
- **Alternatives considered**: `contain` com letterbox — rejeitado. Zoom manual do utilizador — fora de âmbito.

---

## D3 — Fidelidade visual ao protótipo v2

- **Decision**: Usar o HTML do protótipo como checklist de medidas (alturas de header 48/52, raios 8–16, pílulas, densidades). Preferir classes em `mesa-theme.css` / Nocturne sobre estilos inline. Checklist em [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md). **Rail** é desvio aceite (não falha de fidelidade).
- **Rationale**: US1–US6; SC-001.
- **Alternatives considered**: Copiar HTML do protótipo verbatim para Solid — frágil. Redesign livre — fora de âmbito.

---

## D4 — Rail de Servidores (só ícones)

- **Decision**: Coluna estreita (~64–72px) à esquerda da lista de canais: um botão por Servidor (iniciais do nome se sem ícone). Activo com `--press` / acento. Clique → `selectedServerId`. **Único** mecanismo de troca (remover switcher do header da sidebar; header mostra só o nome). Modo palco / drawer estreito esconde rail+canais juntos.
- **Rationale**: Clarify Q (rail only); SC-011.
- **Alternatives considered**: Header + rail — rejeitado. Upload de ícone — diferido.

---

## D5 — Delete canal / Servidor

- **Decision**:
  - `DELETE /api/channels/{id}` — autorizado se `account == channel.created_by` **ou** `account == server.owner`; **409** se for o último canal do Servidor.
  - `DELETE /api/servers/{id}` — só `server.owner`; CASCADE remove canais/mensagens/…; WS notifica membros; clientes em voz no âmbito fazem leave.
  - UI: context menu (contextmenu / long-press) + diálogo Confirmar.
  - Persist `channel.created_by_account_id` (NOT NULL após backfill = owner do Servidor para canais legacy).
- **Rationale**: Clarify hard delete, permissões B, last-channel B.
- **Alternatives considered**: Soft-delete — rejeitado. Só criador do canal — rejeitado (B).

---

## D6 — Chave E2EE do canal (custódia G5)

- **Decision**: Alinhar a `docs/arquitetura-tecnica.md` `CHANNEL_KEY`:
  - Na criação de `voice_video`, o **cliente** gera chave de mídia do canal; mostra-a + checkbox “Salvei…”; envia ao servidor **apenas** um envelope selado para o custodian (criador) — **nunca** a chave em claro.
  - Tabela `channel_key` (channel_id, custodian_account_id, sealed_blob, created_at).
  - Canais **sem** linha `channel_key` = legado → UI desactiva Gravar/Religar (clarify).
  - Texto continua a usar chave de **Servidor** (`key_envelope`); voz/vídeo LiveKit usa chave de **canal** quando E2EE on.
  - Religar: custodian (ou fluxo que prova posse da chave) reintroduz material no cliente e liga E2EE de novo.
- **Rationale**: FR-016; Religar do protótipo.
- **Alternatives considered**: Só chave de Servidor para mídia — rejeitado na clarify. Guardar chave em claro no SQLite — rejeitado (segurança).

---

## D7 — E2EE off + Gravar (G1/G2)

- **Decision**:
  - `channel.e2ee_enabled` BOOL (default true). Evento WS `channel.e2ee_changed`.
  - `POST /api/channels/{id}/voice/e2ee` body `{ enabled: false, intent: "record" }` — só owner (ou política = dono do Servidor); escreve `e2ee_audit_log`; broadcast.
  - Clientes: `room.setE2EEEnabled(false)` quando off; true quando on.
  - `POST .../egress/start` e `.../stop` — se LiveKit egress configurado (`LIVEKIT_URL` + API key/secret + storage), Room Composite (ou track composite) alinhado à composição; senão **502/503** com mensagem clara e **não** entrar em estado “gravando” falso (se toggle já off por gravação falhada, reverter E2EE on).
  - Faixa UI como protótipo; Religar exige chave do canal no cliente.
- **Rationale**: Clarify profundidade B; arquitectura §7.4.
- **Alternatives considered**: Exigir artefacto sempre (A) — demasiado rígido para instâncias sem storage. Só toggle sem Gravar label (C) — rejeitado.

---

## D8 — Testes

- **Decision**: Contratos Rust para create voice + custody gate, delete channel/server auth, last-channel 409, e2ee toggle audit, egress unavailable path. Frontend: `tsc`. Manual quickstart + fidelity checklist ≥90% aplicáveis.
- **Rationale**: Padrão do repo (005).
- **Alternatives considered**: E2E Playwright — opcional depois.

---

## D9 — Fora de âmbito (backlog)

G3 diretório público, G4 canal privado, G7 canvas, G8 roles, G9 badges inventados — [docs/backlog-prototype-v2-gaps.md](../../docs/backlog-prototype-v2-gaps.md). Contagens reais só se já existirem dados.

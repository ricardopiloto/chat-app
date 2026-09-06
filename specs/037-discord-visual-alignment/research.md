# Research: 037-discord-visual-alignment

## 1. Família tipográfica self-hosted

**Decision**: **Inter** (OFL), pesos 400 / 500 / 600 / 700, ficheiros `.woff2` self-hosted sob `frontend/public/fonts/` (ou `src/assets/fonts` importados pelo Vite). Definir `@font-face` com `font-display: swap` e actualizar `--font-body` / `--font-heading` em `nocturne.css` para `"Inter", system-ui, sans-serif`. Hierarquia: headings 600–700; corpo 400–500.

**Rationale**: Licença livre, excelente suporte Latin, variável ou estática leve, já usada como substituto pragmático de “gg sans / Whitney” em UIs estilo Discord; self-host evita CDN e falhas de rede externas. `swap` cumpre SC de fallback sem FOIT.

**Alternatives considered**:
- **Source Sans 3** — mais humanista; Inter tem ecossistema/docs e tamanhos de ficheiro bem conhecidos no stack Vite.
- **CDN Google Fonts** — rejeitado (dependência externa, privacidade, falha de rede).
- Manter `system-ui` — rejeitado (FR-001 / US1).

## 2. Persistência de unread

**Decision**: Tabela `channel_read_state (account_id, channel_id, last_read_at TEXT NOT NULL)` (ISO/RFC3339 alinhado a `message.created_at`). Canal tem unread se existir mensagem com `created_at > last_read_at` **ou** se não houver linha de read-state e existir ≥1 mensagem. Servidor tem unread (pill) se **qualquer** canal de texto do servidor tiver unread. Mark-read: ao abrir/ver canal, `PUT/PATCH …/channels/{id}/read` com `last_read_at = now()` (ou timestamp da última mensagem vista). Agregar flags no `GET /api/servers` (`has_unread`) e/ou `GET /api/me/server-activity`.

**Rationale**: Spec exige tracking real; cursor por timestamp evita joins complexos a `message.id` e encaixa no cursor actual de listagem. Presence-only pill não precisa de contagem.

**Alternatives considered**:
- Só FE `localStorage` — frágil multi-device / partilha de sessão; rejeitado face à clarificação B.
- Contagem de mensagens — rejeitado (clarificação: só presença).
- Menções — fora de âmbito.

## 3. Voz na barra de servidores

**Decision**: Flag `has_voice` por servidor: `EXISTS` em `voice_occupant` para canais `type=voice` desse servidor (heartbeat actual). Expor no mesmo payload de actividade que `has_unread`. FE: indicador verde distinto (ex. ponto inferior-direito) vs pill unread (ex. barra/pill esquerdo), ambos visíveis. Actualizar via WS `voice.occupancy` (qualquer servidor membro) e/ou refresh periódico leve da lista de servidores.

**Rationale**: Reutiliza `voice_occupant`; evita N chamadas `GET …/voice-occupancy` só para a rail.

**Alternatives considered**: Poll N endpoints — rejeitado (chatty). Só mostrar voz no servidor seleccionado — viola FR-013.

## 4. Glifos filled nos call controls

**Decision**: Adicionar variantes filled (`IconMicOnFilled`, etc. ou prop `variant="filled"`) **apenas** nos 3 controlos da call bar; manter `fill="none"` stroke no resto do catálogo (012). Estados disabled: opacity + `aria-disabled` / classe `.is-disabled` distinta de off.

**Rationale**: Clarificação Option B — chrome intacto, só glifos.

**Alternatives considered**: Redesign circular Discord da call bar — rejeitado. Manter stroke — rejeitado (FR-003).

## 5. Elevação tema-aware

**Decision**: Introduzir `--shadow-float` (e opcionalmente alinhar `--shadow-lg`) em `:root` (escuro) e `[data-theme="light"]` (claro). Migrar `.context-menu`, `.account-menu-panel`, `.topbar-notif-panel`, `.camera-blur-menu-panel` (e popovers equivalentes listados no spec) para `box-shadow: var(--shadow-float)` sem overrides por componente.

**Rationale**: FR-006/007; hoje misturam `--shadow-lg` (dark-tuned) com `0 8px 24px` ad hoc.

**Alternatives considered**: Manter ad hoc — rejeitado. Uma sombra única para light+dark — rejeitado (FR-007).

## 6. Motion de menus + reduced-motion

**Decision**: Classe partilhada (ex. `.mesa-float-enter`) com opacity/transform ~120–160 ms; `@media (prefers-reduced-motion: reduce)` zera transition/animation **novas** (menus + hover morph da rail). **Não** alterar keyframes de speaking / e2ee (FR-010).

**Rationale**: US4 + FR-008/009/010.

**Alternatives considered**: Animar também speaking — rejeitado. Sem reduced-motion — rejeitado.

## 7. Morph hover da rail (FR-005)

**Decision**: Transição de `border-radius` (círculo → squircle/rounded-rect) + bg suave nos `.server-rail-btn`, ~150 ms, respeitando reduced-motion.

**Rationale**: “Transição de forma” alinhada ao Discord; baixo risco CSS-only.

**Alternatives considered**: Só scale/brightness — menos alinhado ao gap Discord citado na análise.

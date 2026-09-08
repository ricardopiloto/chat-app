# Research: 053-frontend-build-optimize

## R1 — Porquê o entry ~963 kB

**Decision**: Tratar `livekit-client` (+ track-processors / blur path) importado de forma **eager** via `VoiceSessionProvider` em `App.tsx` como a causa principal do chunk único; Sidebar/Channel/VoiceChannel e crypto são secundários.

**Rationale**: Build de produção reportada (~962.84 kB / ~277 kB gzip) + ausência de `lazy()` / `manualChunks` / dynamic import no frontend. `VoiceSession.tsx` importa `livekit-client` no topo; o provider envolve todas as rotas autenticadas.

**Alternatives considered**:
- Subir `chunkSizeWarningLimit` — rejeitado (clarificação Q1 / FR-003).
- Remover LiveKit / trocar SFU — fora de âmbito.
- Code-split só por rota de página sem tocar no provider — insuficiente se LiveKit continuar no grafo do entry.

## R2 — Estratégia de lazy load de voz (join / chamada activa)

**Decision**: Extrair o stack pesado (LiveKit session bind, `video/liveClient`, blur processors) para módulo(s) carregados com `import()` no **primeiro join** ou quando já existe chamada activa. Manter um **provider fino** (sinais live/channelId/mic/cam/PiP corner, API leave stubs) no grafo da shell sem importar `livekit-client` até à carga.

**Rationale**: Clarificações Q2 + Q5 — loading+retry na UI; PiP ao ir para texto exige stack carregado **durante** a chamada, não no login.

**Alternatives considered**:
- Lazy só na rota `/channels/:id` voice — parte PiP em texto (Q5 rejeitou A).
- Prefetch após login em idle — rejeitado (Q5 D); arrisca falhar o gate de entry se o prefetch for contado no critical path / se o grafo ainda puxar LiveKit cedo demais. Prefetch **após** primeira pintura sem bloquear entry é opcional *só se* medido que não reintroduz LiveKit no entry chunk.
- Manter eager — rejeitado (Q5 C).

## R3 — UX de loading / falha

**Decision**: Componente ou estado partilhado «a carregar voz…» + botão **Tentar de novo** que reexecuta o `import()` / init; shell e navegação de texto permanecem utilizáveis.

**Rationale**: Clarificação Q2 / FR-004a.

**Alternatives considered**: Ecrã em branco; bloquear navegação até chunk pronto; pré-load silencioso sem UI.

## R4 — Vite `manualChunks`

**Decision**: Após lazy load, se o entry ainda ≥500 kB, adicionar `build.rollupOptions.output.manualChunks` para isolar `livekit-client` (e opcionalmente crypto) em chunks nomeados. **Não** usar o limiar como “fix” do aviso.

**Rationale**: Reforça SC-001; chunks sob demanda não contam no entry.

**Alternatives considered**: Só dynamic import sem manualChunks (pode bastar); vendor split genérico demasiado agressivo.

## R5 — Inventário e unificação agressiva

**Decision**: Artefacto `inventory.md` na feature dir com cada cluster: id, descrição, ficheiros, estado (`unified` | `false-positive` | `intentional-divergence`), helper alvo. Migrar call sites no mesmo PR/feature. Clusters mínimos obrigatórios: map de erros API; `hasCapability` / gates de papel; facade `localStorage` prefs.

**Rationale**: Clarificação Q3 / FR-001–002 / SC-002 / SC-005.

**Seed clusters (exploração pré-plan)**:
| ID | Cluster | Exemplos |
|----|---------|----------|
| C1 | API error → string | RolesPanel, ChannelAclPanel, Scene*, Sidebar, RolePermissionsPage, … |
| C2 | Auth/invite/join error mappers | Auth `describeError`, Invite, `voice/joinErrors.ts` — unificar **só** a camada genérica; mappers de domínio podem permanecer como wrappers |
| C3 | Capability gates | Sidebar create/invite; OPEN_ROLE_CAPABILITIES |
| C4 | Prefs localStorage | theme, blur, lastChannel, uiPrefs, notifications |
| C5 | Panel Dialog chrome | RolesPanel / ChannelAclPanel / Members patterns |
| C6 | AppShell route wrappers | App.tsx ×4 rotas autenticadas |
| C7 | Media attach/play | liveClient, VoiceChannel, FloatingVoicePip |
| C8 | Key-sync copy | Channel / VoiceChannel (UI string helper only) |

**Alternatives considered**: Só 3 clusters — rejeitado pelo utilizador.

## R6 — CSS fora de âmbito

**Decision**: Não inventariar nem modularizar `mesa-theme.css` / `nocturne.css`. Permitir CSS mínimo para loading/retry.

**Rationale**: Clarificação Q4 / FR-006a.

## R7 — Solid + dynamic import

**Decision**: Usar `lazy()` do Solid para páginas pesadas **se** ajudar o entry; para voz, preferir `import()` imperativo no join bound ao provider fino (controlo fino do retry). Garantir que `FloatingVoicePip` e controlos do user panel importam tipos leves / lazy o módulo pesado quando `live()`.

**Rationale**: Solid Router + Vite suportam code-split; provider fino evita puxar LiveKit no grafo estático de `App.tsx`.

**Alternatives considered**: Lazy de cada página sem separar VoiceSession — insuficiente.

## R8 — Backend / E2EE

**Decision**: Sem mudanças de API ou protocolo. Crypto continua no cliente; pode ir a chunk separado se necessário para o gate, mas **não** lazy no login se isso partir unlock de identidade — crypto no path de auth pode permanecer no entry se couber no orçamento; prioridade é LiveKit.

**Rationale**: FR-006; auth precisa de identity no login.

# Research: 007-shell-create-plus

## 1. Create server aprovisiona texto + voz com custódia

**Decision**: Estender `POST /api/servers` para, na mesma transação (ou sequência atómica no handler), criar o servidor + membership + **um canal texto** + **um canal voz/vídeo** com cena default e chave de canal. O body passa a aceitar `custody_ack` + `channel_key_sealed` (obrigatórios). Resposta inclui o servidor e, de preferência, os canais criados (ou o cliente faz `GET …/channels` a seguir).

**Rationale**: Spec exige mínimo texto+voz e custódia no fluxo de criar servidor. Dois `POST /channels` no cliente após create-server deixam janela de falha (servidor sem voz/texto, ou texto sem voz). Custódia já existe em `create_channel`; reutilizar a mesma validação no create-server.

**Alternatives considered**:
- Frontend cria 2 canais após o servidor — rejeitado (não atómico; UX frágil).
- Endpoint separado `POST /servers/{id}/bootstrap` — complexidade extra sem ganho.

## 2. Guard de apagar: último por tipo

**Decision**: Em `DELETE /api/channels/{id}`, além (ou em substituição) do `last_channel` global, rejeitar com **409** se for o **último canal do mesmo `type`** no servidor (`code: last_channel_of_type` ou mensagem clara). Manter também a regra “não apagar se for o único canal do servidor” como subset.

**Rationale**: FR-009 — servidor MUST manter ≥1 texto e ≥1 voz. A regra actual (`count <= 1`) permite apagar o único texto se ainda existir voz.

**Alternatives considered**: Só UI a esconder delete — rejeitado (API insegura). Soft-delete — fora de âmbito.

## 3. «+» no rail e nas secções (só UI + CSS)

**Decision**: `ServerRail` — layout flex coluna: lista de ícones `overflow-y: auto` + botão «+» fixo no fundo (`aria-label="Criar servidor"`). `Sidebar` — remover botões textuais «Criar servidor»/«Criar canal»; em cada `.sidebar-section` (Texto / Voz e vídeo) um «+» à direita só se `owner`; `openCreateChannel(type)` sem select de tipo. Secções sempre renderizadas mesmo com `For` vazio.

**Rationale**: Spec FR-001–008; secções já existem; só falta o «+» e remover CTAs textuais.

**Alternatives considered**: «+» no header do servidor — superseded na clarify.

## 4. Uma cena: ocultar SceneList; manter Editar cena

**Decision**: Em `VoiceChannel.tsx`, **não** montar `SceneList` (painel multi-cena). Manter botão **Editar cena** no header → `setEditing(true)` sobre a **cena activa** (`activeScene()` / `is_active`). Editor continua a `PATCH` a cena activa. APIs create/duplicate/activate/delete de cenas **permanecem** no backend (G10); a SPA deixa de as expor. Subtítulo do pane pode usar ocupação da grade sem picker de nome de cena (opcional: manter nome da activa só como texto).

**Rationale**: Clarify — UX = uma cena; não apagar dados; G10 = multi-cena.

**Alternatives considered**: Remover também «Editar cena» — rejeitado pelo utilizador. Apagar cenas extra no DB — fora de âmbito.

## 5. CSS tema Mesa

**Decision**: Validar/garantir `mesa-theme.css` sem chavetas órfãs (já corrigido na 006 se aplicável); smoke `npm run build` / Vite dev sem erro de parse. Incluir regras CSS para `.server-rail` sticky-plus e `.sidebar-section` com «+».

**Rationale**: US3 / FR-011–012.

**Alternatives considered**: N/A.

## 6. Nomes default dos canais bootstrap

**Decision**: Texto `"geral"`, voz `"mesa"` (alinhado ao fallback actual do diálogo de canal). `grid_slot_count` default 4 no voz inicial.

**Rationale**: Assumptions da spec; consistência com UI actual.

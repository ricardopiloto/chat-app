# Research: 029-user-server-avatars

## R1 — Storage: directório dedicado, não anexos E2EE

**Decision**: Novo `AVATARS_DIR` (default `./data/avatars`), criado no boot como `ATTACHMENTS_DIR`. Ficheiros em claro no disco; SQLite guarda só path/id relativo (ou filename UUID). **Não** reutilizar `message_attachment` / `ATTACHMENTS_DIR` / `Content-Type: application/octet-stream`.

**Rationale**: Spec Assumptions — avatares visíveis a membros sem chave E2EE; misturar com ciphertext de chat quebraria Content-Type, authz (canal) e ops.

**Alternatives considered**: Guardar BLOB na SQLite (pior para backups/tamanho); reutilizar attachments API (rejeitado); CIFRAR com chave de servidor no BE (desnecessário e obscurece listagens).

## R2 — Colunas vs tabela de media

**Decision**: Migration `0008_user_server_avatars.sql`:

- `account.avatar_filename TEXT NULL` (+ opcional `avatar_content_type TEXT NULL`)
- `server.image_filename TEXT NULL` (+ opcional `image_content_type TEXT NULL`)

Um ficheiro por entidade; substituição apaga/substitui o ficheiro anterior; remoção põe NULL e apaga o ficheiro.

**Rationale**: 1:1 com Account/Server; alinhado a `ALTER TABLE` estilo `0002`/`0006`; sem JOIN extra nas listagens.

**Alternatives considered**: Tabela `media_asset` genérica (overkill MVP); path absoluto na DB (frágil se mudar `AVATARS_DIR`).

## R3 — Endpoints

**Decision**:

| Acção | Método / rota |
|-------|----------------|
| Definir/substituir avatar próprio | `PUT /api/auth/avatar` — body raw + `Content-Type` ou header `X-Mesa-Media-Type` |
| Remover avatar próprio | `DELETE /api/auth/avatar` |
| Servir avatar | `GET /api/accounts/{account_id}/avatar` — imagem real; auth sessão |
| Definir/substituir imagem servidor | `PUT /api/servers/{server_id}/image` — só dono |
| Remover imagem servidor | `DELETE /api/servers/{server_id}/image` — só dono |
| Servir imagem servidor | `GET /api/servers/{server_id}/image` — membro do servidor |

Listagens: campos opcionais em `AuthAccount` / `Account` (me), `MemberView`, `Server` — ex. `has_avatar: bool` ou `avatar_url` relativo (`/api/accounts/{id}/avatar`) para o FE montar `<img src>`.

**Rationale**: Espelha `PUT /api/auth/identity-vault` (self) e `delete_server` (owner); GET separado permite cache HTTP e `object-fit` sem embutir base64.

**Alternatives considered**: Multipart form (mais código); URL assinada pública sem cookie (desnecessário em self-host com cookie de sessão); embutir data-URL no JSON (pesado).

## R4 — Validação MIME e tamanho

**Decision**: `MAX_AVATAR_BYTES = 1 * 1024 * 1024`. Tipos: `image/jpeg`, `image/png`, `image/webp` (sem GIF no MVP). Validar no FE antes do PUT e no BE (body len + media type). Body limit Axum nas rotas de avatar ≈ `1 MiB + 64 KiB`.

**Rationale**: Clarificação 1 MiB; FR-006/007.

**Alternatives considered**: 5 MiB como anexos (rejeitado); sniff magic bytes só (complementar Content-Type — opcional no implement se fácil).

## R5 — Authz ao servir

**Decision**:

- GET avatar de conta: qualquer utilizador **autenticado** na instância (mesma confiança que ver handles em membros partilhados; self-host single-tenant típico).
- GET imagem de servidor: `require_member(server_id)`.
- PUT/DELETE avatar: só a própria conta.
- PUT/DELETE imagem: `owner_account_id == me` (igual delete/invite).

**Rationale**: Simplicidade MVP; listagens de membros já expõem identidade entre co-membros; evitar IDOR anónimo.

**Alternatives considered**: GET avatar só se partilham servidor (mais queries); GET público sem auth (rejeitado).

## R6 — UI entrada

**Decision**:

- **Utilizador**: item no `AccountMenu` («Avatar» / «Foto de perfil») → diálogo ou painel mínimo: preview, escolher ficheiro, gravar, remover.
- **Servidor**: no menu de contexto de dono do `Sidebar` (junto a «Apagar servidor») — «Imagem do servidor» / remover; sem rota `/settings`.

**Rationale**: Clarificações FR-001/FR-002; reutiliza superfícies 013.

**Alternatives considered**: Página `/settings` dedicada (fora de âmbito); só no chip com input file invisível (pior discoverability).

## R7 — Apresentação e refetch

**Decision**: Sem cropper; CSS `object-fit: cover` em `.user-avatar`, `.members-avatar`, `.msg-avatar`, glyph do rail. Após PUT local: actualizar estado `me` / `servers` imediatamente. Outros clientes: próximo fetch de `/members`, `/servers`, ou remount — sem evento WS.

**Rationale**: Clarificações Q3/Q4 / FR-009 / FR-013.

**Alternatives considered**: Canvas resize 256×256 no cliente (opcional polish — não obrigatório); WS `avatar.updated` (fora de âmbito).

## R8 — Ops / gitignore

**Decision**: Documentar `AVATARS_DIR` em `docs/operar-instancia.md`; `.gitignore` `data/avatars/` e `backend/data/avatars/`.

**Rationale**: Paridade com anexos; evitar commits de fotos de utilizadores.

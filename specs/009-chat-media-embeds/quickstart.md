# Quickstart: 009-chat-media-embeds

Validação E2E de anexos cifrados + unfurl lazy. Requer backend com migração de attachments e `ATTACHMENTS_DIR` (default ok).

## Pré-requisitos

- Backend + frontend a correr; duas contas membros do mesmo servidor.
- Canal de **texto**; server key sincronizada (mensagens de texto já funcionam).

## 1. Enviar imagem / GIF (US1)

1. Conta A: abrir canal de texto → anexar JPEG/PNG/WebP/GIF ≤8 MiB → enviar (com ou sem texto).
2. **Esperado**: mídia visível no histórico de A.
3. Conta B: abrir o mesmo canal.
4. **Esperado**: mesma mídia após load (decrypt + GET attachment).
5. Ficheiro `.exe` ou >8 MiB: rejeição com erro; sem mensagem órfã.
6. Disco da instância (`data/attachments/*`): bytes **não** abrem como imagem sem chave.

## 2. Unfurl lazy (US2)

1. Conta A envia mensagem com URL público (página, imagem directa, página de vídeo).
2. Confirmar no servidor: **sem** pedido unfurl no momento do POST da mensagem.
3. Conta B abre o canal (visualiza/decifra).
4. **Esperado**: cliente pede `POST /api/unfurl`; cartões quando possível; falhas → só link.
5. Mensagem só no servidor sem viewers → 0 unfurls.

## 3. Composer / layout (US3)

1. Seleccionar até 10 imagens; remover uma antes de enviar; bloquear a 11.ª.
2. Enviar só mídia (sem texto) → válida.
3. Viewport ~375px: imagens dentro do pane; sem scroll horizontal da página.

## 4. ACL

```bash
# Sem cookie / não-membro → 401/403 em GET /api/attachments/{id}
```

## Checks

```bash
cd backend && cargo test
cd frontend && npx tsc --noEmit
```

Contratos: [attachments-api.md](./contracts/attachments-api.md), [unfurl-api.md](./contracts/unfurl-api.md).

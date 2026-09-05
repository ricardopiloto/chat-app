# Quickstart: 010-media-paste-webp

Validação E2E de colar imagem, WebP e limite 5 MiB. Requer 009 (anexos) já funcional.

## Pré-requisitos

- Backend + frontend a correr; duas contas no mesmo servidor.
- Canal de **texto**; server key OK.
- Fonte de colagem: captura PNG/JPEG; opcionalmente um GIF animado.

## 1. Colar imagem no painel (US1)

1. Conta A: abrir canal de texto; **não** focar o composer (clicar na área de mensagens).
2. Colar uma captura de ecrã (`Ctrl+V` / `Cmd+V`).
3. **Esperado**: pré-visualização de anexo pendente; sem precisar de «Anexar».
4. Colar só texto com o composer focado → texto no campo; **0** anexos fantasma.
5. Colar texto+imagem → imagem(ns) em pending + texto no composer.
6. Enviar → mídia no histórico de A e de B.

## 2. WebP em colagens estáticas (US2)

1. Colar PNG/JPEG estático → pending; ao enviar, MIME efectivo **WebP** (DevTools/network: `X-Mesa-Media-Type: image/webp`, ou inspeção pós-decrypt).
2. Colar GIF **animado** → permanece GIF (animação no histórico).
3. Falha simulada (se aplicável): feedback claro; sem mensagem inválida.

## 3. Limite 5 MiB (US3)

1. Seletor: ficheiro de imagem **>5 MiB** → rejeitado com erro; não entra em pending.
2. Ficheiro ≤5 MiB válido → envia como na 009.
3. API: `POST .../attachments` com body `5 MiB + 1` → **400**.
4. Confirmar que upload de ~4 MiB ainda funciona.

## Checks

```bash
cd backend && cargo test
cd frontend && npx tsc --noEmit
```

Contrato: [attachments-size.md](./contracts/attachments-size.md). Modelo: [data-model.md](./data-model.md).

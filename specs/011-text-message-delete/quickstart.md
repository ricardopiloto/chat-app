# Quickstart: 011-text-message-delete

Validação E2E de apagar mensagens (autor / criador de canal / dono). Requer chat de texto e WS activos.

## Pré-requisitos

- Backend + frontend a correr.
- Preferível: 3 contas no mesmo servidor — **Owner**, **ChannelCreator** (cria canal texto extra), **Member** (só membro).
- Ou 2 contas: Owner + Member (Owner também é criador dos canais bootstrap).

## 1. Autor apaga a própria (US1)

1. Member envia mensagem no canal de texto.
2. Pairar/focar na mensagem → controlo **Apagar** visível.
3. Confirmar diálogo → mensagem some no ecrã de Member.
4. Owner (ou segundo cliente) com o mesmo canal aberto: mensagem some **sem reload** (≤3 s).
5. Noutra mensagem de Owner, Member **não** vê Apagar.

## 2. Criador do canal (US2)

1. ChannelCreator cria canal texto; Member envia mensagem aí.
2. ChannelCreator apaga a mensagem alheia (confirm) → ambos deixam de a ver.
3. No canal bootstrap criado pelo Owner (ChannelCreator **não** é criador), ChannelCreator **não** apaga mensagens alheias (403 / sem controlo).

## 3. Dono do servidor (US3)

1. No canal de ChannelCreator, Owner apaga mensagem de Member → removida para todos.
2. Conta sem poderes tenta `DELETE` via API → **403**; mensagem permanece.

## 4. Anexos

1. Enviar mensagem com imagem; apagar mensagem.
2. **Esperado**: mídia some do fio; `GET /api/attachments/{id}` → 404.

## 5. Idempotência

1. Apagar mensagem; repetir DELETE → **404**; UI estável.

## Checks

```bash
cd backend && cargo test
cd frontend && npx tsc --noEmit
```

Contrato: [message-delete-api.md](./contracts/message-delete-api.md).

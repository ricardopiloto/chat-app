# Quickstart: 026-message-delete-icon

Validação manual. Ver [contracts/message-delete-control.md](./contracts/message-delete-control.md).

## Pré-requisitos

- App a correr; canal de texto com mensagem que podes apagar (autor / dono / etc. 011).

## §1 Ícone + soft red (US1)

1. Hover (ou foco) na mensagem → controlo no canto.
2. Ver lixeira; **não** ver o texto «Apagar» no botão.
3. Fundo e borda no mesmo tom vermelho claro que o ícone.

## §2 Tooltip + aria (US2)

1. Pairar na lixeira → tip «Apagar».
2. Tab até ao botão → nome acessível comunica apagar mensagem.
3. Clicar → confirmação; confirmar → mensagem some.

## §3 Temas (US3)

1. Alternar claro/escuro; repetir §1 — combinação soft red legível em ambos.

## Automação

```bash
cd frontend && npx tsc --noEmit
```

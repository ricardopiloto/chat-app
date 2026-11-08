# Implementação: fix-webhook-panel-layout

## Antes e depois

1. **Segredo:** URL e token apareciam em labels e inputs soltos, com um botão de cópia separado apenas para a URL. Agora cada valor está num bloco `.mg-block` com `.mg-label`, `<code>` e botão próprio dentro de `.mg-key-row`. O botão “Copiei o link” continua a fechar o estado de segredo.
2. **Campos de texto:** os nomes de integração usavam labels e inputs sem a estrutura de campo do painel. Agora os dois usam `.mg-field` e `.mg-label`.
3. **Avatar:** o input de ficheiro nativo era visível. Agora o disparador é um label com aparência de botão, ícone de upload e input `.sr-only`. `pickPhoto`, os tipos aceites e o limite de tamanho permanecem iguais.
4. **Cartões:** as três secções não tinham classes nem títulos. Agora usam `.mg-card.compact` e `.mg-card-title` com ícone; os títulos usam as chaves existentes `once`, `active` e `activate`/`reactivate`.
5. **Avisos e erro:** `onceHint` e `revokeHint` eram parágrafos simples; agora usam `.mg-note` com ícone de informação. O erro final mantém `role="alert"` e usa `.mg-error`.

Nenhuma chave i18n foi acrescentada ou removida. Nenhuma classe CSS, rota ou API client foi alterada. A ordem dos estados, as validações e a confirmação de revogação em dois passos permanecem no código.

## Verificações

- `npx tsc --noEmit`: passou, sem saída.
- `npx eslint src`: passou com 0 erros e 1 aviso em `src/voice/callSession.tsx:47` (`consistent-type-imports`), fora do ficheiro alterado.
- `npm run verify:i18n-keys`: passou; 918 chaves usadas, 1334 em cada catálogo, 45 chamadas dinâmicas. 416 chaves não usadas são informativas.
- `npm run verify:entry-screens`: passou; 18 casos, guarda de cores literais e diff de ficheiros protegidos.
- `npm run build`: passou; Vite avisou que alguns chunks excedem 500 kB após minificação.
- Leitura do diff e de `mgmt.css`: as classes aplicadas já existem e só `WebhookPanel.tsx` foi alterado como código nesta implementação.
- A verificação interativa da tarefa 2.2 não foi concluída: não havia servidor local acessível para abrir a aba Webhook autenticada. A tarefa permanece desmarcada.

As tarefas 3.1 e 3.2 permanecem desmarcadas conforme solicitado.

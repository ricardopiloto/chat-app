# Tasks

## 1. Condição da pill

- [x] 1.1 Em `frontend/src/chat/ChannelPage.tsx:315`, mudar a condição do `<Show>` de `!pinned() && away() > 0` para `!pinned()` (Decisão 1 de `design.md`). Verificar manualmente: num canal com histórico suficiente para rolar, rolar para cima sem que chegue nenhuma mensagem nova e confirmar que a pill "Saltar para o presente" aparece.
- [x] 1.2 Envolver `<Badge tone="primary" mono>{away()}</Badge>` (mesma linha) em `<Show when={away() > 0}>`, para a contagem só aparecer quando houver mensagens novas. Verificar: no mesmo cenário da Tarefa 1.1 (sem mensagens novas), a pill aparece sem nenhum número; ao chegar uma mensagem nova de outra conta enquanto a pill está visível, o número aparece.

## 2. Verificação de não-regressão

- [x] 2.1 Confirmar que clicar a pill continua a rolar para o fundo e a ocultá-la (`jump()`, inalterado), em ambos os casos (com e sem contagem).
- [x] 2.2 Confirmar que, ao enviar uma mensagem própria ou já estando no fundo (`pinned() === true`), a pill continua a não aparecer, exactamente como hoje.

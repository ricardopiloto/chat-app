# Design

## Context

Ver `proposal.md` e o delta de `frontend-v2/call-popout`. Hoje `Hosts.tsx` renderiza `CallElsewhere` globalmente sempre que a rota difere do canal da chamada, inclusive em texto e configurações. `Stage.tsx` já o renderiza dentro do canal original. `VoicePage.tsx` mostra a pré-entrada em outro canal; `GreenRoom.tsx` só chama `call.join` quando a pessoa confirma a entrada. `join` chama `leave` antes da nova ligação, mas `leave` dispara o fecho do popout sem aguardar o comando nativo.

## Goals / Non-Goals

**Goals:**

- Associar «Bring it back» à tela da chamada original.
- Garantir transição sequencial e única entre popout, chamada anterior e nova chamada.
- Preservar navegação comum sem encerrar áudio ou vídeo da chamada actual.

**Non-Goals:**

- Mover áudio para o popout ou alterar o token de visualização.
- Entrar automaticamente em outro canal de voz apenas por clicar nele; a confirmação continua na pré-entrada.
- Reabrir a chamada antiga se a nova entrada falhar.

## Decisions

1. **Exibição limitada à rota da chamada.** Retirar `CallElsewhere` do host global quando a chamada está no popout. Deixar a versão de `Stage` como o único lugar que mostra «Bring it back» ao ver o canal original. O estado do popout permanece no provedor de chamada ao navegar. Alternativa: esconder o host apenas em canais de texto; ainda apareceria em configurações e na pré-entrada de outro canal.

2. **Troca no ponto de confirmação.** Manter `GreenRoom.enter` como início da transição: visitar outro canal só mostra sua pré-entrada. Ao chamar `join` para um canal diferente, usar uma rotina serializada que fecha e aguarda o popout nativo, desfaz a sessão LiveKit e a presença da chamada antiga via `leave`, e depois inicia a ligação nova. Evitar iniciar duas trocas simultâneas e invalidar operações antigas com o mecanismo `epoch` já existente. Alternativa: fechar o popout ao navegar; isso interromperia a chamada antes de a pessoa decidir entrar.

3. **Fecho manual separado da troca.** `closePopout` continua a fechar só a janela de visualização, deixando a chamada principal intacta. O caminho de troca de canal usa o fecho mais a saída da chamada. A notificação assíncrona `onCallPopoutClosed` não deve limpar o estado de um popout posterior; comparar o canal notificado com o popout corrente. Alternativa: tratar todo fecho como saída da chamada; quebraria «Bring it back» e o botão X.

## Risks / Trade-offs

- [Fecho nativo e nova entrada disputam o estado] → Aguardar o fecho antes do `join` novo e proteger callbacks por canal/geração.
- [Duas confirmações rápidas de entrada] → Serializar ou descartar a segunda operação enquanto a primeira transição estiver em curso.
- [Nova entrada falha depois da saída] → Mostrar o erro na pré-entrada; a chamada anterior permanece encerrada, como definido na spec.

## Migration Plan

Mudança apenas no frontend e no fluxo nativo existente. Não há esquema ou protocolo novo. Reverter o cliente devolve o comportamento anterior.

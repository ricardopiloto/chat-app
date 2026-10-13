# Tasks

## 1. Exibição ligada ao canal da chamada

- [x] 1.1 Remover a apresentação global de `CallElsewhere` quando há popout e manter a indicação apenas em `Stage` do canal de voz activo; verificar, com popout aberto, que canal de texto, configurações e pré-entrada de outro canal não mostram «Bring it back» nem PiP da chamada. Implementado em `Hosts.tsx` (commit `263f2ba`, `v1.3.2`) — `CallElsewhere` só em `Stage.tsx`. Verificação ao vivo ainda por fazer.
- [x] 1.2 Confirmar que voltar ao canal original mostra «Bring it back» e que accioná-lo fecha só o popout, preservando a chamada e restaurando a grade ou PiP; verificar também que navegar sem confirmar nova entrada mantém áudio e popout activos. Implementado (`closePopout`/`closePopoutOnce` em `callSession.tsx`). **Nota**: ver `fix-pip-call-navigation-freeze` — "voltar" via popout foi reportado como não funcionando num teste real (2026-10-12); a verificação desta tarefa deve esperar essa correcção.

## 2. Troca de chamada com popout aberto

- [x] 2.1 Ajustar `join`/`leave` em `callSession.tsx` para aguardar o fecho nativo do popout e a saída da chamada anterior antes da ligação ao novo canal, mantendo o modo e as escolhas de dispositivos da pré-entrada; verificar uma troca real entre dois canais sem popout ou presença duplicados. Implementado (`joinOnce`/`leave` aguardam `closePopoutOnce`/`teardown`, commit `263f2ba`). Verificação ao vivo com dois canais ainda por fazer.
- [x] 2.2 Proteger a sequência de troca contra confirmações repetidas e notificações tardias de fecho do popout; verificar por teste ou simulação de callbacks atrasados que o estado da nova chamada não é limpo pela janela anterior. Implementado (`joining` guard, `popoutGeneration` para descartar callbacks de fechos antigos). Verificação ao vivo ainda por fazer.
- [x] 2.3 Verificar que uma falha de entrada no novo canal deixa o anterior encerrado, mostra o erro na pré-entrada e não reabre o popout; executar `npm run build` no frontend e o teste existente `verify:popout-grid` como regressão da janela. `npm run build` e `npm run verify:popout-grid` confirmados a passar nesta sessão. Falha de entrada real ainda por verificar manualmente.

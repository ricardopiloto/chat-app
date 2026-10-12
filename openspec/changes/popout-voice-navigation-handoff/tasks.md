# Tasks

## 1. Exibição ligada ao canal da chamada

- [ ] 1.1 Remover a apresentação global de `CallElsewhere` quando há popout e manter a indicação apenas em `Stage` do canal de voz activo; verificar, com popout aberto, que canal de texto, configurações e pré-entrada de outro canal não mostram «Bring it back» nem PiP da chamada.
- [ ] 1.2 Confirmar que voltar ao canal original mostra «Bring it back» e que accioná-lo fecha só o popout, preservando a chamada e restaurando a grade ou PiP; verificar também que navegar sem confirmar nova entrada mantém áudio e popout activos.

## 2. Troca de chamada com popout aberto

- [ ] 2.1 Ajustar `join`/`leave` em `callSession.tsx` para aguardar o fecho nativo do popout e a saída da chamada anterior antes da ligação ao novo canal, mantendo o modo e as escolhas de dispositivos da pré-entrada; verificar uma troca real entre dois canais sem popout ou presença duplicados.
- [ ] 2.2 Proteger a sequência de troca contra confirmações repetidas e notificações tardias de fecho do popout; verificar por teste ou simulação de callbacks atrasados que o estado da nova chamada não é limpo pela janela anterior.
- [ ] 2.3 Verificar que uma falha de entrada no novo canal deixa o anterior encerrado, mostra o erro na pré-entrada e não reabre o popout; executar `npm run build` no frontend e o teste existente `verify:popout-grid` como regressão da janela.

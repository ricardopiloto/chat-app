# Tasks

## 1. Entrada automática e preferências

- [x] 1.1 Em `VoicePage.tsx`, iniciar `call.join()` uma vez por activação de canal com `full`/`listen` conforme o acesso efectivo, mic pela preferência e `cam: false`; verificar falante sem cargo, ouvinte e ausência de join duplicado após refresh de canais.
- [x] 1.2 Em `devices.ts`, alterar o default de `camOn` para `false` sem alterar o de `micOn`; verificar primeiro uso e preferência antiga de câmara ligada, confirmando que nenhum join inicia vídeo.
- [x] 1.3 Proteger join pendente contra troca/desmontagem do canal e testar troca entre dois canais com popout aberto, confirmando que não restam chamadas paralelas.

## 2. Erro e remoção da pré-entrada

- [x] 2.1 Substituir o fallback de `GreenRoom` por estado de erro com motivo localizado, retry manual e acesso a Áudio & Vídeo; verificar falha de permissão e indisponibilidade, e que não ocorre loop de retry.
- [x] 2.2 Remover/adaptar `GreenRoom` e o caminho `test`/faixa sintética em `callSession.tsx` se não houver outro chamador; verificar por pesquisa de referências e build que a opção já não aparece.
- [x] 2.3 Actualizar traduções e `docs/v2/parity-checklist.md` para entrada directa e retirada do teste sintético; verificar textos em português e inglês e ausência de critérios contraditórios.

## 3. Integração e revisão

- [x] 3.1 Verificar manualmente: entrar como falante com mic ligado por omissão e câmara desligada; ligá-la depois; entrar como ouvinte; negar permissão do microfone/câmara e confirmar erro com retry; confirmar Áudio & Vídeo funcional fora da chamada.
  - Confirmado pelo usuário em teste manual real: entrada como falante e ouvinte, mic/câmera, negação de permissão com retry e Áudio & Vídeo fora da chamada funcionando.
- [x] 3.2 Revisão dupla dos artefactos e, após implementação, do código (arquiteto + fullstack, skills `spec-review-architect`/`spec-review-fullstack`); registar pareceres, incluindo efeitos em popout e regresso das definições.
- [x] 3.3 Executar `openspec validate direct-join-call-entry --strict` e confirmar aprovação.

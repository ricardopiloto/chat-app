# Resumo de implementação

- `frontend/src/voice/VoicePage.tsx`: inicia uma tentativa por montagem da página do canal, após actualizar canais e papéis; escolhe `full` ou `listen` pelo acesso efectivo, respeita a preferência do microfone e passa sempre `cam: false`. Mostra o motivo localizado de falha, retry manual e acesso a Áudio & Vídeo. Cancela uma entrada pendente ao desmontar.
- `frontend/src/voice/devices.ts`: preferência inicial de câmara desligada; default do microfone mantido.
- `frontend/src/voice/callSession.tsx`: retira o modo sintético `test` e a faixa artificial; serializa joins e waits de leave, preservando a protecção `epoch` e descartando entradas de páginas desmontadas.
- `frontend/src/voice/GreenRoom.tsx` e `frontend/src/voice/testPattern.ts`: removidos. Pesquisa em `frontend/src` e na checklist sem referências a `GreenRoom`, `createTestPattern`, `Testar vídeo` ou `JoinMode` com `test`.
- `frontend/src/i18n/catalogs/voice.en.ts` e `voice.pt-BR.ts`: remove chaves exclusivas da pré-entrada e acrescenta texto de retry; conserva as seis chaves `call.green.*` ainda usadas em Áudio & Vídeo.
- `frontend/src/pages/Account.tsx`: faz o link `#audio-video` deslocar a página até às definições.
- `frontend/src/shell/Content.tsx`: actualiza o comentário da chave estável por id.
- `frontend/src/voice.css`: acrescenta o layout pequeno do estado de erro.
- `docs/v2/parity-checklist.md`: ajusta critérios para entrada directa e teste de câmara nas definições.
- `tasks.md`: 1.1–1.3 e 2.1–2.3 marcadas; secção 3 permanece aberta.

## Verificações

- `npx tsc --noEmit`: passou.
- `npx eslint src`: passou com um aviso preexistente de `consistent-type-imports` em `callSession.tsx:47`.
- `npm run verify:i18n-keys`: passou (886 chaves usadas; catálogos alinhados).
- `openspec validate direct-join-call-entry --strict`: passou. A tarefa 3.3 continua por marcar, conforme pedido.
- `git diff --check`: passou.

Desvio: a verificação de troca rápida e popout foi feita por análise do fluxo e compilação; a matriz manual no navegador continua na tarefa 3.1.

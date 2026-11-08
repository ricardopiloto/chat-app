# Implementação de improve-call-view-controls

- `frontend/src/voice.css`: PiP passa a 260 px em janelas até 1600 px de largura ou 900 px de altura e a 240 px até 1366 px ou 768 px; corpo e botões ficam mais compactos e os cantos inferiores sobem para deixar livre a faixa inferior. O indicador de partilha na faixa lateral do spotlight fica abaixo dos demais chips. Decisão do ponto 1: CSS com media queries, sem observador JavaScript; o arraste e o encaixe de `FloatingPlayer.tsx` permanecem como estavam.
- `frontend/src/voice/CallControls.tsx`: botão de partilha disponível sempre que o utilizador pode falar; ao iniciar com sucesso, selecciona Grade.
- `frontend/src/voice/Stage.tsx`: botão de partilha disponível nas duas vistas fora da edição e transição para Grade apenas após sucesso. O botão de convite mantém a condição original de Grade.
- `frontend/src/voice/callSession.tsx`: `setScreen` devolve `Promise<boolean>` com o estado real da partilha após a tentativa, incluindo cancelamento ou falha.
- `frontend/src/voice/GridView.tsx`: tile lateral do dono da partilha em spotlight mostra ícone e texto de ecrã, mesmo sem vídeo da câmara.
- `openspec/changes/improve-call-view-controls/specs/frontend-v2/voice-grid/spec.md`: acrescentados os dois requisitos modificados para remover a contradição sobre a disponibilidade da partilha.
- `openspec/changes/improve-call-view-controls/tasks.md`: 1.1, 2.1, 2.2 e 2.3 concluídas; 1.2, 2.4 e secção 3 mantidas pendentes conforme pedido.

Verificações: `npx tsc --noEmit` passou; `npx eslint src` passou com um aviso preexistente em `callSession.tsx:48` (`consistent-type-imports`); `openspec validate improve-call-view-controls --strict` passou; `git diff --check` passou. Verificações manuais de resoluções e chamada real ainda pendentes.

Desvios: nenhum no comportamento pedido. Não foi fornecido caminho para `-o`; este ficheiro foi usado como saída.

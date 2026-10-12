# Proposal

## Why

No cliente nativo, depois de guardar uma instância, o ecrã de entrar e de criar conta não oferece forma de a mudar. Quem apontou para o servidor errado fica preso nesse endereço. A acção "Trocar de instância" já existe no menu de conta, depois de autenticado, e no ecrã de desbloqueio. Falta no ecrã em que a pessoa ainda não entrou.

## What Changes

- No cliente nativo, com uma instância já guardada, "Trocar de instância" aparece no ecrã de entrar e no de criar conta.
- Escolher essa acção esquece o endereço guardado, termina qualquer sessão que exista, e volta ao ecrã que pede a instância.
- O menu de conta e o ecrã de desbloqueio mantêm a acção que já têm.
- O browser servido pela própria instância continua sem este passo.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `frontend-v2/instance-connect`: "Trocar de instância" passa a estar disponível também antes de autenticar, no ecrã de entrar e de criar conta.

## Impact

- `frontend/src/pages/Auth.tsx`, reutilizando `clearInstance` de `frontend/src/api/instance.ts`.
- O ecrã de selecção já volta a aparecer quando não há endereço guardado (`frontend/src/index.tsx`).
- Sem alteração de API nem do browser.

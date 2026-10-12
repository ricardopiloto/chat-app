# Review — Desenvolvedor Fullstack

**Change:** https-instance-and-invite-link
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Desenvolvimento do backend

Veredito: N/A — change é puramente frontend, sem endpoint, migração ou evento tocado.

## 2. Desenvolvimento do frontend

Veredito: OK

- Confirmei em `frontend/src/admin/InviteDialog.tsx:43` o uso incondicional de `location.origin` exactamente como `design.md` descreve — a Tarefa 2.1 é directamente implementável trocando essa linha por um ramo `isNative() ? currentInstance().baseUrl : location.origin` (ambos já exportados de `api/instance.ts`, confirmados em uso noutros ficheiros como `http.ts`).
- Confirmei também que `InviteDialog.tsx:23,46,68` já tem um sinal `error`/`setError` reutilizado para mostrar falhas — a Tarefa 2.1 pode reaproveitar este mecanismo exactamente como pede ("mostrar o erro do diálogo"), sem inventar UI nova.
- A Tarefa 1.1 sugere "um teste em Node" para `normalizeInstanceUrl` — o padrão já estabelecido em `frontend/scripts/verify-instance.mjs` (bundla via esbuild, importa de `api/instance.ts`, stuba `fetch`) é directamente reutilizável/extensível para isto, embora esse ficheiro ainda não cubra `normalizeInstanceUrl`/`checkInstance` hoje.

## 3. Deploy e operação

Veredito: N/A — sem porta, serviço ou variável de ambiente nova.

## 4. Qualidade de código

Veredito: OK

- `tasks.md` segue "tarefa + como verificar" com critérios concretos e testáveis (valores de entrada/saída explícitos na Tarefa 1.1). Organização cabe nos ficheiros já existentes, sem refactor não declarado.

## 5. Execução das decisões arquiteturais

Veredito: OK

- Sem tensão com nenhuma decisão existente; convirjo com a leitura do Arquiteto de que o modo de desenvolvimento do Electron (`DEV_URL` já HTTPS) não é afectado pela rejeição de `http://` no ecrã de instância.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- nenhuma

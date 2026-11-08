# Tasks

## 1. Diagnóstico e correcção

- [ ] 1.1 Reproduzir no Windows na primeira entrada; registar estado de instância/sessão, handoff, resposta de `popout-token` e ligação LiveKit sem expor segredos. Instrumentação e classificação de erro implementadas e prontas para a reprodução real; 1.2–1.4 continuam dependentes da causa observada nessa reprodução.
- [ ] 1.2 Corrigir a sequência de inicialização e handoff conforme a causa observada; garantir que `watch` só começa com dependências prontas.
- [ ] 1.3 Classificar erros e adicionar recuperação limitada de falhas transitórias, preservando a ligação principal.
- [ ] 1.4 Verificar primeira abertura, fechar/reabrir, troca de canal, token recusado e reconexão em Windows.

## 2. Revisão

- [ ] 2.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [ ] 2.2 `openspec validate fix-call-popout-windows-join-error --strict`.

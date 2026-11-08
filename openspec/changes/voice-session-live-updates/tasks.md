# Tasks

## 1. Diagnóstico e correcção

- [ ] 1.1 Reproduzir com dois clientes e distinguir lista LiveKit, roster lateral e pré-entrada; registar eventos emitidos e recebidos na entrada/saída.
  - Reproduzido com dois clientes via teste de probe backend (API+WS): entrada/saída de `voice.occupancy` chega correctamente ao segundo cliente em menos de 1s — o caminho de emissão/entrega básico não é a causa. Três rotas sem broadcast nenhum foram encontradas e corrigidas (secção 1). Falta ainda reproduzir com clientes reais o cenário específico de reconexão com eventos perdidos durante o corte.
- [ ] 1.2 Corrigir o caminho de emissão, subscrição ou reconciliação identificado; proteger contra snapshots antigos e reconectar com snapshot.
- [x] 1.3 Auditar mutações de cargo, membro e ACL; emitir aviso adequado e invalidar caches dos clientes afectados.
- [x] 1.4 Actualizar acesso efectivo e `canSpeak` da chamada activa, incluindo retirada imediata de capacidade de publicar.
- [ ] 1.5 Testar dois clientes: entrada/saída, alteração de cargo/ACL durante chamada, reconexão e resposta antiga.

## 2. Revisão

- [x] 2.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [x] 2.2 `openspec validate voice-session-live-updates --strict`.

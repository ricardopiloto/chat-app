# Quickstart: Fase 3 — Correções de UI

Validar [spec.md](./spec.md) após implementar. Pré-requisitos: LiveKit + backend + SPA (`docs/operar-instancia.md`). Duas contas; dono com canal de voz.

## US1 — Modo palco no telemóvel

1. No telemóvel (ou DevTools estreito &lt;900px), entrar no canal de voz e ligar câmara/teste.
2. Activar **Modo palco**.
3. **Esperado**: tiles/vídeo visíveis (próprio feed no mínimo); não ecrã em branco.
4. Alternar Composição/Grade; sair do modo palco — chamada continua; gaveta reabre.

## US2 — Editor + layouts

1. Como **dono**, **Editar cena**.
2. Escolher **Mestre em destaque** — geometria muda (slot grande à esquerda).
3. Com 2ª conta na chamada, atribuir (toque dois passos ou drag) a slots; **Salvar**.
4. No outro cliente (Composição): mesma disposição.
5. Editar de novo, mudar para **Faixa 5-up**, **Descartar** — servidor mantém o último Salvar.
6. Viewport estreita: editor empilhado utilizável.

## US3 — Escala

1. Lado a lado com protótipo v2: barra, botões de chamada, sidebar.
2. **Esperado**: não “uma geração mais pequenos”; botões tocáveis sem zoom.

## US4 — Remoções + permissões

1. Dono: sem painel Co-diretores; sem composer de texto no voz.
2. Conta não-dona: sem Editar/Activar; tentativa de activate via API → 403.
3. Canal de texto: mensagens ok.

## Regressão

```bash
cd backend && cargo test
cd frontend && npx tsc --noEmit
```

Preencher [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md).

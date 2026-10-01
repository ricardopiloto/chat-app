# Proposal

## Why

Com as Fases 0-4 entregues, a `frontend-v2` tem paridade funcional completa com a v1, mas com duas dívidas conscientes acumuladas ao longo de todas as fases anteriores (modo claro e responsividade mobile, ambos resolvidos "de extrapolação" fase a fase, sem nenhum mockup de referência completo) e uma decisão ainda não executada: substituir a v1 em produção. Esta é a **Fase 6 (última) de 6** da reescrita faseada (`docs/v2/TR-frontend-v2.md`) — fecha essas dívidas e executa o corte.

## What Changes

- Auditoria e correcção de modo claro em 100% das telas de produto (não só o shell da Fase 1) — cada fase anterior implementou modo claro por extrapolação dos tokens, sem comparação com um mockup; esta fase revê o conjunto completo.
- Auditoria e correcção de responsividade mobile em 100% das telas de produto — idem, cada fase anterior resolveu isto localmente sem uma auditoria de conjunto.
- Paridade de i18n completa: todos os textos de todas as fases anteriores cobertos nos catálogos pt-BR e en (cada fase anterior só populou o necessário para as suas próprias telas).
- Decisão e execução do corte de produção: apontar o Nginx para `frontend-v2/dist` em vez de `frontend/dist`, ou uma estratégia de routing intermédia, conforme decidido nesta fase.
- Critério de aceite formal de "pronta para substituir a v1" e checklist de paridade final contra `docs/design-system/stitch-prompt.md` §3 (o inventário funcional completo da v1).
- **Fora desta fase**: qualquer funcionalidade nova — esta fase é só polimento e corte, não introduz comportamento novo.

## Capabilities

### New Capabilities
- `frontend-v2/theming-and-responsiveness`: modo claro e responsividade mobile como requisito transversal de aceite, cobrindo todas as capabilities das Fases 1-4.
- `frontend-v2/production-cutover`: critério de corte de produção e configuração de deploy.

### Modified Capabilities
_Nenhuma — todas as fases anteriores ainda não foram arquivadas. Esta fase adiciona requisitos transversais de qualidade e o corte de produção; não modifica os requisitos funcionais já especificados nas Fases 0-4 (esses continuam válidos tal como especificados)._

## Impact

- **Código**: revisão/correcção em `frontend-v2/` (todas as áreas das Fases 1-4), sem código novo de funcionalidade.
- **Infra/deploy**: `infra/` e a configuração Nginx de `docs/deploy-producao.md` passam a apontar para `frontend-v2/dist`; `frontend/` pode ser arquivada ou removida após o corte, conforme decisão registada em design.md.
- **Documentação**: `README.md`, `docs/operar-instancia.md`, `docs/deploy-producao.md`, `CHANGELOG.md` actualizados para reflectir a v2 como a versão em produção.
- **Depende de**: todas as fases anteriores (`frontend-v2-foundation`, `frontend-v2-auth-shell`, `frontend-v2-server-admin`, `frontend-v2-text-chat`, `frontend-v2-voice-video`) entregues e aceites.

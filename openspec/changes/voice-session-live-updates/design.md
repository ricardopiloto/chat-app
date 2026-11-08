# Design

## Context

`callSession.tsx` já escuta `ParticipantConnected`, `ParticipantDisconnected` e `ParticipantPermissionsChanged` do LiveKit. `state.tsx` já trata `voice.occupancy` e protege snapshots antigos por geração. Portanto a causa exacta do relato não está comprovada; a falha pode estar na emissão/entrega do evento, no consumidor de um roster específico ou numa lacuna de reconexão. Para permissões, `state.tsx` invalida canais em `channel_role.changed`, mas não há tratamento equivalente visível para todas as mutações de cargo/membro; `callSession` mantém `canSpeak` local.

## Goals / Non-Goals

**Goals:** presença e acesso efectivo coerentes sem refresh; falhas de entrega recuperadas por reconciliação.

**Non-Goals:** mudar o modelo de permissões, criar novos privilégios ou substituir LiveKit.

## Decisions

### D1: Eventos como aviso; estado autorizado do servidor como fonte

Auditar emissão e destinatários de `voice.occupancy` e dos eventos de cargos/ACL. Cada evento pertinente invalida o cache de canais, membros e cargos necessário e refaz o acesso efectivo do canal activo; reconexão faz snapshot de reconciliação. Resultados antigos não podem sobrescrever geração mais recente. Alternativa: confiar só em eventos LiveKit; rejeitada porque LiveKit reflecte a sala, não o acesso do servidor nem a pré-entrada.

### D2: Actualizar os controlos da chamada activa

Após mudança de permissões, recalcular `canSpeak` a partir da resposta autorizada e actualizar imediatamente botões de mic/câmara/partilha; se o servidor retirar publicação, aplicar a restrição também no LiveKit ou terminar as faixas locais. Alternativa: apenas invalidar o cache Reactivo; insuficiente para estado mantido no `callSession`.

## Risks / Trade-offs

- Eventos perdidos ou fora de ordem: reconciliação na reconexão e geração monotónica por canal.
- A origem exacta do bug da lista requer reprodução com dois clientes e instrumentação dos eventos antes de alterar listeners.

## Open Questions

- Qual das listas falhou no teste: participantes LiveKit na Grade/Composição, roster lateral, ou pré-entrada? A implementação deve verificar as três.

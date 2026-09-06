# Research: 030-voice-roster-avatars

## R1 — `has_avatar` na ocupação (não na tabela de ocupantes)

**Decision**: `OccupantView` (GET occupancy + payload WS `voice.occupancy`) inclui `has_avatar: bool`, calculado no JOIN com `account.avatar_filename IS NOT NULL`. **Não** persistir o booleano em `voice_occupant`. **Não** criar `avatar.updated`.

**Rationale**: Clarificação A — a linha tem de nascer com a foto certa no prazo de 028. A coluna de canais só tem o snapshot/WS de ocupação (não a lista de membros). Clarificação B — mudar a foto com a pessoa já na lista **não** exige push; um JOIN no próximo snapshot/evento de ocupação (join/leave/mídia) basta, e refetch de membros cobre o chat.

**Alternatives considered**: Cliente junta occupancy + GET members — a Sidebar não carrega members hoje; atraso ou iniciais até abrir o painel. Sempre `<img src=/avatar>` e `onerror` — flash de imagem partida. WS `avatar.updated` — rejeitado pelo spec (FR-009 / 029).

## R2 — UI da lista aninhada

**Decision**: Cada `.voice-roster-item` = `IdentityAvatar` compacto + handle. Filtro `mic_on \|\| cam_on` inalterado. Círculo menor que `.msg-avatar` (ex. ~18–22px), `object-fit: cover`, flex sem overflow horizontal.

**Rationale**: Mockup 02; FR-001/004/005. Reutilizar o componente evita dois fallbacks de iniciais.

**Alternatives considered**: Só iniciais na lista de voz (rejeitado pelo pedido). Ícones de mic/câmara por linha (FR-008).

## R3 — Canal de texto

**Decision**: Grupos em `Channel.tsx` continuam a usar `IdentityAvatar` + mapa de membros (`has_avatar`) carregado **ao abrir o canal**, antes/junto do histórico (já 029). Mensagens novas WS usam o mesmo mapa. Sem lista de ocupação sob canais `#` (FR-011).

**Rationale**: US4 / SC-007. 029 já ligou a superfície; esta feature torna-a obrigatória e alinhada às clarificações (foto quando o grupo aparece; sem push se a foto mudar).

**Alternatives considered**: Buscar avatar por mensagem — N+1. Incluir `has_avatar` no payload `message.new` — fora de âmbito (FR-009).

## R4 — Imagem partida

**Decision**: Se `has_avatar` é true mas o GET da foto falha, o círculo MUST cair para iniciais (`onerror` no `IdentityAvatar`), nunca vazio.

**Rationale**: Edge «nunca círculo vazio».

**Alternatives considered**: Deixar o ícone partido do browser (falha SC-003).

## R5 — Testes

**Decision**: Contract: conta com avatar + join a transmitir → snapshot/WS com `has_avatar: true`; sem avatar → `false`. Quem só ouve (mic e cam off) continua fora da lista. FE: `tsc`. Manual: quickstart voz + texto.

**Rationale**: SC-001b / SC-004 sem LiveKit extra além do join já testado em 028.

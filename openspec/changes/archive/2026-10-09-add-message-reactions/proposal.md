# Proposal

## Why

Hoje o chat já permite responder (`reply`) a uma mensagem, mas não permite reagir com emoji — uma forma mais leve e rápida de expressar uma resposta sem poluir o canal com uma nova mensagem. A v2 chegou a excluir explicitamente "reações por hover" do escopo (`frontend-v2/text-messaging`, requisito "Canal de texto fiel ao mockup", e `docs/v2/parity-checklist.md` EXC-06), por não constarem nos mockups auditados nessa fase. O utilizador quer agora reverter essa exclusão e introduzir reações reais, reutilizando o conjunto de emoji ("hypertext"/shortcodes) já disponível no composer e no autocompletar de `:shortcode:`.

## What Changes

- Permitir reagir com emoji a qualquer mensagem do canal de texto, seja mensagem de texto simples, mensagem com anexo(s), ou mensagem com citação de resposta — a reação é sempre à mensagem como um todo, nunca a um anexo individual.
- Adicionar um botão de "reagir" na barra de ações da mensagem (ao lado de responder/apagar), que abre o selector de emoji já existente no composer, reaproveitando o mesmo conjunto de emoji e shortcodes.
- Apresentar, por baixo de cada mensagem que tem pelo menos uma reação, um conjunto de "pills" agrupadas por emoji, cada uma com a contagem de utilizadores e destaque visual quando o próprio utilizador reagiu com aquele emoji.
- Clicar numa pill existente alterna (toggle) a reação do próprio utilizador para aquele emoji: adiciona se ainda não reagiu, remove se já tinha reagido com esse emoji.
- Um utilizador só pode ter uma reação por emoji por mensagem (sem duplicar), mas pode reagir com vários emoji diferentes na mesma mensagem.
- Mostrar, ao focar/hover numa pill, a lista de nomes de quem reagiu com aquele emoji (tooltip), até um limite razoável antes de resumir em "e mais N".
- Sincronizar reações em tempo real entre todos os clientes ligados ao canal (adicionar e remover), de forma análoga aos eventos já existentes de mensagem apagada/editada.
- Remover a frase de exclusão de reações do requisito "Canal de texto fiel ao mockup" em `frontend-v2/text-messaging` e atualizar `docs/v2/parity-checklist.md` (EXC-06) para refletir que reações deixaram de estar fora de escopo.
- Reações **não** são conteúdo de texto livre: o utilizador escolhe sempre de um conjunto fechado de emoji (o mesmo já usado no composer), nunca digita texto livre numa reação.

## Capabilities

### New Capabilities
(nenhuma — reações são um comportamento adicional da mensagem, não uma capability isolada)

### Modified Capabilities
- `frontend-v2/text-messaging`: adiciona um novo requisito de reações com emoji (reagir, alternar, contagem agrupada, tooltip de autores, tempo real) e remove a exclusão explícita de "reações por hover" do requisito de fidelidade ao mockup.

## Impact

- **Frontend**: componente de mensagem (barra de ações, render de pills de reação), reutilização do componente de selector/autocompletar de emoji já usado no composer, estado/sincronização em tempo real das reações por mensagem.
- **Backend**: novo(s) endpoint(s) e/ou evento(s) de websocket para adicionar/remover reação numa mensagem, e persistência de reações associadas a `message_id` + `user_id` + `emoji`.
- **Docs**: `docs/v2/parity-checklist.md` (linha EXC-06) deixa de listar reações como fora de escopo.
- Não afeta a cifra do conteúdo da mensagem (`content_ciphertext`): o emoji da reação é um identificador de um conjunto fechado, não texto livre do utilizador — o modelo de cifra ponta-a-ponta existente é tratado em detalhe em `design.md`.

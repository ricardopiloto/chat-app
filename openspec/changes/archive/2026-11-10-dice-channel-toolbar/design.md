# Design

## Context

Ver `proposal.md` — Why. Estado actual após `chat-dice-rolling`:

- Canal `ChannelType::Dice` e `DiceComposer` em `frontend/src/chat/DiceComposer.tsx`, montado em `ChannelPage.tsx` só quando `channel.type === "dice"`.
- Rolagem via `POST /api/channels/{id}/dice` com notação `NdM+K` (um único `sides` por pedido); limites `count` 1–20, `sides` 2–1000, modificador −100…100.
- Não existe ainda tabela/API de preferências de UI por conta para dados; o precedente de estado por conta é `channel_read_state` (`account_id` + entidade), não `localStorage` para dados de servidor.
- Auth já expõe `GET /api/auth/me`; rotas autenticadas vivem no router em `backend/src/api/mod.rs`.

## Goals / Non-Goals

**Goals:**
- Barra + checklist só no canal Dados; formulário mantido e compactado.
- Persistência server-side da checklist por conta; L/R-click com um tipo activo sincronizado ao composer.
- Reutilizar o endpoint de rolagem existente sem mudar o protocolo `NdM+K`.

**Non-Goals:**
- Pools multi-face (`2d6+1d8`) nesta ronda.
- Barra no popover de Texto.
- Persistência das quantidades (`count`) por face (sessão apenas).
- Preferência por servidor ou por canal (é por conta na instância).
- Novos lados custom na checklist (só o conjunto padrão).

## Decisions

### D1. Preferência por conta, não por servidor/canal

A checklist é uma preferência de UI do jogador na instância (`account_id` PK). Alternativa considerada: por `server_id` — útil se mesas diferentes usarem sets distintos, mas o pedido foi “por utilizador” e a barra é a mesma ferramenta em qualquer canal Dados; por conta evita N linhas por membership e cobre reabrir noutro servidor da mesma conta com o mesmo set. Se mais tarde for preciso por servidor, a chave torna-se `(account_id, server_id)` sem mudar o contrato de faces.

### D2. Tabela `account_dice_toolbar`

```sql
CREATE TABLE account_dice_toolbar (
  account_id TEXT PRIMARY KEY REFERENCES account(id) ON DELETE CASCADE,
  visible_sides TEXT NOT NULL, -- JSON array de inteiros, ex. [4,6,8,10,12,20,100]
  updated_at TEXT NOT NULL
);
```

Validação no API: cada elemento ∈ `{4,6,8,10,12,20,100}`, sem duplicados, ordenação canónica ao gravar. Array vazio é permitido (barra sem ícones; formulário continua a rolar). Default na ausência de linha: o conjunto completo padrão (não inserir linha até o primeiro PUT).

### D3. API `GET`/`PUT /api/auth/dice-toolbar`

- Prefixo `/auth/...`, o mesmo das preferências da própria conta já existentes (`/auth/key-reminders`, `/auth/display-name`, `/auth/avatar`), registado em `auth::router()` — evita um namespace `/api/account/...` novo sem precedente.
- `GET`: devolve `{ visible_sides: number[] }` (default completo se não houver linha).
- `PUT`: body `{ visible_sides: number[] }`; substitui a lista; `400` se inválido.
- Autenticado com a sessão actual (`AuthUser`); só a própria conta.
- Sem evento realtime (preferência pessoal; o cliente actualiza após PUT bem-sucedido).
- Alternativas rejeitadas: `/api/me/...` (sem precedente); `/api/account/...` (introduziria um terceiro padrão só para esta feature).

### D4. UI: barra + checklist no rodapé do canal Dados

- Novo componente (ex. `DiceToolbar`) montado junto a `DiceComposer` no ramo Dados de `ChannelPage`, não no popover de Texto.
- Layout: barra horizontal de botões de face (rótulo `dN` + badge de quantidade); controlo “configurar” abre checklist (popover ou painel inline) com as 7 faces.
- CSS: compactar `.ch-dice-field` / composer Dados (altura/gap/inputs) para partilhar o rodapé com a barra sem empurrar a timeline de forma desproporcional; tokens do design system.
- Clique esquerdo / direito: `preventDefault` no context menu do botão do dado; quantidade em sinal Solid de sessão; face clicada torna-se `activeSides` e actualiza o input de notação do composer (`${count}d${sides}`), preservando modificador/rótulo.
- Tecto de quantidade: 20 (igual ao backend). Mínimo 1 enquanto a face está na barra; remover da checklist remove o ícone (e o estado de count dessa face).

### D5. Sincronização composer ↔ barra

- Fonte de verdade da rolagem continua a ser o formulário no submit (`composeDiceNotation`).
- A barra escreve na notação do composer quando o utilizador interage com um dado.
- `DiceComposer` hoje guarda `notation`/`modifier`/`label` só em sinais internos — elevar o mínimo necessário (props controladas de notação, ou callback `onNotationChange` / sinal partilhado no wrapper do rodapé Dados) para a barra poder actualizar `${count}d${sides}` sem aceder a estado privado.
- Edição manual da notação no formulário NÃO é obrigada a actualizar a barra nesta ronda (evitar parsers ambíguos); documentado como trade-off. Se a notação manual for incompatível, o submit usa o formulário.

### D6. Dependência de `chat-dice-rolling`

Implementar só depois (ou em cima) do composer/canal Dados estáveis. Não alterar overlay, RNG, nem `dice_animations_enabled`.

## Risks / Trade-offs

- [Preferência global por conta vs por mesa] → Mitigação: D1 explícito; evoluir chave se o utilizador pedir por servidor.
- [Notação manual dessincronizada da barra] → Mitigação: D5; barra é atalho, formulário manda no submit.
- [Clique direito em trackpads / mobile] → Mitigação: no desktop contextmenu; em touch, checklist + stepper (−/+) acessível por botão longo ou controlos ± visíveis se `pointer: coarse` (tarefas podem incluir ± explícitos além de L/R).
- [Array vazio na barra] → Aceite; formulário cobre o caso.

## Migration Plan

1. Migração SQL aditiva `account_dice_toolbar` (sem backfill obrigatório).
2. Rotas `GET`/`PUT /api/auth/dice-toolbar` + testes de contrato.
3. Frontend: API client, `DiceToolbar`, compactação do composer, i18n.
4. Rollback: dropar tabela/rotas; UI volta ao composer só — sem dados de canal afectados.

## Open Questions

Nenhum que bloqueie specs/tarefas; pormenor de ± em touch fica como detalhe de implementação na tarefa de UI.

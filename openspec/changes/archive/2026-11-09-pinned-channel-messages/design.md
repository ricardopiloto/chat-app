# Design

## Context

O backend usa SQLite: `channel` e `message` são tabelas distintas, com `message.channel_id` e exclusão de mensagens por `DELETE` em `backend/src/db/message.rs`. `Message` e `Channel` são modelos separados. `backend/src/api/messages.rs` expõe listagem/criação/exclusão; exclusão valida acesso ao canal, verifica uma permissão específica para apagar e publica `message.deleted` via `send_to_channel_viewers`. Não há edição de texto nesse contrato atual, portanto o pin não depende de fluxo de edição. O histórico é paginado em lotes de 200.

`backend/src/api/channels.rs::require_channel_manager` resolve dono, criador, `can_manage_channels` e posição na hierarquia. No frontend, `canManageChannel` em `frontend/src/lib/capabilities` já controla ações na sidebar; a API precisa repetir a verificação. `frontend/src/api/realtime.ts` enumera eventos aceitos, e `frontend/src/chat/thread.ts` processa `message.deleted`. A busca passa `messageId` para `Hosts.tsx`, que abre `?msg=<id>`; `ChannelPage.tsx` pagina até dez lotes, usa `data-msg`, centraliza com `scrollIntoView` e ativa `highlighted`. `timeline.ts` só organiza as linhas, sem lógica de jump. O sinal local `pinned()` em `ChannelPage` significa atualmente “preso ao fundo” da rolagem, não mensagem pinada; novos nomes devem evitar colisão.

## Goals / Non-Goals

**Goals:**
- Pin único e durável com leitura autorizada para todos que veem o canal.
- Troca atômica, confirmação explícita e atualização em tempo real.
- Reaproveitar o salto e destaque da mensagem existente.

**Non-Goals:**
- Múltiplos pins, ordenação, edição de mensagem ou preview em texto claro fornecido pelo servidor.
- Pin em canais de voz/vídeo.

## Decisions

### D1: Referência ao pin no canal

Adicionar `channel.pinned_message_id TEXT NULL REFERENCES message(id) ON DELETE SET NULL`, com índice apenas se uma consulta precisar dele. Um campo expressa diretamente a cardinalidade 0..1 e a FK limpa o pin quando a mensagem é apagada. Uma tabela separada adicionaria join e chave única para o mesmo estado, sem necessidade de histórico de pins. A migração e a camada `db::channel` expõem o ID no `Channel` e/ou em um endpoint de leitura do estado. O servidor verifica sempre que o alvo pertence ao canal e é elegível; nunca aceita ID de outro canal. **Elegível** = mensagem com `kind` de usuário (texto, com ou sem anexo) do próprio canal de texto; mensagens de webhook (`kind = 'webhook'`) não são pináveis nesta change, e o menu do cliente aplica a mesma regra que o servidor (o servidor é autoritativo, 422 se inelegível). A migração é `0029` (a última é `0028_channel_webhooks.sql`). Como `message.channel_id` já referencia `channel`, a FK fica circular: apagar um canal com pin tem de ser coberto por teste. A FK resolve a limpeza persistida, mas a API de exclusão ainda publica o novo estado do pin após o commit. Para saber se a mensagem apagada era a pinada, `delete_message` lê `pinned_message_id` do canal **antes** de `delete_by_id` e, se coincidir, publica `channel.pin_changed` com `null` além de `message.deleted`.

### D2: REST com precondição para troca

Propor `PUT /channels/{channel_id}/pin` com `message_id` e `expected_pinned_message_id` (nulo se nenhum) e `DELETE /channels/{channel_id}/pin` para despinar. A mutação usa `require_channel_manager`, valida canal de texto e executa leitura/comparação/gravação em transação. Divergência da precondição devolve 409 com o ID atual para a UI atualizar e pedir confirmação novamente. Isso cobre dois gestores concorrentes e evita que uma confirmação antiga substitua um pin novo. O diálogo aparece antes do PUT quando já há outro pin; cancelar não chama a API. Para remover, o cliente envia a precondição do ID que pretende remover. Uma rota de leitura, ou a resposta atual de `GET /channels/{id}`, entrega o estado a membros com permissão de visualização, incluindo após reconexão. A API nunca retorna conteúdo descriptografado. `domain::Channel`, `SELECT_COLS` e todos os `SELECT ... FROM channel c` ganham o campo `pinned_message_id`.

### D3: Evento de estado para os espectadores

Publicar `channel.pin_changed` com `channel_id` e `pinned_message_id` (nulo ao limpar) via `send_to_channel_viewers`, depois da transação. Incluí-lo em `REALTIME_EVENTS`; atualizar o estado do canal aberto e a lista em memória. Após reconectar, refazer a leitura do canal para recuperar eventos perdidos. Na exclusão, enviar `message.deleted` e o estado nulo do pin quando a mensagem excluída era a pinada. O evento informa só o ID; cada cliente conserva a responsabilidade de descriptografar mensagens.

### D4: Pin indisponível para quem não vê o histórico

O histórico visível de cada membro é definido por `history_visible_since` (`backend/src/api/authz.rs`): quem criou o convite escolhe `include_history`; sem histórico compartilhado, o membro só vê mensagens desde `joined_at`. O pin não pode contornar essa regra. Se a mensagem pinada é anterior à janela do membro, o informativo aparece em estado **indisponível** (“Mensagem fixada indisponível”), sem texto, autor nem salto, e sem vazar conteúdo. O servidor decide a disponibilidade; o ID pode seguir no estado do canal, mas toda leitura da mensagem (busca direcionada, D5) aplica `history_visible_since` e recusa o que estiver fora da janela. O cliente trata a recusa como “indisponível”, nunca como erro genérico.

### D5: Busca direcionada da mensagem

Não existe GET de mensagem única, e `list_messages` só tem `before` e limite 200. Adicionar `GET /channels/{channel_id}/messages/{message_id}` e/ou `?around=<id>` em `list_messages`, ambos com `membership_for_channel` + `history_visible_since`. Isso permite (a) obter a mensagem pinada para o excerto do informativo e (b) saltar a pins além das dez páginas de `MAX_JUMP_PAGES`, sem paginar às cegas. A resposta devolve a mensagem cifrada como as demais; o cliente descriptografa.

### D6: UI e salto reutilizados

Exibir ação de pinar/despinar no menu da mensagem somente quando `canManageChannel` for verdadeiro; a API mantém a decisão autoritativa. O informativo fica fixo no topo da área do canal enquanto houver pin, para qualquer membro que possa vê-lo, mesmo quando a mensagem não está no lote carregado. Clicar aciona o mesmo caminho de `Hosts.tsx` para `?msg=<id>` e o mesmo destaque de `ChannelPage`. Como o limite atual de dez páginas pode não alcançar pins antigos, ampliar o mecanismo de localização para buscar a página que contém o ID por endpoint/cursor direcionado, ou paginar até encontrar com estado de carregamento e erro explícito; a implementação não deve declarar sucesso se o alvo não foi encontrado. O efeito de deep link em `ChannelPage` só reexecuta quando `focusMessageId` muda; por isso o clique no informativo gera um **nonce de foco** incrementado a cada clique, para permitir cliques repetidos no mesmo pin. O excerto do informativo vem da mensagem carregada ou obtida por D5 e descriptografada no cliente; se não puder ser lida (chave ausente, falha de decifragem), mostra o rótulo genérico “Mensagem fixada”. Os nomes de estado usam `pinnedMessageId` para não colidir com `pinned()` de `ChannelPage`, que significa “preso ao fundo”.

## Risks / Trade-offs

- **Vazamento de histórico via pin** → a busca direcionada reutiliza `history_visible_since`; teste com membro sem histórico compartilhado e pin anterior a `joined_at`.
- **FK circular channel↔message** → teste de exclusão de canal com pin.

- **FK em SQLite pode não limpar como esperado se a conexão não aplicar foreign keys** → conferir a configuração existente e testar exclusão real; se necessário limpar explicitamente na mesma transação.
- **Mensagem muito antiga fora do limite de jump** → fornecer busca direcionada ou paginação completa com controle de progresso, testada com mais de dez páginas.
- **Mudança concorrente de pin** → comparar o ID esperado na transação e responder 409; a UI recarrega o estado.
- **Perda de evento WebSocket** → reidratar por leitura autorizada na reconexão.

## Migration Plan

Registrar a mudança em `docs/v2/contracts/backend-change-policy.md`. Adicionar coluna nullable, sem pin para canais existentes. Deploy do backend antes do frontend; clientes antigos ignoram o campo e evento novos. Rollback de frontend mantém o pin no banco sem UI; rollback de schema exige migração reversa que recrie `channel` sem a coluna, seguindo o padrão SQLite do projeto.

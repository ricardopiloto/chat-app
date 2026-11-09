# Review — Arquiteto de Soluções

**Change:** pinned-channel-messages
**Data:** 2026-11-09
**Veredito geral:** Bloqueado (dois bloqueantes de correção simples — ver secções 3 e 4)

## 1. Definição da arquitetura técnica
Veredito: OK

- Sem stack nova: coluna nullable em `channel`, dois verbos REST sob `/channels/{id}/pin`, um evento WS e estado no frontend SolidJS. Reaproveita `require_channel_manager`, `send_to_channel_viewers` e o salto `?msg=` já existentes.
- D1 (campo `channel.pinned_message_id` em vez de tabela) é a escolha certa para cardinalidade 0..1 sem histórico. A FK `ON DELETE SET NULL` é viável: `backend/src/db/mod.rs:36` ativa `foreign_keys(true)`, e `ALTER TABLE ADD COLUMN ... REFERENCES` é aceite pelo SQLite com default NULL.
- Sem risco de escala: um ID por canal.

## 2. Integração com a infraestrutura existente
Veredito: OK

- Nenhum processo, porta ou variável nova; deploy backend-primeiro, clientes antigos ignoram campo/evento novos (Migration Plan). Última migração é `0028_channel_webhooks.sql`, a nova seria `0029`.
- **Nota — FK circular**: `message.channel_id → channel` e `channel.pinned_message_id → message`. Apagar um canal (`db::channel` DELETE, linha ~153) faz cascade em `message`, que dispara `SET NULL` numa linha de `channel` que está a ser apagada. Normalmente funciona em SQLite, mas deve ter teste explícito de "apagar canal com pin" (hoje só se testa apagar a mensagem).

## 3. Qualidade de arquitetura e trade-offs
Veredito: Bloqueante

- **Bloqueante — visibilidade de histórico**: `list_messages` (`backend/src/api/messages.rs:88-91`) aplica `history_visible_since(&membership)`: um membro novo só vê mensagens a partir de uma data. A spec diz que o informativo é para "todos os membros com acesso ao canal" e o design devolve o ID do pin a todos. Se o pin for anterior ao início de visibilidade de um membro, o cliente receberia um ID que não pode resolver, e qualquer endpoint de busca direcionada (D4) que ignore esse filtro passaria a **vazar mensagem fora da janela permitida**. O design tem de decidir e especificar: (a) o informativo é omitido/oculto para quem não vê a mensagem, e (b) o endpoint de busca direcionada reutiliza `history_visible_since`. Acrescentar cenário à spec e teste em `tasks.md`.
- **Atenção — permissão**: reutilizar `require_channel_manager` (gestão do canal, incl. hierarquia dono/criador) para pinar é conservador e consistente com o pedido, mas “pinar” é mais próximo de moderação de mensagens do que de gestão do canal; o design deveria registar essa escolha como decisão deliberada (alternativa: capacidade própria) para não parecer acidental. Não bloqueante.
- **Atenção — elegibilidade**: a spec fala em “mensagem de texto”, mas `message.kind` inclui `'webhook'` (`db/message.rs:251`). Definir se mensagens de webhook (e apenas-anexo) são pináveis; hoje o design diz só “elegível”. O servidor tem de aplicar a mesma regra que o menu do cliente.
- **Atenção — fonte de verdade do pin**: o pin é lido de `GET /channels/{id}` (D2/D3). Garantir que listas de canais em cache e o evento `channel.pin_changed` não divergem (o design cobre reconexão — bom).
- Segurança/E2EE: correto manter só o ID no servidor; texto do informativo é derivado no cliente (ver secção 5 do fullstack para a consequência prática).

## 4. Documentação e decisões (ADRs)
Veredito: Bloqueante

- `design.md` segue o formato D1–D4 com alternativas e riscos — bem feito.
- **Bloqueante**: `functional-parity` exige que alterações de backend fiquem registadas como tarefa explícita e em `docs/v2/contracts/backend-change-policy.md` (precedentes vivos: `add-message-reactions`, `native-client-auth`). Esta change adiciona coluna em `channel`, dois endpoints, um campo no JSON de canal e um evento WS, e `tasks.md` não tem tarefa para o registo. **Como desbloquear**: acrescentar tarefa em 1.x para adicionar a linha (data, change, requisito, alteração, retrocompatibilidade, testes) à tabela.

## 5. Ponte entre produto e técnico
Veredito: OK

- O “Why” (mensagens importantes perdem-se) traduz-se bem em pin único + salto + tempo real. Não-objetivos (múltiplos pins, voz) estão explícitos.
- N/A — funcionalidades de RPG: projeto é chat/voz, não se aplica.

## Bloqueantes antes de implementar
- Especificar e testar a interação do pin com `history_visible_since` (secção 3).
- Acrescentar tarefa de registo em `docs/v2/contracts/backend-change-policy.md` (secção 4).

**Reconciliação (2026-11-09):** decisão do usuário — pin fora da janela de histórico do membro fica **indisponível** (design D4, spec “Pin fora do histórico visível”, tarefas 1.5/2.3). A premissa de que quem cria o convite decide o histórico compartilhado já está implementada (`invite.include_history` → `history_visible_since`); o pin passa a respeitá-la. Tarefa 1.6 adicionada para `backend-change-policy.md`. Elegibilidade (webhook recusado) em D1; permissão de gestão mantida. Bloqueantes resolvidos antes de implementar.

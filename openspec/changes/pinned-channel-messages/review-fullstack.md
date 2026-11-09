# Review — Desenvolvedor Fullstack

**Change:** pinned-channel-messages
**Data:** 2026-11-09
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: Atenção

- Viável: `require_channel_manager` (`backend/src/api/channels.rs:174`) já devolve contexto de dono/criador/hierarquia; PUT/DELETE transacionais com precondição + 409 (D2) são implementáveis com `sqlx` sem dependência nova.
- **Atenção — `Channel` e `SELECT_COLS`**: `domain::Channel` (`domain/channel.rs:53`) e `SELECT_COLS` em `db/channel.rs:45` precisam do novo campo (`pinned_message_id: Option<Uuid>`); `tasks.md` 1.1 cobre, mas convém listar que todos os `SELECT ... FROM channel c` (linhas 101, 118) e qualquer construção literal de `Channel` em testes têm de ser atualizados.
- **Atenção — evento na exclusão (1.3)**: `delete_message` (`messages.rs:387-398`) apaga e publica `message.deleted`; a FK limpa o pin, mas o handler não sabe se a mensagem era a pinada. Tem de ler `pinned_message_id` **antes** do `delete_by_id` (ou comparar depois) para decidir publicar `channel.pin_changed` com `null`. Escrever isto na tarefa.
- **Atenção — busca direcionada (D4)**: `list_messages` só tem `before` e limite 200, e não existe GET de mensagem única. O salto a pins antigos precisa de um endpoint novo (ex.: `?around=<id>` ou `GET .../messages/{id}`), que também deve respeitar `history_visible_since` (ver review do arquiteto). Hoje `tasks.md` 2.4 só fala em teste de interface; falta a tarefa backend correspondente em 1.x.
- Testes de contrato: pin por não-gestor (403), alvo de outro canal, alvo webhook/inelegível, 409 com ID atual, apagar canal com pin.

## 2. Desenvolvimento do frontend
Veredito: Atenção

- Viável com a stack atual: `MAX_JUMP_PAGES = 10` em `ChannelPage.tsx:23` e o efeito de deep link (linhas 223-236) são o ponto de extensão; o destaque (`setHighlighted`) e `data-msg` já existem.
- **Atenção — o efeito só reexecuta quando `focusMessageId` muda** (`on([status, focusMessageId])`). Clique repetido no mesmo pin não faria nada; D4 já menciona nonce — transformar em tarefa explícita em 2.4 e verificar que o `?msg=` em `Hosts.tsx` é limpo/atualizado.
- **Atenção — conteúdo do informativo**: o servidor só dá o ID e o corpo é cifrado (E2EE). Para mostrar um excerto, o cliente precisa da mensagem (carregada ou obtida pela busca direcionada) e de a decifrar; se falhar, mostrar texto genérico (“Mensagem fixada”). Definir isto em 2.3 para não depender de a mensagem estar no lote atual.
- **Atenção — i18n**: tarefa 2.5 junta tudo no fim; melhor distribuir chaves em 2.2/2.3 como no precedente (`chat.pt-BR.ts` / `chat.en.ts`) e correr `npm run verify:i18n-keys`.
- Evitar colisão: `pinned()` em `ChannelPage.tsx:104` significa “preso ao fundo”; usar nomes como `pinnedMessageId`.

## 3. Deploy e operação
Veredito: OK

- Migração nullable sem backfill; sem porta, serviço ou variável; `docs/deploy-producao.md` não muda. Rollback de frontend deixa o pin inerte no banco.

## 4. Qualidade de código
Veredito: Atenção

- `tasks.md` segue o padrão “tarefa + como verificar”.
- **Atenção — faltam o fecho e a revisão dupla**: o precedente inclui sweep final (`tsc --noEmit`, `eslint src`, `npm run check:v1-overlap`, `npm run verify:i18n-keys`, `cargo test`) e uma tarefa de “Revisão dupla (arquiteto + fullstack)” como nas outras changes ativas. 3.1 só cita testes e `openspec validate`. Acrescentar.
- Reconexão está coberta (2.1) — bom.

## 5. Execução das decisões arquiteturais
Veredito: OK

- As tarefas seguem D1–D4. As lacunas acima são ajustes de `tasks.md` (endpoint de busca, leitura prévia na exclusão, i18n, fecho), não revisão de desenho; a única questão de desenho (visibilidade de histórico) está no review do arquiteto.

## Bloqueantes antes de implementar
- Nenhum próprio; depende da resolução dos bloqueantes do arquiteto.

## Limitações técnicas a reportar ao Arquiteto
- Não existe endpoint de mensagem única/“around”; D4 admite “busca direcionada” mas isso é backend novo e deve entrar em `design.md`/`tasks.md` e no registo do backend-change-policy.
- O informativo depende da mensagem estar decifrável no cliente; decidir o fallback.

**Reconciliação (2026-11-09):** `design.md` ganhou D4 (indisponível), D5 (leitura direcionada) e ajustes em D1/D3/D6; `tasks.md` ganhou leitura prévia na exclusão e teste de canal com pin (1.3), leitura direcionada (1.5), registro de contrato (1.6), nonce e fallback do texto (2.3/2.4), i18n distribuído (2.2/2.3), sweep final (3.2) e revisão dupla (3.3). Todos os achados resolvidos.

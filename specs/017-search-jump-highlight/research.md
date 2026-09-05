# Research: 017-search-jump-highlight

## 1. Como passar a mensagem alvo do hit ao canal

**Decision**: Incluir `message=<messageId>` (UUID) na URL de navegação já usada por `openHit`, p.ex. `/channels/{channelId}?server={serverId}&type=text&message={messageId}`. O painel de pesquisa continua a chamar `onCollapse()` após navegar.

**Rationale**: Rota já existe; query string é partilhável e sobrevive ao remount do `Channel` ao mudar de canal; mesmo canal + novo `message=` pode re-disparar efeito de foco.

**Alternatives considered**:
- Store global / context sem URL — perde deep-link e complica remount.
- Hash `#message-id` — menos explícito junto a outros query params do shell.

## 2. API de histórico e «páginas» com limite

**Decision**: Reutilizar `GET /api/channels/{channel_id}/messages?before=<RFC3339>` (limite servidor **200**, `ORDER BY created_at ASC`). Após o load inicial, se o `messageId` não estiver na lista: até **5** pedidos adicionais com `before` = `created_at` da mensagem mais antiga já carregada, prepend/merge, e procurar de novo. Esgotado o limite ou página vazia → toast US3. **Não** adicionar `GET .../messages/{id}` nesta feature salvo bloqueio imprevisto.

**Rationale**: Clarificação — carregar com limite razoável. 5×200 = até 1000 mensagens no seek; alinhado ao limite actual da API. Hoje Search e Channel usam o mesmo endpoint sem `before` (primeira página de 200); hits da pesquisa costumam já estar no load inicial — o seek cobre edge cases e evolução futura.

**Alternatives considered**:
- Só falhar se não estiver no primeiro load — rejeitado pela clarificação B.
- Endpoint dedicado por id — mais trabalho backend; adiar.
- Seek sem limite — rejeitado na clarificação.

## 3. Scroll centrado + destaque ~3 s

**Decision**: Em cada `.msg-block` (ou wrapper por mensagem) expor `data-message-id={id}`. Após a mensagem existir no DOM: `scrollIntoView({ block: "center", inline: "nearest" })`, adicionar classe CSS `.msg-highlight` (tokens Mesa / accent), remover após **3000 ms** ou ao iniciar um novo salto (cancelar timer). Não limpar por scroll/clique.

**Rationale**: Clarificações (centrar, 3 s, sem clear por scroll/clique). `scrollIntoView` é nativo e suficiente.

**Alternatives considered**:
- Scroll manual calculando offsets — mais frágil.
- Highlight permanente até dismiss — fora da clarificação.

## 4. Toast / banner de falha

**Decision**: Módulo mínimo de toast (signal + `showToast(message)` + host no shell autenticado), estilo não-modal (banner/toast canto ou top), auto-dismiss ~4 s. Copy PT: p.ex. «Mensagem não encontrada». Abrir o canal quando a navegação for possível mesmo em falha de highlight.

**Rationale**: Clarificação A; não há toast genérico no FE hoje (só banners pontuais). Evitar `Dialog` modal (clarificação).

**Alternatives considered**:
- Só `setError` no Channel — menos visível após pesquisa recolhida.
- Modal — rejeitado.

## 5. Corridas entre selecções rápidas

**Decision**: Geração/nonce por salto (`highlightGen` ou ler `message` da URL + timestamp); só a última geração aplica scroll/highlight/toast.

**Rationale**: Spec edge case — última selecção manda.

**Alternatives considered**: Fila de saltos — overkill.

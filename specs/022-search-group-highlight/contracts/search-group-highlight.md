# Contrato: Destaque de grupo após salto da pesquisa

Âmbito: `Channel.tsx` highlight path + `mesa-theme.css`. Extende comportamento visual de [017](../../017-search-jump-highlight/); seek/toast/query `message=` inalterados.

## Apply

1. Localizar mensagem: `[data-message-id="{id}"]` (como hoje).
2. `scrollIntoView({ block: "center", inline: "nearest" })` nesse elemento.
3. `group = messageEl.closest(".msg-group")`.
4. Se `group`: remover highlight anterior; `group.classList.add("msg-highlight")`; timer ~3000 ms remove a classe.
5. Se não houver `group`: não aplicar highlight no bloco; não inventar estilo no hit.

## Clear / replace

- Novo jump: limpar grupo anterior, destacar o novo.
- Cleanup unmount: limpar timer + classe.
- Scroll/click no chat: **não** limpam (017).

## CSS

```text
.msg-group.msg-highlight { /* fundo/contorno accent; cobre avatar+meta+blocos */ }
```

- MUST NOT rely on `.msg-block.msg-highlight` for search jumps after this feature.
- MUST NOT add a second search-highlight class on the hit `.msg-block`.

## Out of scope

- Hover highlight (021), search query syntax (014), API.

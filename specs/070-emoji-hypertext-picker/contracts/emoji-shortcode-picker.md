# Contrato: Shortcode + picker de emoji

Âmbito: Composer de chat (+ picker reutilizável no nome do canal). Sem API.

## Picker (ícone)

| Regra | Obrigatório |
|-------|-------------|
| Abrir selector pelo ícone emoji | Sim |
| Inserir glyph no campo activo na posição do cursor | Sim |
| Fechar sem escolha não altera o texto | Sim |
| Navegável (pesquisa e/ou categorias) para achar emoji comum depressa | Sim |
| Disponível no composer | Sim |
| Disponível em create/rename do nome do canal | Sim |

## Shortcodes (só composer)

| Regra | Obrigatório |
|-------|-------------|
| Após `:` com token activo, lista filtrada | Sim |
| Sem substituição automática (incl. ao fechar `:nome:`) | Sim |
| Enter / clique aceita e substitui só o segmento | Sim |
| Esc / dispensar mantém o texto | Sim |
| Enter com lista aberta não envia a mensagem | Sim |
| Campo nome do canal **sem** sugestão de atalho | Sim |

## Conflito com @

- No máximo um picker de token activo (`@` **ou** `:`), baseado no caret.

## Fora deste contrato

- Packs custom; stickers; reacções.

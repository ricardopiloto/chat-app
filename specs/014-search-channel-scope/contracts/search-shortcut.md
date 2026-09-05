# Contrato: Atalho Ctrl+F / Cmd+F

Âmbito: shell autenticado (`TopBar` / `AppShell`). Não aplica em ecrãs de login/auth.

## Activação

1. `keydown` com `(ctrlKey || metaKey) && key === "f"` (case-insensitive se necessário).
2. `preventDefault()` e `stopPropagation()` para evitar a pesquisa nativa do browser.
3. Expandir o campo de pesquisa da topbar se estiver recolhido.

## Pré-preenchimento

| Contexto | Comportamento |
|----------|----------------|
| Rota = canal de **texto** (nome conhecido) | Substituir o valor do campo por `#<nome> ` (nome exacto + espaço); focar; caret no fim |
| Rota ≠ canal de texto (voz, home, etc.) | Expandir/focar **sem** injectar `#`; não aplicar a substituição por prefixo |
| Campo já tinha texto + canal de texto | **Sempre substituir** pelo `#nome ` actual |

## Repetir o atalho

Mesmo comportamento: em canal de texto, volta a substituir pelo `#nome ` do canal **actual** (se o utilizador mudou de canal, o prefixo actualiza).

## Fora de âmbito

- Não alterar atalhos noutros produtos/browser fora do shell Mesa autenticado.
- Não implementar Ctrl+Shift+F nem outros atalhos nesta feature.

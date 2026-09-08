# Quickstart: 070-emoji-hypertext-picker

## Prerequisites

- App a correr (`npm run dev` + API); sessão com canal de texto e permissão de escrita.
- Ideal: permissão para criar/renomear canal.

## Commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### A — Nome do canal com emoji (US1)

1. Criar ou renomear canal incluindo um emoji no nome.
2. **Expect**: nome persistido; sidebar/cabeçalho mostram o emoji.

### B — Mensagem com emoji (US2)

1. Inserir emoji (picker ou teclado) no composer → enviar.
2. **Expect**: histórico mostra o mesmo glyph.

### C — Picker pelo ícone (US3)

1. Clicar ícone emoji **dentro** da caixa à direita → escolher emoji.
2. **Expect**: glyph inserido; fechar sem escolher não altera o texto.

### D — Shortcode sem auto-replace (US4)

1. Digitar `:smi` → lista filtrada; Esc → texto permanece.
2. Digitar `:smile:` **sem** Enter/clique → texto permanece (sem auto-replace).
3. Digitar `:smile` → Enter/clique na sugestão → glyph; Enter com lista aberta **não** envia.

### E — Chrome do composer (US5)

1. Ver caixa: `+` à esquerda; emoji + avião à direita; sem botão texto «Enviar».
2. Digitar linha longa → texto **não** sobe aos ícones.
3. Vazio sem anexos → avião inactivo; com texto ou anexo → activo e envia.

### F — Nome: picker sem shortcode

1. No rename/create, digitar `:` → **sem** lista de shortcode.
2. Usar ícone emoji no fluxo de nome (se presente) → insere glyph.

### G — Tema / estreito

1. Tema claro e escuro; janela estreita → ícones clicáveis; contraste OK.

## Pass criteria

- [ ] A–G OK em revisão manual (dev servers).
- [x] `tsc --noEmit` limpo.

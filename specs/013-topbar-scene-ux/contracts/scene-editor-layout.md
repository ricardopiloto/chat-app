# Contrato: Layout do editor de cena (UI)

Âmbito: `frontend/` — `SceneEditor.tsx` + CSS em `mesa-theme.css`. Sem mudanças a `GridLayout`, endpoints de cena, ou draft (`sceneDraft`).

## Referência visual

`docs/design-ref/Mesa - Protótipo v2.dc.html` — ecrã «Editor de cena (admin)»:

- Cabeçalho com título + Descartar / Salvar
- Corpo: `display: grid; grid-template-columns: 1fr 296px` (stage | coluna lateral)

## Requisitos de layout

1. Em modo editar cena, a secção preenche a área útil do painel de voz (`flex: 1; min-height: 0` na cadeia de contentores pai, conforme necessário).
2. Desktop (≥ ~900–1200px): pré-visualização (stage) à esquerda ocupa o espaço flexível; coluna lateral ~296px com layout da cena + banco.
3. Não apresentar o editor como «cartão» pequeno centrado com grandes margens vazias no painel.
4. Toolbar (Descartar/Salvar) permanece acessível no topo; não escondida pelo redimensionamento.
5. Viewport estreito: empilhar stage e side com scroll; conteúdo utilizável (sem exigir modal).

## Comportamento funcional (inalterado)

- Atribuir do banco → slot; devolver slot → banco; layouts nomeados; dirty confirm ao sair — mantêm-se.

# UI Corrections Contract — Shell / Editor / Scale

Complementa [../004-fase-3-design/contracts/ui-shell.md](../004-fase-3-design/contracts/ui-shell.md).

## Modo palco (estreito)

- Com chamada activa e Modo palco ON, `.shell-main` + palco (`.stage` / grelha) MUST ter altura útil ≥ ~40vh ou flex fill — **nunca** área principal vazia com mídia a correr.
- Gaveta fechada; toggle “Mostrar canais” reabre.

## Editor

- Desktop: palco | painel ~296px (layouts + banco).
- Estreito (&lt;900px): empilhado palco → layouts → banco; Salvar/Descartar no header.
- Layouts: três opções do [layout-catalog.md](./layout-catalog.md) com miniaturas.
- Banco: só identities na room sem slot.
- Toque: seleccionar banco → slot; slot ocupado → banco. Drag opcional (pointer fino).

## Voice channel chrome

- MUST NOT: painel co-diretores; composer/histórico de texto do canal.
- MUST: Composição/Grade; N de M; E2EE activa; controlos mic/cam/sair ≥40px min-height.

## Escala

- Body autenticado ~15–16px Inter; pane titles ≥16px weight 600.
- Botões principais / channel items / call controls: min-height ≥40px; padding alinhado ao protótipo v2.

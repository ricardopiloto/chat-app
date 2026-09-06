# Contract: UI da lista, cronómetro e sessão persistente

Referência visual da **posição** da lista: [docs/screenshots/02-canal-voz.jpg](../../../docs/screenshots/02-canal-voz.jpg). Quem aparece **diverge**: só `mic_on \|\| cam_on`.

## Coluna de canais

Para cada canal de voz/vídeo:

- Nome do canal (comportamento actual).
- Se `call_started_at`: cronómetro `mm:ss` ou `h:mm:ss` (≥1 h), actualizado ~1 s, **mesmo se a lista estiver vazia**.
- Debaixo do nome: identificadores (`handle`) dos ocupantes com mídia ligada, indentados (padrão Discord / screenshot).
- Sem mídia ligada e sem ocupantes: sem lista e sem cronómetro.
- Sem mídia ligada mas com ocupantes: **sem lista**, cronómetro **visível**.

A lista **não** substitui o painel Membros.

Modo Palco / faixa estreita: nomes completos ao **mostrar canais**; na faixa colapsada o cronómetro/contagem pode compactar-se; não é obrigatório o roster completo na faixa.

## Barra de sessão (chrome)

Quando o utilizador está na chamada e **não** está no ecrã dessa mesa:

- Indicação persistente: nome do canal + o **mesmo** cronómetro de sessão.
- **Voltar à mesa** (navega para o canal de voz sem leave).
- **Sair** (leave servidor + disconnect LiveKit).

Copy em português.

## Navegação

| Acção | Chamada |
|-------|---------|
| Abrir canal de texto | Permanece |
| Voltar ao mesmo canal de voz | Mostra a mesa; não reinicia sessão |
| Abrir **outro** canal de voz | Move (leave A, join B) |
| Sair / fechar aba / perda LiveKit | Leave |
| Só abrir o ecrã de voz **sem** join (ainda não na mesa) | Não cria ocupação |

## Acessibilidade

- Lista: nomes completos em `title` / `aria-label` se truncados.
- Barra: nome acessível da chamada em curso; Sair com nome acessível «Sair da chamada».
- Cronómetro: texto actualizado (não só um canvas).

# Contrato: Gatilho de membros no cabeçalho do canal

Âmbito: `Channel.tsx` / `VoiceChannel.tsx` → painel de membros (008). Sem API nova.

## Controlo

| Aspecto | Contrato |
|---------|----------|
| Sítio | Cabeçalho do canal (texto e voz), **mesma posição relativa** que o botão «Membros» actual |
| Visual | Ícone só — grupo de pessoas (duas silhuetas). Sem a palavra «Membros» no botão |
| Nome | `aria-label` + `title` = `Membros` |
| Toggle | `aria-expanded={painelAberto}` (já usado) |
| Aberto | Mesmo ícone; botão com chrome seleccionado/pressionado (`background` distinto, p.ex. `--press`). Não só matiz do traço; não segundo SVG |
| Acção | `toggleMembersPanel()` — comportamento 008 inalterado |
| Indisponível | Sem `server_id`: controlo desactivado ou oculto como hoje |

## Fora deste contrato

- Reordenar composição/grade, editar cena, modo palco, chip E2EE.
- Título «Membros» **dentro** do painel.
- Contagem / presença / badges.

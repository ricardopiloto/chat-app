# Contrato: Leave intencional e proxy WS (dev)

Âmbito: sair da sala de voz/vídeo em desenvolvimento (Vite + proxies `/ws`, `/rtc`).

## Identificação

1. Em chamada ao vivo, DevTools → Network → WS: existem (pelo menos) ligações sob o host da SPA que mapeiam a **`/ws`** e **`/rtc`** (ou path LiveKit sob o proxy).
2. Após **Sair**: `/rtc` (media) fecha; `/ws` (app) permanece **OPEN** no caminho feliz (salvo logout / fecho da app).

## Leave limpo (obrigatório)

1. Clique em **Sair** (ou navegação equivalente tratada como leave) → UI deixa de estar em chamada (sem estado “preso”).
2. Dispositivos deixam de estar publicados na sala (observável por outro participante ou rejoin).
3. Terminal do `npm run dev` (**Vite**): **0** linhas `[vite] ws proxy error:` com `This socket has been ended by the other party` atribuíveis a esse leave.
4. Rejoin na mesma sala à primeira tentativa, sem refresh forçado da página.

## Não intencional (não silenciar)

Parar LiveKit (ou backend media) a meio da chamada → continua a haver indicação útil (UI e/ou log). Não se exige o silêncio do leave intencional.

## Out of scope

- Novo UI de erro para o utilizador final além do leave/rejoin correctos.
- Silenciar **todos** os erros de proxy WS para sempre.
- Produção sem Vite: o sintoma do terminal pode não existir; leave ordenado no cliente continua desejável.

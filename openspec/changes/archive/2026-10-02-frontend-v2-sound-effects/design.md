# Design

## Context

Os dois eventos já chegam ao cliente por WebSocket e já são tratados em `shell/state.tsx`:

- `notification.created` alimenta o sino (`chat/notices.ts`, `addNotice`). O payload traz `kind` (`mention` ou `reply`), `channel_id`, `message_id` e `actor_account_id`.
- `voice.occupancy` traz, por canal, a lista completa de ocupantes (`ChannelOccupancy.occupants`). O estado do shell guarda-a em `voiceRoster`, preenchida primeiro por um pedido REST ao abrir e depois pelos eventos.

Do lado da chamada, `callSession.tsx` expõe `channelId()`, `live()` e `deafened()`. A saída de áudio escolhida é `prefs.outId()` (`voice/devices.ts`); a chamada já a aplica com `setSinkId` e o teste de som de saída também. As preferências locais seguem o padrão `readJson`/`writeJson` de `lib/localPrefs.ts`. O `vite.config.ts` serve `frontend-v2/public/`, que hoje só tem ícones.

Não há nenhum som na aplicação além do tom de teste de saída. Os MP3 finais ainda não existem e serão postos à mão em `assets/audio/` (`mention.mp3` e `call-join.mp3`). Ver `proposal.md` para a motivação.

## Goals / Non-Goals

**Goals:**
- Tocar os dois efeitos nos casos do spec e em mais nenhum.
- Falhar sempre em silêncio: sem ficheiro, sem permissão de autoplay ou sem armazenamento, o resto da aplicação não pode notar.
- Ser verificável em browsers de teste sem som real.

**Non-Goals:**
- Volume ajustável, sons por canal ou servidor, outros eventos, notificações do sistema.
- Mudanças de backend.
- Tocar o som em várias abas de forma coordenada (cada aba toca o seu).

## Decisions

### D1 — Quem ouve a chegada: só quem está na chamada
O efeito de chegada toca apenas para o utilizador ligado à chamada onde alguém entrou. **Alternativas:** todos os membros do servidor (ruidoso: qualquer entrada numa chamada qualquer tocaria, e o roster da sidebar já informa quem olha); só quem vê o canal de voz (a maioria dos ouvintes úteis já está na chamada). Escolhida a primeira opção por ser o comportamento esperado de "alguém sentou-se à mesa" e a que menos incomoda. Se mais tarde se quiser avisar quem está fora, é um novo evento sonoro (chamada que começa), fora deste escopo.

### D2 — Detetar chegadas por diferença de ocupantes, nunca pelo pedido REST
Um módulo `sound/` guarda, por canal, o conjunto de contas conhecidas. Ao chegar um `voice.occupancy`, compara com o conjunto anterior: uma conta nova que não seja o próprio utilizador, num canal cuja chamada o utilizador tem `live()`, é uma chegada.
- **Sem conjunto anterior, não há som.** O primeiro evento de um canal, a carga inicial e uma reconexão só (re)semeiam o conjunto. Assim abrir a aplicação, entrar numa chamada cheia ou reconectar nunca toca.
- A semente vem de `voiceRoster`, que já é preenchida pelo pedido REST, e depois acompanha cada evento.
- **Alternativa:** reagir a "ocupante a mais" por contagem. Rejeitada: uma saída e uma entrada no mesmo evento esconderiam a chegada.

### D3 — Menção: suprimir só quando já está à vista
A notificação em tempo real chama `addNotice` e, em paralelo, o gatilho de som. Suprime-se quando o canal da notificação é o canal aberto **e** a janela está visível e com foco (`document.visibilityState === "visible"` e `document.hasFocus()`), porque a mensagem já está diante do utilizador e `markSeen` limpa a notificação. Em qualquer outro caso (aba em segundo plano, outro canal, outra janela) toca. **Alternativa:** tocar sempre. Rejeitada por ser redundante e irritante em conversas ativas.

### D4 — Reprodutor: um `HTMLAudioElement` por efeito
Cada efeito é um `Audio("/audio/<ficheiro>.mp3")` criado uma vez, com `preload="auto"`. Para tocar: `currentTime = 0`, aplicar a saída com `setSinkId(prefs.outId())` quando existir (erros ignorados, volta à omissão) e `play()` com o `catch` a engolir a recusa. Um `error` de carregamento desativa esse efeito até à próxima sessão, sem alarme. O volume fica a 1: os ficheiros são normalizados na produção (ver `docs/prompts/efeitos-sonoros-suno.md`).
**Alternativa:** Web Audio (`decodeAudioData` + ganho). Dá controlo de volume e sobreposição, mas pede mais código e um contexto que o autoplay também bloqueia; sem volume ajustável no escopo, não compensa. Fica fácil de trocar porque o reprodutor é um único ponto.

### D5 — Limite de frequência: primeiro toque passa, os seguintes esperam
Por efeito, o primeiro evento toca de imediato e os seguintes são ignorados durante uma janela de repouso: **3 s** para a menção e **2 s** para a chegada. É simples, não atrasa o primeiro aviso e junta rajadas. Os dois efeitos têm janelas independentes. **Alternativa:** *debounce* (tocar no fim da rajada). Rejeitada porque atrasa o aviso.

### D6 — Ensurdecer e preferência
`deafened()` verdadeiro suprime ambos os efeitos (o utilizador pediu silêncio). A preferência vive em `mesa.soundPrefs.v1` (`{ enabled }`), como sinal reativo para o efeito ser imediato, com leitura e escrita protegidas como o resto das preferências. A pré-escuta das definições ignora a preferência e a janela de repouso.

### D7 — Entrega dos ficheiros: copiar no arranque do Vite
A fonte é `assets/audio/` (onde o utilizador os põe). Um pequeno `scripts/sync-audio.mjs`, chamado pelo `vite.config.ts` ao arrancar (dev e build), copia os `.mp3` para `frontend-v2/public/audio/`, pasta ignorada pelo git. Sem ficheiros na origem, não copia nada e a aplicação segue.
**Alternativas:** guardar cópias em `public/audio/` (binários duplicados no git); *symlink* (frágil entre sistemas); mudar o `publicDir` (arrasta os ícones). O `vite.config.ts` já é partilhado, e a cópia no arranque cobre `npx vite` e `vite build`, não só `npm run`.

### D8 — Onde fica o código
`src/sound/effects.ts` (reprodutor, repouso, preferência), `src/sound/arrivals.ts` (função pura que, dados o conjunto anterior, o novo e o utilizador, devolve as chegadas) e um componente `SoundEffects` montado no `AppShell`, que subscreve os eventos do shell e lê `useCall()`. A seção de definições entra em `voice/AudioVideoSettings.tsx` e os textos nos catálogos `voice.*`. Funções puras e repouso são testáveis em Node, no padrão dos `scripts/verify-*.mjs`.

## Risks / Trade-offs

- **[Eco na chamada]** O som de chegada sai nos altifalantes e o microfone de quem não usa auscultadores pode captá-lo para a chamada. É curto (≤ 1 s) e a captura já usa cancelamento de eco; aceite. Quem quiser desliga o efeito.
- **[Autoplay]** Antes de qualquer interação o navegador pode recusar. A aplicação exige login, logo há interação antes do primeiro aviso real; mesmo assim a recusa é engolida (spec).
- **[Várias abas]** Cada aba toca o seu som e duas abas abertas tocam duas vezes. Aceite; coordenar abas fica fora do escopo.
- **[Ficheiros em falta]** Até os MP3 chegarem, a funcionalidade está inerte, o que é correto mas invisível. A verificação inclui o caso "sem ficheiro" e o caso "com ficheiro".
- **[Janelas de repouso fixas]** 3 s e 2 s são palpites razoáveis; se pesarem, são duas constantes.

## Open Questions

Resolvidas com o responsável do projeto em 2026-10-02:

- **D1** confirmada: o som de chegada toca só para quem está na chamada.
- **D3** confirmada: a menção não toca quando o canal está à vista e a janela em foco.

Ainda em aberto, sem efeito no escopo:

- Os nomes `mention.mp3` e `call-join.mp3` foram assumidos; se os ficheiros chegarem com outros nomes, só `sound/effects.ts` e a cópia de D7 mudam.

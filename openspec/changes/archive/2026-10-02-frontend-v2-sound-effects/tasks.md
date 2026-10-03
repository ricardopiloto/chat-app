# Tasks

## 1. Ficheiros e entrega

- [x] 1.1 Criar `frontend-v2/scripts/sync-audio.mjs`, que copia os `.mp3` de `assets/audio/` para `frontend-v2/public/audio/` (D7), chamá-lo no arranque do `vite.config.ts` (dev e build) e ignorar `frontend-v2/public/audio/` no git; verificar com `mention.mp3` e `call-join.mp3` de teste na origem que ficam servidos em `/audio/…` e que, sem ficheiros na origem, o Vite arranca sem erro
- [x] 1.2 Confirmar que `vite build` inclui `public/audio/` no `dist/` e que a ausência dos ficheiros não quebra o build

## 2. Reprodutor e preferência

- [x] 2.1 Implementar `src/sound/effects.ts` (D4 e D5): um `Audio` por efeito com pré-carregamento, saída por `setSinkId(prefs.outId())` quando existir, `play()` com recusa engolida, desativação silenciosa do efeito em erro de carregamento e janela de repouso por efeito (menção 3 s, chegada 2 s); verificar em Node a janela de repouso (primeiro toque passa, seguintes ignorados, efeitos independentes, passa de novo depois da janela)
- [x] 2.2 Implementar a preferência `mesa.soundPrefs.v1` como sinal reativo, ligada por omissão, com leitura e escrita protegidas (D6); verificar valor por omissão, persistência após recarregar e armazenamento bloqueado sem falhar
- [x] 2.3 Implementar a pré-escuta (`preview`), que toca o efeito na saída escolhida ignorando a preferência e a janela de repouso, sem consumir a janela dos avisos reais

## 3. Chegada a uma chamada

- [x] 3.1 Implementar `src/sound/arrivals.ts` (D2): função pura que, dados os ocupantes anteriores, os novos e o utilizador, devolve as chegadas, sem conjunto anterior devolve nenhuma; verificar em Node: chegada simples, o próprio utilizador, várias chegadas, saída e entrada no mesmo evento, primeiro evento do canal e reconexão com as mesmas pessoas
- [x] 3.2 Montar o componente `SoundEffects` no `AppShell`, semeando o conjunto por canal a partir de `voiceRoster` e acompanhando `voice.occupancy`; tocar o efeito de chegada só se o utilizador tem a chamada desse canal em `live()` e não está ensurdecido; verificar com duas sessões de navegador que entrar na chamada de outra sessão faz tocar na que já estava, e que a sessão que entra não toca por causa de quem já lá estava
- [x] 3.3 Verificar que quem não está na chamada (a ver a sidebar ou outro canal) não toca, e que cair e reconectar a ligação em tempo real não toca

## 4. Nova menção

- [x] 4.1 Ligar o gatilho ao tratamento de `notification.created` (menção e resposta), com a supressão de D3 (canal aberto e janela visível com foco) e a supressão por ensurdecido; verificar com duas sessões: menção com a outra aba em segundo plano toca, com o canal aberto em foco não toca, resposta toca
- [x] 4.2 Verificar que a carga inicial das notificações, o recarregamento e a reconexão não tocam, e que uma rajada de menções toca uma só vez

## 5. Definições e textos

- [x] 5.1 Acrescentar a secção "Efeitos sonoros" a `voice/AudioVideoSettings.tsx`: interruptor ligado à preferência e um botão de pré-escuta por efeito; verificar efeito imediato do interruptor, o estado guardado ao reabrir e que a pré-escuta toca com os efeitos desligados
- [x] 5.2 Acrescentar os textos aos catálogos `voice.pt-BR.ts` e `voice.en.ts` e passar `verify-i18n`
- [x] 5.3 Verificar a secção contra o resto da página em modo claro e escuro, sem quebrar a verificação de fidelidade de `audio-video-settings` (nenhum item excluído aparece)

## 6. Falhas silenciosas e verificação

- [x] 6.1 Verificar as falhas: sem ficheiro (um 404 num efeito não mostra nada nem afeta o outro), autoplay recusado (`play()` rejeitado não gera erro visível nem no console da aplicação) e saída guardada inexistente (toca na omissão)
- [x] 6.2 Verificar os sons com os navegadores de teste mudos (`--mute-audio`), contando as chamadas a `HTMLMediaElement.prototype.play` por efeito e a saída aplicada (`setSinkId`), sem depender de áudio real
- [x] 6.3 Verificar com os MP3 reais, depois de colocados em `assets/audio/`, que os dois efeitos se distinguem e não ultrapassam a duração alvo (informação na tabela de `docs/prompts/efeitos-sonoros-suno.md`); registar a revisão como concluída ou pendente dos ficheiros

## 7. Fecho

- [x] 7.1 Confirmar que nenhuma alteração foi feita a `frontend/` nem ao backend (`git status frontend/ backend/` sem alterações desta tarefa)
- [x] 7.2 Executar `npm run check:v1-overlap`, `tsc --noEmit` e `eslint src`, e confirmar os limiares dos ficheiros novos
- [x] 7.3 Registar a funcionalidade em `docs/v2/parity-checklist.md` como acréscimo à v1 (sem equivalente na aplicação anterior), com os itens verificados acima

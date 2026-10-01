# Verificação da implementação

Backend local com banco descartável, LiveKit v1.13.5 em Docker (`infra/livekit.yaml`), dev server v2 e Chrome. Duas sessões simultâneas: `localhost:1421` (dono, `vtest1`) e `127.0.0.1:1421` (convidado, `vtest2`, origens distintas = cookies separados). Entrada na chamada com E2EE ligada contra o LiveKit real; vídeo remoto decifrado e exibido nas duas pontas.

## Verificado no navegador

- 1.1 `tsc --noEmit`, `eslint src` e `npm run build` passam com `voice/`, `video/` e `blur/` portados.
- 1.2 Dois utilizadores entram no mesmo canal de voz; o roster da sidebar mostra os dois (e o convidado vê o dono antes de entrar); sair pelo PiP remove o ocupante.
- 1.3 A chave de canal gerada na criação do servidor religa a E2EE; chave inválida mostra erro no diálogo, chave correta religa.
- 2.1 "Entrar", "Testar vídeo" (faixa sintética, câmara física intocada) e a ausência de edição de cena para quem não administra. O caminho "Entrar (ouvir)" está implementado mas não foi exercido (ver limitações).
- 2.2 Alternar câmara/microfone na pré-entrada define a preferência usada ao entrar (ver Decisões).
- 3.1 Controlos só aparecem durante a chamada; partilha de ecrã só na vista Grade.
- 3.2 O menu de blur abre com três opções e grava a preferência.
- 4.1 Chip de E2EE "ligada/desligada" actualizado ao vivo por `channel.e2ee_changed` nas duas sessões.
- 4.2 Faixa "E2EE desligada" (quem/quando) permanece durante toda a chamada nas duas sessões; só o dono com chave vê "Religar".
- 4.3 Religar com chave correta e incorreta (acima).
- 4.4 Revisão visual da faixa (token `error-container`, nunca o verde de E2EE ligada) e do diálogo, em modo claro: legível, sem colisão com o chip.
- 4.5 Nenhum botão/faixa de gravação ou egress (busca no código só encontra o tipo TS `Record`).
- 5.1 Mestre em Destaque, Painel e Faixa com 6 posições; ocupante sem posição aparece em "No banco".
- 5.2 Tocar para atribuir, devolver ao banco, selector de posições e de layout. A confirmação "escolher quais remover" (6→3 com posições ocupadas) foi verificada sobre o módulo `sceneDraft` real (`needsChoice`, `delta=3`, remoção aplicada); no navegador só havia dois ocupantes, insuficiente para forçar o passo.
- 5.3 Diálogo Cancelar/Descartar/Guardar: os três caminhos.
- 5.4 Revisão visual de Painel e Faixa no editor de cena. Corrigido: rótulos ilegíveis nas posições em modo claro.
- 5.5 A disposição guardada persiste ao alternar Composição → Grade → Composição.
- 6.1 Grade com câmaras seguidas de partilhas, as duas pontas actualizam sem acção do administrador.
- 6.2 Partilha de ecrã iniciada pelo painel só em Grade; ausente em Composição.
- 6.3 Destaque promove a partilha a palco principal com as restantes numa faixa; despromover volta à grelha; as transmissões continuam (vídeo presente nos dois estados).
- 7.1 PiP aparece ao sair do canal (nome, duração, câmaras) e desaparece ao voltar.
- 7.2 Arrastar encaixa no canto (bottom-left); uma nova chamada na mesma sessão reabre nesse canto.
- 7.3 "Voltar ao palco" e terminar chamada direto no PiP, sem navegação prévia.
- 8.1 Ciclo com duas sessões: entrar, atribuir posições no editor (reflectido no convidado por `grid.updated`), Grade + partilhas dos dois, destaque, desligar E2EE, faixa nas duas, religar com a chave, sair para texto e PiP, voltar e PiP some.
- 8.2 `git status frontend/` sem alterações.

## Limitações da verificação

- Câmara e microfone reais não foram usados: `getUserMedia` e `getDisplayMedia` foram substituídos por faixas sintéticas (canvas/oscilador) na página de teste, porque o prompt de permissão do navegador não é automatizável. O transporte LiveKit, a E2EE e a renderização são reais.
- Indicadores de fala (3.3): o áudio sintético é quase silencioso, então o evento `ActiveSpeakersChanged` não disparou; a ligação (sessão → Composição, Grade e roster) é a da v1 e não foi exercida ao vivo.
- Blur (3.2): como a câmara era sintética, o efeito não foi aplicado a uma câmara real; o caminho de erro "ambiente sem suporte" não foi exercido.
- Utilizador só com permissão de ouvir (2.1 "Entrar (ouvir)" e microfone desactivado com explicação): não havia terceira conta com permissão `listen`.
- "Desligar E2EE" não tem UI na v2 (a spec só pede faixa e religar): foi desligada por `POST /api/channels/{id}/voice/e2ee`.

## Decisões

- Divergências da v1 corrigidas por não cumprirem a spec: (a) a câmara local de quem está no banco já não ocupa a posição 1 por omissão; (b) o encaixe do PiP não funcionava (captura de ponteiro no elemento errado); (c) a posição do PiP já não é reposta ao terminar a chamada.
- Não existia preferência de câmara/microfone guardada no painel na Fase 1: a escolha vive na sessão de voz (como na v1) e é definida pelos botões da pré-entrada.
- Partilha de ecrã só aparece em Grade (spec): se o utilizador alterna para Composição durante uma partilha, esta continua sem botão para parar até voltar à Grade ou terminar a chamada.
- Mockup da pré-entrada reproduz apenas estrutura (sem a telemetria fictícia do mockup: dBFS, AV1, latência) e sem pré-visualização da câmara real, para não pedir permissão antes de o utilizador escolher entrar.
- `livekit-client` é importado estaticamente por `VoiceSession` (tal como na v1); o bundle principal passa dos 500 kB.

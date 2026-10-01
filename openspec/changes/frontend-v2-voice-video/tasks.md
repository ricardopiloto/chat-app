# Tasks

## 1. Integração LiveKit e sessão de voz

- [ ] 1.1 Portar `frontend/src/voice/{VoiceSession,abortFailedJoin,releaseLocalCapture,joinErrors,pipCorner,loadRuntime,runtime}.tsx` e `video/{liveClient,backgroundBlur}.ts` para `frontend-v2/src/{voice,video}/`; verificar com `tsc --noEmit` que compila
- [ ] 1.2 Implementar entrar/sair de chamada (`POST /api/channels/{id}/voice/join|leave`, upsert de ocupação, heartbeat de media via `PATCH .../voice/media`); verificar com 2 sessões de browser distintas entrando no mesmo canal de voz
- [ ] 1.3 Portar `frontend/src/crypto/channelKey.ts` para `frontend-v2/src/crypto/channelKey.ts`; verificar round-trip de custódia (chave gerada na Fase 2 ao criar um canal de voz é utilizável aqui para religar E2EE)

## 2. Pré-entrada

- [ ] 2.1 Implementar o ecrã de pré-entrada seguindo `mesa_pr_entrada_na_chamada_green_room_testar_v_deo` (Entrar, Testar vídeo, Entrar (ouvir)); verificar os 3 caminhos com 3 utilizadores de teste com permissões diferentes (falar, só ouvir, e o botão de teste)
- [ ] 2.2 Verificar que a escolha de câmara ligada/desligada ao entrar respeita a preferência já guardada no painel do utilizador (Fase 1), sem perguntar de novo a cada entrada

## 3. Controlos de chamada, blur e indicadores de fala

- [ ] 3.1 Implementar os controlos de chamada no painel do utilizador (mic, surdo/ouvir, câmara, terminar — partilha de ecrã só quando em vista Grade, Tarefa 5.x); verificar que só aparecem durante uma chamada activa
- [ ] 3.2 Implementar o menu de blur de câmara (sem/leve/forte) com erro inline para ambiente sem suporte; verificar os 3 estados numa chamada activa
- [ ] 3.3 Implementar indicadores de fala sincronizados em Composição, Grade e roster de voz da sidebar a partir da detecção de nível de áudio do LiveKit; verificar que falar e parar de falar actualiza o indicador em todos os lugares simultaneamente

## 4. E2EE de canal de voz

- [ ] 4.1 Implementar o chip de estado E2EE no cabeçalho do canal de voz (ligada/desligada) consumindo `channel.e2ee_changed`; verificar os dois estados
- [ ] 4.2 Implementar a faixa permanente "E2EE desligada" (quem/quando) seguindo D4 do design.md (sem mockup de referência — token de aviso, não o verde de E2EE activa); verificar que permanece visível durante toda a chamada, não só como alerta pontual
- [ ] 4.3 Implementar o diálogo "Religar E2EE" exigindo a chave do canal quando não presente no dispositivo; verificar religar com a chave correcta e com uma chave incorrecta
- [ ] 4.4 Revisão visual manual da faixa de E2EE desligada e do diálogo de religar (D4 — sem mockup, maior risco de inconsistência visual); documentar a revisão como concluída
- [ ] 4.5 Confirmar explicitamente que nenhum botão ou faixa de "Gravar"/Egress foi implementado (checklist negativo)

## 5. Vista Composição e editor de cena

- [ ] 5.1 Implementar a vista Composição com os três layouts nomeados (Mestre em Destaque directamente dos mockups; Painel e Faixa por extrapolação, D3 do design.md) de 2 a 8 posições, com a faixa "No banco"; verificar os 3 layouts com pelo menos 4 ocupantes de teste
- [ ] 5.2 Implementar o editor de cena (arrastar/tocar-para-atribuir, devolver ao banco, selector de nº de posições com confirmação ao reduzir, selector de layout com pré-visualização); verificar reduzir de 6 para 3 posições com posições ocupadas, confirmando o passo de "escolher quais remover"
- [ ] 5.3 Implementar o diálogo de confirmação de alterações por guardar (Cancelar/Descartar/Guardar) ao fechar o editor com alterações pendentes; verificar os 3 caminhos
- [ ] 5.4 Revisão visual manual dos layouts Painel e Faixa (D3 — sem mockup próprio); documentar a revisão como concluída
- [ ] 5.5 Verificar que a vista Composição preserva a disposição ao alternar para Grade e voltar

## 6. Vista Grade e partilha de ecrã

- [ ] 6.1 Implementar a vista Grade unificada (câmaras seguidas de partilhas de ecrã, cores de assento estáveis, destaque de fala); verificar com pelo menos 3 câmaras de teste
- [ ] 6.2 Implementar iniciar/terminar partilha de ecrã a partir do painel do utilizador, disponível só em vista Grade durante uma chamada; verificar que o controlo está ausente em vista Composição
- [ ] 6.3 Implementar o alternador de destaque (spotlight) que promove uma partilha a palco principal com as restantes numa faixa lateral; verificar promover e despromover sem interromper a transmissão

## 7. PiP flutuante

- [ ] 7.1 Implementar o mini-player flutuante (nome do canal, duração, até 4 posições de câmara ou "Em chamada", D6 do design.md — não as 3 posições sem duração do mockup) visível ao navegar para fora do canal de voz activo; verificar que aparece e desaparece correctamente ao sair/voltar ao canal
- [ ] 7.2 Implementar arrastar com encaixe nos 4 cantos e memória de posição na sessão; verificar reposicionar e reabrir uma chamada nova na mesma sessão
- [ ] 7.3 Implementar as acções "Voltar ao palco" e terminar chamada directamente no PiP; verificar ambas sem precisar de expandir primeiro

## 8. Verificação de fase completa

- [ ] 8.1 Percorrer o ciclo completo com 2 sessões de browser: entrar num canal de voz, atribuir posições no editor de cena, alternar para Grade e partilhar ecrã, destacar a partilha, desligar E2EE, confirmar a faixa permanente, religar com a chave, navegar para fora do canal e confirmar o PiP, voltar e confirmar que o PiP desaparece
- [ ] 8.2 Confirmar que nenhuma alteração foi feita a `frontend/` durante esta fase (`git status frontend/` sem alterações)

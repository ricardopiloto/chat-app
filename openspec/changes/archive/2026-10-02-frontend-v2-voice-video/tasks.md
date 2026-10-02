# Tasks

## 1. Integração LiveKit e sessão de voz

- [x] 1.1 Implementar de raiz a sessão de chamada e a camada de mídia em `frontend-v2/src/{voice,video}/` (D1: estado reactivo da sessão, tiles declarativos, saída garantida, hardware libertado, entrada só áudio); verificar com `tsc --noEmit` que compila e que `check-v1-overlap` não reporta sobreposição acima dos limiares
- [x] 1.2 Implementar entrar/sair de chamada (`POST /api/channels/{id}/voice/join|leave`, upsert de ocupação, heartbeat de media via `PATCH .../voice/media`); verificar com 2 sessões de browser distintas entrando no mesmo canal de voz
- [x] 1.3 Implementar `frontend-v2/src/crypto/channelKey` a partir de `docs/v2/contracts/crypto-formats.md`; verificar os vectores de chave de canal e o round-trip de custódia (chave gerada na Fase 2 ao criar um canal de voz é utilizável aqui para religar E2EE)

## 2. Pré-entrada

- [x] 2.1 Implementar o ecrã de pré-entrada seguindo `mesa_pr_entrada_na_chamada_green_room_testar_v_deo` (pré-visualização com blur e medidor, calibração de dispositivos, "No canal agora", Entrar, Testar vídeo, Entrar (ouvir)); verificar os 3 caminhos com 3 utilizadores de teste com permissões diferentes (falar, só ouvir, e o botão de teste)
- [x] 2.2 Verificar que a escolha de câmara ligada/desligada e os dispositivos escolhidos respeitam as definições guardadas (secção 10), sem perguntar de novo a cada entrada

## 3. Controlos de chamada, blur e indicadores de fala

- [x] 3.1 Implementar os controlos de chamada no painel do utilizador (mic, surdo/ouvir, câmara, terminar — partilha de ecrã só quando em vista Grade, Tarefa 5.x); verificar que só aparecem durante uma chamada activa
- [x] 3.2 Implementar o menu de blur de câmara (sem/leve/forte) com erro inline para ambiente sem suporte; verificar os 3 estados numa chamada activa
- [x] 3.3 Implementar indicadores de fala sincronizados em Composição, Grade e roster de voz da sidebar a partir da detecção de nível de áudio do LiveKit; verificar que falar e parar de falar actualiza o indicador em todos os lugares simultaneamente

## 4. E2EE de canal de voz

- [x] 4.1 Implementar o chip de estado E2EE no cabeçalho do canal de voz (ligada/desligada) consumindo `channel.e2ee_changed`; verificar os dois estados
- [x] 4.2 Implementar a faixa permanente "E2EE desligada" (quem/quando) seguindo D4 do design.md (sem mockup de referência — token de aviso, não o verde de E2EE activa); verificar que permanece visível durante toda a chamada, não só como alerta pontual
- [x] 4.3 Implementar o diálogo "Religar E2EE" exigindo a chave do canal quando não presente no dispositivo; verificar religar com a chave correcta e com uma chave incorrecta
- [x] 4.4 Revisão visual manual da faixa de E2EE desligada e do diálogo de religar (D4 — sem mockup, maior risco de inconsistência visual); documentar a revisão como concluída
- [x] 4.5 Confirmar explicitamente que nenhum botão ou faixa de "Gravar"/Egress foi implementado (checklist negativo)

## 5. Vista Composição e editor de cena

- [x] 5.1 Implementar a vista Composição com os três layouts nomeados (Mestre em Destaque directamente dos mockups; Painel e Faixa por extrapolação, D3 do design.md) de 2 a 8 posições, com a faixa "No banco"; verificar os 3 layouts com pelo menos 4 ocupantes de teste
- [x] 5.2 Implementar o editor de cena (arrastar/tocar-para-atribuir, devolver ao banco, selector de nº de posições com confirmação ao reduzir, selector de layout com pré-visualização); verificar reduzir de 6 para 3 posições com posições ocupadas, confirmando o passo de "escolher quais remover"
- [x] 5.3 Implementar o diálogo de confirmação de alterações por guardar (Cancelar/Descartar/Guardar) ao fechar o editor com alterações pendentes; verificar os 3 caminhos
- [x] 5.4 Revisão visual manual dos layouts Painel e Faixa (D3 — sem mockup próprio); documentar a revisão como concluída
- [x] 5.5 Verificar que a vista Composição preserva a disposição ao alternar para Grade e voltar

## 6. Vista Grade e partilha de ecrã

- [x] 6.1 Implementar a vista Grade unificada (câmaras seguidas de partilhas de ecrã, cores de assento estáveis, destaque de fala); verificar com pelo menos 3 câmaras de teste
- [x] 6.2 Implementar iniciar/terminar partilha de ecrã a partir do painel do utilizador, disponível só em vista Grade durante uma chamada; verificar que o controlo está ausente em vista Composição
- [x] 6.3 Implementar o alternador de destaque (spotlight) que promove uma partilha a palco principal com as restantes numa faixa lateral; verificar promover e despromover sem interromper a transmissão

## 7. PiP flutuante

- [x] 7.1 Implementar o mini-player flutuante (nome do canal, duração, até 4 posições de câmara ou "Em chamada", controlos de microfone/ensurdecer/câmara, D6 do design.md — não as 3 posições sem duração do mockup) visível ao navegar para fora do canal de voz activo; verificar que aparece e desaparece correctamente ao sair/voltar ao canal
- [x] 7.2 Implementar arrastar com encaixe nos 4 cantos e memória de posição na sessão; verificar reposicionar e reabrir uma chamada nova na mesma sessão
- [x] 7.3 Implementar as acções "Voltar ao palco" e terminar chamada directamente no PiP; verificar ambas sem precisar de expandir primeiro

## 8. Verificação de fase completa

- [x] 8.1 Percorrer o ciclo completo com 2 sessões de browser: entrar num canal de voz, atribuir posições no editor de cena, alternar para Grade e partilhar ecrã, destacar a partilha, desligar E2EE, confirmar a faixa permanente, religar com a chave, navegar para fora do canal e confirmar o PiP, voltar e confirmar que o PiP desaparece
- [x] 8.2 Confirmar que nenhuma alteração foi feita a `frontend/` durante esta fase (`git status frontend/` sem alterações)

## 9. Fidelidade visual (critério de aceite por tela)

- [x] 9.1 Green room contra `mesa_pr_entrada_na_chamada_green_room_testar_v_deo` (checklist D7) e registar a classificação em `verification.md`; só **Fiel** fecha a tarefa
- [x] 9.2 Palco de composição contra `mesa_palco_de_voz_v_deo_composi_o_de_c_meras`
- [x] 9.3 Editor de cenas contra `mesa_editor_de_cenas_de_composi_o_1` e `_2`
- [x] 9.4 Grade contra `mesa_visualiza_o_por_grade_1` e `_2`; Grade com partilha contra `mesa_grade_com_compartilhamento_de_tela_1` e `_2` (coluna lateral direita)
- [x] 9.5 PiP contra `mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player`
- [x] 9.6 Confirmar a ausência dos itens excluídos em D7 (telemetria, ruído/eco/AGC, VTT, inspector de slot, espelhar câmara)

## 10. Áudio & Vídeo

- [x] 10.1 Implementar a página de Áudio & Vídeo (D9): lista de microfones, câmaras e saídas, medidor de nível em tempo real, som de teste, pré-visualização da câmara e persistência das escolhas; verificar com dispositivos virtuais e com permissão negada
- [x] 10.2 Partilhar a preferência de blur entre a página, o green room e o menu da chamada; verificar nos três sítios
- [x] 10.3 Aplicar as escolhas ao entrar numa chamada e verificar com dois dispositivos diferentes
- [x] 10.4 Verificar a página contra o subconjunto em escopo de `mesa_configura_es_udio_v_deo` e confirmar a ausência dos itens excluídos

## 11. Paridade funcional e independência

- [x] 11.1 Verificar cada item desta área de `docs/v2/parity-checklist.md` (D8 do design.md) contra o comportamento da v1 em execução, com duas sessões de navegador e LiveKit real, e registar o resultado
- [x] 11.2 Executar `check-v1-overlap` sobre os ficheiros desta fase e confirmar os limiares ou justificar excepções
- [x] 11.3 Registar quaisquer alterações de backend necessárias como tarefas próprias (regra 4 da revisão); se nenhuma for necessária, registar "nenhuma"
- [x] 11.4 Backend (alteração aditiva registada em `docs/v2/contracts/backend-change-policy.md`): `GET /api/channels/{id}/voice/channel-key` devolve a chave de canal selada ao custodiante, para o diálogo "Religar E2EE" rejeitar uma chave bem formada mas errada (VOZ-15); verificar com `cargo test` (teste de contrato novo)

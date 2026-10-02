# Verificação da implementação

Reescrita de raiz (clean-room) da camada de voz e vídeo. Backend local com banco descartável, LiveKit local, dev server v2 e Chromium com dispositivos de mídia falsos e áudio mudo, conduzido por CDP (Chrome DevTools Protocol). Quatro sessões em paralelo, cada uma com um perfil próprio: `mestre` (dono), `jogadora` (papel com falar), `ouvinte` (papel sem permissão de falar) e `bardo`. Entrada em chamada com E2EE ligada contra o LiveKit real; vídeo remoto decifrado e exibido nas pontas.

## Verificado no navegador

- 1.1 `tsc --noEmit` e `eslint src` passam (0 erros, 1 aviso em `callSession.tsx`); `check-v1-overlap` sem arquivo de voz acima do limiar (ver 11.2).
- 1.2 Dois a quatro utilizadores no mesmo canal; ocupação por `voice-occupancy` correta; vídeo remoto a tocar nas duas pontas.
- 1.3 `test:contracts` 24/24 contra `impl-v2.mjs` (os vetores de seal/unseal cobrem a chave de canal); a chave gerada na criação do servidor religa a E2EE numa chamada real, colada e a partir do dispositivo.
- 2.1 Três caminhos: "Entrar na chamada" (mestre, jogadora), "Entrar (apenas ouvir)" (única opção para o papel sem falar; microfone e câmera desativados com explicação) e "Testar vídeo (sintético)" (o vídeo sintético chega aos outros; `getUserMedia` só pede áudio).
- 2.2 Câmera desligada na pré-entrada fica guardada: entra com `cam0`, e reabrir a pré-entrada respeita a escolha sem perguntar de novo.
- 3.1 Controles (microfone, ensurdecer, câmera, fundo, partilha, terminar) só durante a chamada; partilha só na vista Grade.
- 3.2 Menu de blur com os três níveis (Nítido, Suave, Desfocado), valor guardado (`off`, `light`, `strong`); com `OffscreenCanvas` removido mostra o erro inline "Este navegador não suporta desfoque de fundo…".
- 3.3 Indicador de fala sincronizado: Composição 61/61 amostras (tile e sidebar), Grade 89/89, banco 53/53.
- 4.1 a 4.2 Chip "E2EE ATIVA/DESLIGADA" atualizado ao vivo nas duas sessões; faixa permanente com quem/quando, mantida ao trocar de vista e com o tempo; só o dono vê "Religar E2EE".
- 4.3 Religar com a chave certa (colada e a partir do dispositivo) e com chave malformada (erro de formato). Com o endpoint de 11.4 (backend reiniciado com o binário novo): chave malformada mostra o erro de formato; chave bem formada mas errada mostra "Esta não é a chave deste canal…", mantém a faixa e não grava nada no dispositivo; chave correta religa e fica guardada. Com uma chave errada já no dispositivo, confirmar mostra o erro, esquece essa chave e passa a mostrar o campo para colar a certa; com a chave certa no dispositivo basta confirmar. Corrigido durante a verificação: o diálogo guardava um instantâneo da chave do dispositivo; agora relê ao abrir.
- 4.4 Revisão visual da faixa e do diálogo em modo claro e escuro: faixa e chip em `error-container`/`danger`, nunca o verde de E2EE ativa; diálogo legível. Corrigido: os botões encostavam no campo (`.call-dialog-actions`, 16 px).
- 4.5 Nenhum botão ou faixa de gravar/egress (busca no código e no texto do palco).
- 5.1 Mestre em Destaque, Painel e Faixa com 4 ocupantes e a faixa "No banco".
- 5.2 Tocar para atribuir, devolver ao banco, arrastar do banco, nº de posições (2 a 8) e layout; reduzir com posições ocupadas abre "Escolher quais posições remover".
- 5.3 Diálogo Cancelar / Descartar / Salvar e aplicar: os três caminhos.
- 5.4 Painel e Faixa revistos em modo escuro e claro; legíveis, com os números das posições visíveis. Observação: nomes truncados nos tiles pequenos da Faixa.
- 5.5 A disposição guardada persiste ao alternar Composição, Grade e Composição.
- 6.1 a 6.3 Grade com câmeras seguidas das partilhas; partilha iniciada pelo painel só em Grade; destaque promove a partilha ao palco com as câmeras numa coluna lateral e despromove sem interromper as transmissões.
- 7.1 a 7.3 PiP aparece fora do canal (nome, duração, até 4 câmeras) e some ao voltar; arrastar encaixa nos 4 cantos e a nova chamada reabre no mesmo canto; "Voltar ao palco", microfone e terminar chamada direto no PiP.
- 8.1 Ciclo com duas ou mais sessões: entrar, atribuir posições (reflete nas outras por `grid.updated`), Grade e partilha, destaque, desligar E2EE, faixa nas duas, religar com a chave, sair para texto e PiP, voltar e PiP some.
- 8.2 `git status frontend/` sem alterações.
- 10.1 Página Áudio & Vídeo: lista de microfones, saídas e câmeras, medidor em tempo real, som de teste, pré-visualização e persistência; com permissão negada mostra a explicação, sem listas vazias silenciosas.
- 10.2 Blur partilhado entre a página, o green room e o menu da chamada (`Suave` nos três).
- 10.3 O microfone guardado é o `deviceId` exigido na captura ao entrar (verificado com dois microfones).
- 10.4 Página contra o subconjunto em escopo de `mesa_configura_es_udio_v_deo`; itens excluídos ausentes.
- 11.1 Itens VOZ-01 a VOZ-25 verificados, incluindo VOZ-04 (câmera negada: entra só com áudio, com aviso, `cam0`), VOZ-05 (após sair, 0 faixas de captura vivas, com blur desligado e ligado), VOZ-06 (entrar noutro canal sai do anterior e mostra a pré-entrada do destino), VOZ-23 (áudio remoto segue ao navegar) e VOZ-24 (apagar o canal encerra a chamada e limpa a UI).

## Fidelidade visual (protocolo de `docs/v2/fidelity-protocol.md`)

Tema escuro, pt-BR, largura do mockup, capturas em `docs/v2/fidelity/frontend-v2-voice-video/`. O shell (menu lateral, painel Membros) é o da v2 e não o do mockup. Os elementos "excluídos" (telemetria, ruído/eco/AGC, VTT, inspector de slot, espelhar câmera, MLS, "Adicionar câmera") estão ausentes em todas as telas.

| Tela | Mockup | Captura | Classificação | Data |
|---|---|---|---|---|
| Green room | `mesa_pr_entrada_na_chamada_green_room_testar_v_deo` | `green-room.png` | Fiel | 2026-10-02 |
| Palco de composição | `mesa_palco_de_voz_v_deo_composi_o_de_c_meras` | `stage-composicao.png` | Fiel | 2026-10-02 |
| Editor de cenas | `mesa_editor_de_cenas_de_composi_o_1` e `_2` | `editor-mestre.png`, `editor-mestre-1486.png` | Fiel | 2026-10-02 |
| Grade | `mesa_visualiza_o_por_grade_1` e `_2` | `grade-1280.png`, `grade-1600.png` | Fiel | 2026-10-02 |
| Grade com partilha | `mesa_grade_com_compartilhamento_de_tela_1` e `_2` | `grade-share-1280.png`, `grade-share-1600.png` | Fiel | 2026-10-02 |
| PiP | `mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player` | `pip-1600.png` | Fiel | 2026-10-02 |
| Áudio & Vídeo | `mesa_configura_es_udio_v_deo` (subconjunto) | `av-968.png` | Fiel | 2026-10-02 |

Elementos obrigatórios (D7), todos `presente`: green room (cartão de cabeçalho, pré-visualização 16:9 com blur sobreposto, alternadores e medidor, calibração, três ações, "No canal agora" com estado, nota); palco (cabeçalho, segmentos, chip E2EE, editar cena, tile principal e laterais com "A falar", avatar sem vídeo, chips, "No banco"); editor (nome da cena, "modo edição", Descartar e Salvar, slots numerados, posições, layouts com miniatura, banco, sem inspector); grade (barra com "Compartilhar tela" e "Convidar", tiles com glow e glifos, rodapé "Na escuta"); grade com partilha (partilha no palco, coluna lateral de câmeras, "A transmitir", "Remover destaque"); PiP (cabeçalho arrastável, tiles com selo de fala, controles, "Voltar ao palco").

Observações (não retiram elementos): em 1280 px "Compartilhar tela" e "Convidar" passam para uma segunda linha, porque o painel Membros do shell reduz a largura útil (o mockup não tem esse painel); o "Sair" do PiP é o ícone vermelho de desligar, sem o rótulo de texto; nomes truncam nos tiles pequenos da Faixa e no editor a 1280 px.

## Limitações da verificação

- Câmera e microfone reais não foram usados: o Chromium usa dispositivos falsos, e "Testar vídeo" usa uma faixa de canvas. Câmera negada foi simulada substituindo `getUserMedia`. Transporte LiveKit, E2EE e renderização são reais.
- O áudio falso do Chromium é quase silencioso e o LiveKit não o detecta como fala: em 3.3 usei um tom pulsado gerado por WebAudio no lugar do microfone falso.
- Sem permissão de saída de áudio real: o "Testar som de saída" não foi exercido (os browsers rodam com `--mute-audio`).
- "Desligar E2EE" não tem UI na v2 (a spec só pede faixa e religar): foi desligada por `POST /api/channels/{id}/voice/e2ee`.

## Observações para acompanhar

- Num teste, o vídeo de uma participante ficou 0x0 por vários minutos num browser que entrou depois; sair e entrar de novo resolveu e não voltei a reproduzir.
- O browser de teste D travou duas vezes ao recarregar a página (renderer bloqueado); não reproduziu em duas rodadas limpas seguintes.
- Elementos `<audio>` pausados e sem faixa se acumulam no DOM quando participantes saem e voltam: vazamento leve de DOM, sem efeito audível.
- Sair da chamada ou reiniciá-la (religar E2EE) remove os assentos da cena, comportamento do backend (`unassign_account`), igual ao da v1.
- `cargo test`: `integration::server_isolation::servers_do_not_leak_across_membership` falha (404 em vez de 403) também sem esta alteração.

## Decisões

- A câmera local de quem está no banco não ocupa a posição 1 por omissão.
- A preferência de câmera/microfone vive na sessão de voz e é definida pelos botões da pré-entrada e pela página de Áudio & Vídeo (`mesa.callPrefs.v2`).
- Partilha de ecrã só aparece em Grade (spec): se o utilizador alterna para Composição durante uma partilha, esta continua sem botão para parar até voltar à Grade ou terminar a chamada.
- Chave de canal errada: validada contra a chave selada do servidor (endpoint aditivo, 11.4) em vez de só pelo formato. Uma chave guardada no dispositivo que não confere é esquecida, para o diálogo voltar a pedir a chave.

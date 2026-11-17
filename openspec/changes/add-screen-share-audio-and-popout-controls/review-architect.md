# Review — Arquiteto de Soluções

**Change:** add-screen-share-audio-and-popout-controls
**Data:** 2026-11-16
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Confirmado de novo no código atual: `setScreenShareEnabled` continua em `frontend/src/voice/callSession.tsx:430` (sem drift — citação exata do `design.md`), e o tipo instalado continua a aceitar `ScreenShareCaptureOptions.audio`. Nenhuma dependência nova é necessária.
- O relay typed popout↔owner (`CallPopoutCommand`/`CallPopoutOwnerState`) continua a existir exatamente como descrito e está a ser estendido, não reinventado.
- Escalabilidade: N/A, feature local por chamada, sem carga de servidor.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- Confirmado de novo por grep: ainda não existe no backend `active_screen_shares`, `channel_layout` nem os eventos `voice.screen_share_changed`/`channel.layout_changed` do PRD em `docs/screen-share.md` (continua "Rascunho para validação técnica"). A change continua, corretamente, a não depender dessa máquina inexistente — mas a recomendação já feita na revisão anterior (deixar isso explícito no `design.md`) ainda não foi incorporada ao texto. Mantém-se como achado.
- **Achado (novo, drift confirmado)**: desde a revisão de 2026-11-14, o mesmo commit `0915045` ("1.13.0", 2026-11-14 — per-participant volume, popout controls, connection quality, close-to-tray) que afetou a change `camera-blur-segmentation-model` também tocou `frontend/electron/main.ts` e `frontend/src/voice/callSession.tsx`. Resultado: `fulfillScreenShare` deslocou de `main.ts:626` (citado no `design.md`) para `main.ts:587`; `readPopoutCommand`/`readPopoutOwnerState` de `main.ts:736-775` para `main.ts:697-...`; os handlers IPC de `main.ts:836-866` para `main.ts:799-818`; e `publishPopoutOwnerState`/`onCallPopoutCommand` de `callSession.tsx:1039-1109` para `callSession.tsx:1052-1097`. Nenhuma função mudou de nome, assinatura ou comportamento — é deslocamento puro de linha por inserções anteriores no mesmo ficheiro, não uma mudança estrutural. Recomendação: reconfirmar os números antes da implementação, mesma recomendação já dada para outra change nesta leva.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção — decisões abaixo resolvem a pergunta 1.1 da `tasks.md` ("Have the architect decide...")

A `tasks.md` desta change pede explicitamente, na sua própria task 1.1, que o arquiteto **decida** (não apenas comente) a política de áudio por plataforma e a elegibilidade/escopo do popout antes de qualquer código. As duas revisões anteriores (2026-11-14) validaram que as perguntas estavam bem colocadas, mas não as decidiram. Decido-as agora:

### Decisão A — Política de áudio por plataforma (resolve a pergunta 1 do `design.md`)
**Sempre mostrar a escolha de áudio, nunca ocultar/desabilitar por detecção de capacidade.** Tentar capturar áudio quando selecionado; se a publicação real não incluir uma faixa de áudio (confirmado via D1, "derive displayed state from actual local publications"), a partilha de ecrã continua — não falha a share toda por falta de áudio — e a UI reflete apenas vídeo, sem alerta bloqueante.
*Porquê, e porquê rejeitei a alternativa:* o próprio `design.md` já nota que a deteção de capacidade "pode ser não confiável ou mudar por portal/fonte" — uma matriz de capacidade por SO (Windows/X11/Wayland) seria frágil de manter e dar falsos negativos. Mostrar sempre e deixar o resultado real da publicação (já decidido em D1) ser a fonte da verdade é mais simples e já tem o mecanismo certo construído. Isto não é uma promessa falsa ao utilizador porque D1 já garante que o estado exibido vem da publicação real, não da intenção.
*Implicação de teste:* ainda é necessário validar manualmente em Linux X11 (esperado: sem áudio, cai para vídeo-only sem erro), Linux Wayland/PipeWire (esperado: áudio funciona quando o portal suporta) e Windows (esperado: áudio via loopback). Isto já estava corretamente identificado pela revisão fullstack anterior como trabalho de QA manual — mantenho essa recomendação.

### Decisão B — Elegibilidade e escopo do popout (resolve a pergunta 2 do `design.md`)
**Elegibilidade do popout para partilhar ecrã = exatamente o mesmo guard `canSpeak()` já usado por mic/cam, sem camada de permissão nova.** Isto herda a regra de produto já decidida em `docs/screen-share.md:32` ("qualquer participante do canal pode compartilhar" no MVP) em vez de inventar uma elegibilidade adicional — exatamente a recomendação já apontada (mas não fechada) na revisão de 2026-11-14.
**A escolha de áudio NÃO aparece no popout.** O popout expõe só um botão on/off de partilha de ecrã, que arranca com a preferência de áudio padrão/última usada da janela principal — nunca pede para escolher áudio na faixa de 240×180. Isto resolve diretamente o risco já listado no `design.md` ("A fifth button plus possible audio choice may crowd the 240×180 popout") e simplifica D2: a última frase de D2 ("The popout audio choice, if exposed there, must travel as a narrowly validated field...") deixa de ser necessária — `setScreen` no popout permanece um booleano simples, sem campo de áudio adicional no IPC.
*Porquê rejeitei expor áudio no popout:* o próprio D3 original de `add-popout-call-controls` já tinha decidido manter o popout deliberadamente estreito (sem blur/background, sem output-device); adicionar uma segunda dimensão de escolha (áudio) ao único botão novo desta change contradiz essa disciplina de escopo sem necessidade — quem quiser mudar a preferência de áudio volta à janela principal, onde o controlo completo já existe.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- As Decisões A e B acima devem ser dobradas para dentro do `design.md` (como D1a/D2a, ou emendas a D1/D2) antes de iniciar a implementação, para que `tasks.md` 1.1 possa ser marcada como concluída com uma referência concreta, em vez de ficar como comentário só nos relatórios de review. Esta revisão não edita `design.md` — fica como recomendação para quem conduzir a próxima etapa.
- Fora isso, o padrão de ADR do `design.md` (Decisions com alternativa rejeitada, Open questions separadas) continua adequado.

## 5. Ponte entre produto e técnico

Veredito: OK

- A Decisão B acima está ancorada numa decisão de produto já tomada (`docs/screen-share.md:32`), não inventada agora — é exatamente o tipo de ponte produto→técnico que esta dimensão cobra: usar o que já foi decidido em vez de abrir uma nova pergunta de produto paralela.
- O corte de escopo do `add-popout-call-controls` (D3) continua respeitado pela Decisão B.

## Bloqueantes antes de implementar
- nenhum — as duas perguntas que a task 1.1 pedia para decidir estão decididas acima (Decisões A e B); recomenda-se dobrá-las para o `design.md` antes de marcar a task 1.1 como concluída.

# Review — Desenvolvedor Fullstack

**Change:** fix-pip-call-navigation-freeze
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A — `proposal.md` confirma "sem impacto conhecido em backend, API ou formato de mensagens", e nada no `design.md` sugere o contrário.

## 2. Desenvolvimento do frontend

Veredito: OK

- Confirmei que os pontos citados em `design.md` existem exactamente como descritos: `Hosts.tsx` (condição `voice.popoutFor() !== voice.channelId()` que esconde `FloatingPlayer` quando o popout está aberto), `CallElsewhere.tsx` (botão "Trazer de volta" → `call.closePopout()`), `Stage.tsx` (`CallElsewhere` só aparece com `call.popoutFor() === props.channel.id`), e `closePopoutOnce()`/`pendingClose`/`timedOutCloses` em `callSession.tsx` com o timeout de 5s. A Tarefa 1.1 descreve um caminho de reprodução manual real (navegar pela barra lateral de volta ao canal de voz, clicar "Trazer de volta"), implementável sem ambiguidade.
- A Tarefa 1.2 (reprodução do travamento do PiP) é a parte mais frágil de executar — "capturar onde a thread principal fica presa" com DevTools é viável, mas não determinístico; a tarefa já reconhece isso ao pedir repetição com os dois caminhos do relato (sem troca de servidor primeiro, e com troca de servidor).

## 3. Deploy e operação

Veredito: Atenção

- O relato original é contra o **AppImage empacotado** (`v1.3.2`), não o modo de desenvolvimento (`npm run electron:dev`). A Tarefa 1.2 não pede para confirmar se o travamento também acontece em modo de desenvolvimento — isso importa para apontar a causa: se só acontece no pacote, aponta para algo específico do empacotamento/sandbox do Electron em produção (ex. `webSecurity: false` já usado no popout, ou diferenças de flags entre dev e build); se acontece também em dev, é lógica da aplicação, não do empacotamento. Vale acrescentar essa verificação à Tarefa 1.2 antes de concluir o diagnóstico.
- Sem porta, serviço ou variável de ambiente nova — fora isso, nada a apontar.

## 4. Qualidade de código

Veredito: Atenção

- Não existe, nem pode razoavelmente existir, um teste automatizado que cubra um travamento com câmara real em WebRTC — a Tarefa 3.3 (`npm run build` + `verify:popout-grid`) é só uma rede de segurança mínima (não quebrou nada óbvio), não cobre o sintoma relatado. A confiança final desta change depende inteiramente da verificação manual da Tarefa 3.1 — isso é aceitável dado o tipo de defeito, mas vale que fique registado explicitamente ao fechar a change, para quem ler depois não assumir que "testes passaram" cobre o travamento.
- A Tarefa 1.3 (decidir se os dois sintomas partilham causa) está bem colocada como passo explícito antes da Tarefa 2 — evita o risco comum de corrigir só o sintoma mais fácil de reproduzir (popout) e assumir que o travamento do PiP ficou resolvido de borla.

## 5. Execução das decisões arquiteturais

Veredito: OK

- Sem tensão com `popout-voice-navigation-handoff` nem com nenhuma decisão existente — a Tarefa 3.2 explicitamente verifica não-regressão nos caminhos que essa change já cobre.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- nenhuma

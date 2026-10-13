# Review — Arquiteto de Soluções

**Change:** popout-voice-navigation-handoff
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: N/A (quase integralmente) / OK

- A change não introduz stack, componente ou serviço novo. É um ajuste de estado/sequenciamento dentro do SolidJS existente (`frontend/src/shell/Hosts.tsx`, `frontend/src/voice/callSession.tsx`, `Stage.tsx`, `GreenRoom.tsx`) e reaproveita a ponte Electron já existente (`mesaNative`). Coerente com `docs/arquitetura-tecnica.md` §5 (SPA + módulo de voz) e com o padrão já usado em `callSession.tsx` (contador `epoch` para invalidar operações obsoletas, linha 82 e usos em `join`/`watch`).
- Escalabilidade não se aplica: é um fluxo local de um único cliente, sem novo tráfego de rede ou fan-out.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- `proposal.md:27` ("Impact") afirma: *"Electron: reutilizar o comando existente de fecho do popout; sem nova API ou migração de dados."* Isso só é parcialmente verdade face ao contrato real em `frontend/electron/main.ts:317-319`:
  ```ts
  ipcMain.handle("mesa:close-call-popout", () => {
    if (popout && !popout.isDestroyed()) popout.close();
  });
  ```
  O handler **não espera** o evento `"closed"` da `BrowserWindow` — ele retorna assim que `.close()` é chamado. A notificação real de fecho (`tellOpener("mesa:call-popout-closed", …)`, linha 294-298) só acontece depois, de forma assíncrona, via `onCallPopoutClosed` (push separado), não via o `await` do `invoke`. Logo, `design.md` Decisão 2 ("fecha e aguarda o popout nativo") não é entregável apenas com `await window.mesaNative.closeCallPopout()` como o texto sugere — isso resolve antes da janela terminar de fechar. Quem implementar precisa decidir explicitamente entre (a) aguardar o callback `onCallPopoutClosed` em vez do retorno do `invoke`, ou (b) alterar o handler principal para só resolver a promise após o evento `"closed"`. Qualquer uma das duas é uma mudança pequena, mas contradiz "sem nova API" se for a opção (b), e não está escrita em nenhum artefacto da change.
- Risco concreto decorrente disso: em `openCallPopout` (main.ts:271-277), se a janela antiga ainda não tiver sido destruída (`popout` só é zerado no handler de `"closed"`, linha 296) quando o fluxo de troca pedir um novo popout para o canal seguinte, o código **reaproveita a mesma janela** (`popout.loadURL(...)`) em vez de criar uma nova — uma troca rápida fecha-e-abre pode colidir com o fecho ainda em curso da janela anterior. `design.md` não discute esse branch de reuso, e `tasks.md` 2.2 só fala de proteger o *estado do cliente* contra notificações tardias, não a própria janela nativa.
- Sem porta/processo novo, sem mudança de banco — o resto da integração (reverse proxy, LiveKit, deploy) é irrelevante aqui, como a change já assume corretamente.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK, com uma observação de manutenibilidade

- Segurança/E2EE: `design.md` marca corretamente como Non-Goal mover áudio ou alterar o token de visualização; a change de áudio do popout (`popout-speaker-feedback`, já arquivada) permanece intacta — não há sobreposição, confirmado lendo `callSession.tsx:511-517` (`viewer` continua a gate de áudio) e o `specs/frontend-v2/call-popout/spec.md` aceite, requirement "O popout não devolve o áudio".
- Performance: sem impacto em tempo real; é sequenciamento de chamadas já existentes (`join`/`leave`/`closePopout`).
- Manutenibilidade: `callSession.tsx` já acumula mais de um mecanismo de "geração"/invalidação (`epoch` aqui; a change aberta `voice-call-live-presence` planeia um contador de geração próprio para aplicar `voice.occupancy`, ver `openspec/changes/voice-call-live-presence/design.md` Decisão 1). Os dois mecanismos têm propósitos diferentes e não colidem logicamente, mas ambos tocam o mesmo arquivo/área; vale um comentário no código (não bloqueante) deixando claro que são guardas independentes, para quem ler depois não tentar fundi-los.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- `design.md` segue o estilo esperado (Decisões numeradas com alternativa rejeitada e motivo) e `Risks / Trade-offs` cobre a disputa de estado entre fecho nativo e nova entrada — ainda que, como apontado na seção 2, a mitigação proposta ("aguardar o fecho antes do join novo") precise de um detalhe de implementação que o documento não resolve.
- Não há diagrama, mas a complexidade (três passos assíncronos: fechar popout → sair da chamada → entrar na nova) é pequena o suficiente para não exigir um; a prosa da Decisão 2 já descreve a sequência linearmente.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why"/"What Changes" de `proposal.md` (esconder "Bring it back" fora do canal original; sequenciar a troca de chamada) mapeia diretamente para as Decisões 1-3 de `design.md` e para os dois requirements do delta (`specs/frontend-v2/call-popout/spec.md`). Não há feature de RPG envolvida nesta change.
- Verificado que não há conflito com `voice-call-live-presence` (ainda aberta): essa change cobre ocupação/presença de quem já está no canal e refresh do palco via eventos LiveKit/`voice.occupancy`; esta change cobre visibilidade de "Bring it back" e a sequência join/leave/popout ao trocar de chamada. Tocam o mesmo arquivo (`callSession.tsx`) em pontos distintos — ver observação de manutenibilidade na seção 3 — mas não há sobreposição de requirement ou de comportamento.

## Bloqueantes antes de implementar

- nenhum

# Review — Arquiteto de Soluções

**Change:** add-popout-call-controls
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Esta é a change com a separação de responsabilidades mais clara revisada nesta sessão: D1 (transporte IPC), D2 (estado autoritativo), D3 (conjunto de controlos e semântica de saída), D4 (apresentação/overlay) tratam quatro preocupações genuinamente distintas sem misturá-las.
- Confirmei contra o código real que o mecanismo proposto em D1 já tem precedente directo: `tellOpener()` (`frontend/electron/main.ts:583-585`) já envia eventos do processo principal para o `popoutOpener.webContents`, e `onCallPopoutClosed`/`onUpdateState` (`preload.ts:50-57,43-47`) já estabelecem o padrão de assinatura com remoção de listener que a tarefa 1.2 pede para repetir. Isto não é um mecanismo novo a inventar, é uma extensão directa de um padrão já em produção.
- Escalabilidade: N/A correctamente — é uma única sessão desktop por utilizador, sem fan-out.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Nenhum impacto em backend/LiveKit/infra — confirmado pelo `Impact` do `proposal.md`, que lista só `main.ts`/`preload.ts`/`env.d.ts`/`CallPopoutWindow.tsx`/`callSession.tsx` e CSS. A sala view-only do popout (`voice/popout-viewer-token`) não é tocada, só comandada por fora.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- Segurança: OK — D1/D2 exigem validar o remetente contra `popout.webContents`/`popoutOpener` e proíbem explicitamente um "escape hatch" de IPC genérico (tarefa 1.2); segue o padrão de validação de payload já usado em `readPopoutRequest` (`main.ts:573-580`).
- Performance: N/A, mensagens pequenas e pouco frequentes.
- **Achado (interacção entre changes desta mesma leva):** `tellOpener()` só verifica `!popoutOpener.isDestroyed()` (`main.ts:583`) — não se a janela principal está visível. Isso é bom: significa que esconder a janela principal na tray (`electron-system-tray-notifications`, já implementada) não destrói o `webContents`, então os comandos do popout devem continuar a funcionar com a janela principal escondida — que é exactamente o padrão de uso real (pessoa deixa a janela principal na tray e fica só a olhar o popout). Mas nem `design.md` nem `tasks.md` mencionam testar esse cenário explicitamente, e esta change coexiste na mesma leva com `fix-stale-background-call-blocks-rejoin` (que também altera o ciclo de vida da janela principal escondida) e `close-button-behavior-preference` (que torna o comportamento de fechar configurável). Recomendo que a tarefa 3.2 inclua explicitamente "janela principal escondida na tray, popout aberto, comandos continuam a funcionar" como um cenário de verificação, em vez de depender apenas da leitura do código para confirmar que `isDestroyed()` já cobre isso.
- Manutenibilidade: a disciplina de escopo do D3 (recusar screen-share, blur, dispositivo de saída, segundo popout nesta primeira superfície) é exactamente o tipo de limite que mantém a change implementável por uma equipa pequena sem inchar o IPC novo.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1-D4 seguem o padrão de alternativa-rejeitada com motivo técnico concreto, não preferência. A capacidade modificada (`frontend-v2/call-popout`) é a correcta — ao contrário de outra change desta leva, aqui não há mistura de capacidades; o novo requirement de overlay/hover e o de comando ficam ambos dentro de `specs/frontend-v2/call-popout/spec.md`, coerente com o que já estava ali (a Requirement já aceite sobre o popout ser "só para visualizar" é correctamente marcada como MODIFIED, não substituída silenciosamente).
- Sem diagrama — aceitável dado que o fluxo (popout → main → sessão dona → estado de volta) está descrito em prosa suficiente para três processos; se a implementação revelar mais complexidade de sincronização, valeria um diagrama de sequência, mas não é exigível agora.

## 5. Ponte entre produto e técnico

Veredito: OK

- O pedido original do usuário (overlay estilo Discord, oculto por padrão, margem fixa) está traduzido fielmente em D4, já reflectindo a iteração de design discutida nesta mesma sessão — sem perda de requisito entre o pedido de produto e o ADR técnico.

## Bloqueantes antes de implementar

- nenhum

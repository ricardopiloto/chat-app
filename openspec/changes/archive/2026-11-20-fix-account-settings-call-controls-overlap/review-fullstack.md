# Review — Desenvolvedor Fullstack

**Change:** fix-account-settings-call-controls-overlap
**Data:** 2026-11-20
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A — `proposal.md:19` declara explicitamente "No backend, CSS, or localization changes", e o diff real (`git diff --stat`) confirma: só `frontend/src/shell/AppShell.tsx` e `frontend/src/shell/UserPanel.tsx` foram tocados.

## 2. Desenvolvimento do frontend

Veredito: OK

- A implementação é mínima e idiomática para SolidJS: uma prop booleana nova (`showCallControls`) passada de `AppShell.tsx:66` (`shell.route().page !== "account"`) para `UserPanel.tsx`, que envolve o `<CallControls />` existente em `<Show when={props.showCallControls}>` (`UserPanel.tsx:26`). Não há estado duplicado nem lógica de layout reimplementada.
- Verifiquei `CallControls.tsx`: todo o conteúdo visual já está atrás do seu próprio `<Show when={call.live()}>`, e o `onCleanup` do componente só libera URLs de blob do menu de fundo de câmera e fecha popovers locais — não há stream de mídia/dispositivo sendo aberto ou fechado por este componente (isso vive em `useCall()`/`CallProvider`, montado um nível acima em `AppShell.tsx`). Logo, montar/desmontar `CallControls` via `<Show>` ao trocar de rota é seguro: não há risco de cortar áudio/vídeo da chamada ao entrar/sair de `/account`.
- Confirmei que o mecanismo de altura dinâmica já existente (`ResizeObserver` → `--user-card-height`, consumido por `.server-rail` em `voice.css:11`) reage corretamente ao encolhimento do card quando `CallControls` some — nenhum ajuste adicional de CSS foi necessário, e nenhum foi feito.

## 3. Deploy e operação

Veredito: N/A — não há variável de ambiente, porta, serviço ou script de build novo. `npm run build` (`tsc --noEmit && vite build`) e `npm run lint` (`eslint src`) são os scripts corretos e já existentes para este tipo de mudança, e o `final.txt` do Codex relata ambos como "passed".

## 4. Qualidade de código

Veredito: Atenção

- Não existe neste projeto um framework de teste de componente para o frontend (`frontend/package.json` só tem scripts `verify:*` ad hoc por feature, nenhum deles cobrindo shell/rail/user-panel/account), então não há "teste automatizado faltando" no sentido estrito — não há onde ele caberia hoje.
- Porém a verificação real de UI (tasks.md 1.2 e a nota final do Codex: "Visual verification in Vite or Electron remains to be done separately") **ainda não aconteceu**. O que foi validado é: lógica de código lida manualmente, `openspec validate --strict`, `tsc`/`vite build`, `eslint`. Nenhum desses confirma visualmente que, em uma chamada ativa real, abrir `/account` realmente produz o layout esperado (identidade + menu de conta sem a fileira de controles, com o floating player ainda funcional) nem que voltar para uma rota com sidebar completa restaura `CallControls` sem flash/glitch de altura. Recomendo rodar isso manualmente (dev server + uma call de teste) antes de arquivar a change.
- Escopo de módulos: a change não implica refactor não declarado; é confinada aos dois arquivos já previstos.

## 5. Execução das decisões arquiteturais

Veredito: Atenção

- Não há `design.md` nesta change (diferente de todas as outras changes comparáveis no repositório, que têm um), então não há "decisão documentada" para auditar contra — a decisão existe apenas implícita no `proposal.md` e no código. A implementação é consistente com o que o `proposal.md`/spec delta descrevem, então não há execução divergente da intenção; é puramente uma lacuna de documentação, que reporto também ao Arquiteto abaixo.
- Limitação técnica real e já identificada pelo próprio proposal (`proposal.md:21`): o `FloatingPlayer` pode ter seu canto persistido (`mesa.pip.corner`) em `bl`, e nesse caso ele ainda pode cobrir visualmente o rail/user-card mesmo depois desta correção. Esta change não resolve isso e documenta como follow-up — correto não misturar escopo, mas sinalizo para rastreamento (ver abaixo).

## Bloqueantes antes de implementar

- nenhum.

## Limitações técnicas a reportar ao Arquiteto

- Falta de `design.md` quebra a convenção de ADR já estabelecida em todas as outras changes do repositório — mesmo achado que o Arquiteto provavelmente já levanta na dimensão 4 da revisão dele.
- O follow-up do canto persistido do `FloatingPlayer` (`mesa.pip.corner` = `bl` cobrindo o rail) não tem nenhum item de tasks/backlog formal além de uma frase no `proposal.md`; sugiro ao Arquiteto decidir se isso vira uma change própria registrada ou um item explícito em algum backlog do projeto, para não se perder.

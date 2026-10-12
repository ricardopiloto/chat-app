# Review — Desenvolvedor Fullstack

**Change:** user-panel-identity-parity
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A — mudança puramente visual em `UserPanel.tsx`, sem API, sessão ou dado tocado.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Confirmei em `frontend/src/shell/UserPanel.tsx:17,19,22,23,25-26` o estado actual exactamente como `design.md` descreve: `border-t border-outline-variant bg-surface-container`, `px-3 py-3 gap-3`, `<strong class="text-body-md text-on-surface">` (sem `size` no `Avatar`, logo `md`/40px por omissão), `text-secondary` no handle, botão `h-9 w-9 rounded-full` com ícone `text-[20px]`.
- Confirmei que todos os tokens citados em `design.md` existem de facto: `tailwind.config.ts:12` tem `body-sm` (12px, sem peso fixo → 400 por omissão) e `label-code-sm` (11px/peso 500); `tailwind.config.ts:11` tem `fontFamily.display` (Plus Jakarta Sans) e `fontFamily.code` (JetBrains Mono); a lista de `colorTokens` inclui `on-surface-variant` e `surface-container-lowest`. Nada na Decisão 1 precisa de um token novo.
- Confirmei em `frontend/src/components/ui/Display.tsx:4,7` e `frontend/src/components/ui.css:113` que `Avatar` já aceita `size="sm"` e que `.avatar.sm` já é `h-8 w-8` (32px) — a Tarefa 1.2 ("avatar de 32px já existente") é só passar a prop, sem CSS novo.
- **Lacuna**: a Tarefa 1.2 pede que o ponto de presença fique a 10px com anel `surface-container-lowest` "sem alterar `.presence` global, só para esta faixa" — mas `ui.css:116-118` mostra `.presence` como classe global fixa (`h-3 w-3 border-2 border-surface`) aplicada pelo próprio `Avatar` (`Display.tsx:11`), que não expõe nenhuma prop para o chamador variar o tamanho/anel da presença nem uma classe no wrapper para um selector descendente ter onde se prender. Nem `tasks.md` nem `design.md` dizem qual dos dois caminhos usar: (a) dar ao `<div>` de `UserPanel.tsx` uma classe própria (ex. `user-panel`) e acrescentar um override `.user-panel .presence {...}` em `ui.css`/`chat.css`, ou (b) estender `Avatar` com uma prop opcional (ex. `presenceSize`). Qualquer uma resolve, mas a escolha fica em aberto — vale decidir isso ao implementar, sem tratar como achado de arquitectura.

## 3. Deploy e operação

Veredito: N/A — sem build, script ou variável nova.

## 4. Qualidade de código

Veredito: OK

- Duas tarefas com critério de verificação visual concreto (medidas em px, tokens de cor nomeados) — consistente com o padrão "tarefa + como verificar" do projecto. Não há lógica para testar automaticamente; verificação visual manual é o caminho certo aqui.
- Risco "Call controls sit in the same wrapper" (`design.md:33`) está bem registado e o escopo da Tarefa 1.1 confirma que não toca nas classes do `CallControls`.

## 5. Execução das decisões arquiteturais

Veredito: Atenção

- **Achado cruzado**: a change arquivada `openspec/changes/archive/2026-10-12-visual-parity-full-reaudit/tasks.md`, Tarefa 2.2, afirma (checkbox `[x]`) ter corrigido exactamente este mesmo ponto — "Corrigir `UserPanel.tsx:22` para o token de cor confirmado na Tarefa 2.1" — mas o ficheiro real, lido agora, continua com `text-secondary` no handle (`UserPanel.tsx:23`). Ou a correcção da 2.2 nunca chegou a ser aplicada ao ficheiro apesar do checkbox marcado, ou a 2.1 concluiu noutra direcção que não ficou reflectida no código. Isto não bloqueia `user-panel-identity-parity` — a Tarefa 1.1 desta change resolve a cor de qualquer forma, com uma decisão (`design.md` Decisão 1) explicitamente contrária ao `text-secondary` do fix anterior — mas é um sinal de que o registo de progresso de `visual-parity-full-reaudit` pode não reflectir o estado real do repositório, no mesmo padrão já visto em `desktop-packaging-ci`. Vale reportar ao utilizador, não só ao Arquiteto.
- Fora isso, nenhuma tensão: a change explicitamente rejeita reabrir a cor/estado destacado do menu de conta (`design.md` Non-Goals) e não há decisão de stack ou de integração em jogo.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- A forma de isolar o override de `.presence` a esta faixa (wrapper class + CSS descendente vs. nova prop em `Avatar`) não está decidida em `design.md`. Não acho que precise de voltar à arquitectura — é um detalhe de implementação resolúvel na hora — mas se o Arquiteto preferir fixar a abordagem antes de implementar, é aqui que entraria.

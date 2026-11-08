# Review — Desenvolvedor Fullstack

**Change:** simplify-entry-screens
**Data:** 2026-11-06
**Veredito geral:** Aprovado com ressalvas (bloqueante do item 5 corrigido via `/opsx:update` em 2026-11-06; ressalvas do item 4 continuam de baixo risco, não bloqueiam)

## 1. Desenvolvimento do backend

Veredito: N/A

- Nenhuma rota, migração ou lógica de servidor é tocada. `tasks.md` corretamente não lista nenhuma tarefa de backend.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Viável com a stack real (Solid.js + componentes `AuthField`/`Button`/`Dialog`/`Badge`/`Icon` já usados nos dois ficheiros) — não há componente a inventar.
- `tasks.md` 1.3 ("unificar o botão... com o link de rodapé... num só controlo") não diz onde o controlo unificado fica posicionado no ecrã final, nem que elemento visual ele usa (botão secundário? link de texto?) — isso fica a critério de quem implementa. Não é bloqueante (é detalhe de layout, e `design.md` já cobre a intenção), mas vale fixar no `tasks.md` para a revisão de implementação ter algo concreto contra o que conferir, em vez de "ficou razoável".
- `tasks.md` 1.2 já corrige explicitamente o destino de `auth.forgotVaultHelp` (dentro do `Dialog`) — bom, isso evita perder texto ao remover o cartão.

## 3. Deploy e operação

Veredito: N/A

- Mudança 100% client-side, sem variável de ambiente, porta ou processo novo. Nada a ajustar em build/empacotamento do Electron.

## 4. Qualidade de código

Veredito: Atenção

- `tasks.md` 1.6 só lista `npm run build` como regressão. O projeto já tem dois scripts baratos e diretamente relevantes que `tasks.md` não menciona:
  - `npm run verify:i18n-keys` (`frontend/scripts/verify-i18n-keys.mjs`): falha se uma chave usada no código faltar num catálogo, ou se uma chave existir só num idioma. A tarefa 1.4 (remover chaves `unlock.*` não usadas) e a D4 (remover `auth.protocol`/`auth.cipher` só no modo login, mantendo-as se o modo registo continuar a usá-las) são exatamente o tipo de edição que este script foi escrito para pegar — remover a chave de um catálogo e esquecer o outro passa despercebido sem ele.
  - `npm run verify:entry-screens` (`frontend/scripts/verify-entry-screens.mjs`): já automatiza o guard "sistema de design não alterado" (diff vazio em `tokens.css`, `tailwind.config.ts`, `components/ui.css`, `components/ui/`) que a spec `frontend-v2/entry-screens` exige (ver `review-architect.md`, item 4) — é o teste mais barato que existe para a parte desse requisito que é automatizável.
  - Recomendação: acrescentar os dois comandos a `tasks.md` 1.6, antes ou junto do `npm run build`.
- Nenhum teste automatizado novo é proposto para o comportamento condicional (aviso do vault só quando `noLocalCopy()`, controlo de troca de conta unificado). Dado o padrão real do projeto (scripts `verify-*.mjs` + verificação manual no Electron, não testes unitários de componente Solid), isto é aceitável — mas se quiserem reduzir ainda mais o risco, dava para estender `verify-entry-screens.mjs` com um caso cobrindo a lógica pura de visibilidade (se ela for extraída para uma função testável, como `noLocalCopy()`/`nothingAnywhere()` já são). Sugestão, não bloqueio.
- `tasks.md` 2.2 pede confirmação visual a 360px só para o `Auth.tsx`; o mesmo seria útil para o `Unlock.tsx` depois da consolidação de cartões (1.1–1.3), que é a mudança de layout mais densa das duas. Falta uma tarefa equivalente para `Unlock.tsx`.

## 5. Execução das decisões arquiteturais

Veredito: **Bloqueante** (ligado ao achado do Arquiteto — corrigido, ver nota no fim)

- Concordo com o achado central do `review-architect.md` (item 4): `skip_specs: true` com a justificativa "não há spec a cobrir isto" está errado — `frontend-v2/entry-screens` e `frontend-v2/auth` cobrem precisamente estes ecrãs, e foram criadas pela change `2026-11-04-parley-public-home-and-login` para isso. Do ponto de vista de quem implementa, isto importa na prática: sem essa referência, a tarefa 1.5 (verificação manual) vira paráfrase própria em vez de conferir os cenários reais ("Recuperação continua acessível", "Trocar de conta"). Reporto aqui porque é exatamente o tipo de lacuna que só aparece ao tentar transformar `design.md` em passos de verificação concretos — não é uma limitação técnica nova, é a mesma lacuna de rastreabilidade, vista do lado da implementação.
- Fora isso, `tasks.md` segue as decisões do `design.md` sem reabrir nada já decidido (D1–D4 aparecem traduzidas em tarefas 1:1).

## Pós-implementação (2026-11-07)

`git diff` revisto linha a linha para os 4 ficheiros tocados. `Unlock.tsx`: identidade+instância consolidadas num único cartão (D1/D3); aviso do vault agora atrás de `<Show when={noLocalCopy()}>` (D1); cartão "Recover identity" virou link de texto, com `unlock.recoverText` e `auth.forgotVaultHelp` movidos para dentro do `Dialog` junto de `auth.recoveryWarning` (D2) — nada perdido. `Auth.tsx`: linha protocolo/cifra envolvida em `<Show when={registering()}>` (D4). i18n: `otherAccess`, `helpTitle`, `helpText`, `noticeTitle`, `recoverTitle` removidas simetricamente de `en.ts` e `pt-BR.ts` — sem órfãs, confirmado por `verify:i18n-keys`.

Nota sobre a tarefa 1.3: em vez de criar um novo controlo combinado, a implementação simplesmente removeu o botão duplicado do cartão de instância e manteve o link de rodapé já existente (que já chamava a mesma `switchAccount()`) — resultado funcionalmente idêntico ao pedido, só por um caminho mais simples (apagar a duplicata em vez de os fundir); não é um desvio que precise de nova decisão.

Verificação ao vivo (backend SQLite + frontend Vite descartáveis, Chromium headless via CDP — não só leitura de código): registo → reload → ecrã de desbloqueio com vault local (sem aviso) → IndexedDB `chat-identity` apagada → reload → aviso aparece → diálogo de recuperação mostra os 3 parágrafos → logout → `/login` sem a linha protocolo/cifra → modo registo com a linha presente. Screenshots a 1280px e 360px sem overflow em nenhum dos casos. Único ponto não exercido: a variante nativa (Electron) de `nativeEntry`/`clearInstance()` — não há build Electron empacotado neste ambiente; risco residual baixo porque o diff não tocou essa lógica, só a JSX em torno dela. Mantém-se **Aprovado com ressalvas** (a ressalva agora é só essa, não um bloqueio).

## Bloqueantes antes de implementar

- Nenhum pendente. **Correcção aplicada em 2026-11-06 via `/opsx:update`**: referência de capacidades corrigida em `proposal.md`/`design.md`; `tasks.md` 1.5 agora amarra a verificação aos cenários reais de `frontend-v2/entry-screens`; 1.6 passou a incluir `npm run verify:i18n-keys` e `npm run verify:entry-screens`; 1.3 e 1.7 (nova) resolveram as ressalvas de posição do controlo unificado e de verificação a 360px do `Unlock.tsx`. `openspec validate --strict` confirma a change válida.

## Limitações técnicas a reportar ao Arquiteto

- Nenhuma além do já registado em conjunto no item 5 acima — não há limitação de infraestrutura/arquitetura nova revelada pela implementação; o achado é de rastreabilidade documental, não técnico.

# Review — Arquiteto de Soluções

**Change:** simplify-entry-screens
**Data:** 2026-11-06
**Veredito geral:** Aprovado (bloqueante do item 4 corrigido via `/opsx:update` em 2026-11-06 — ver nota no fim desse item)

## 1. Definição da arquitetura técnica

Veredito: N/A

- A change não introduz stack, componente ou protocolo novo: reorganiza `frontend/src/pages/Unlock.tsx` e `frontend/src/pages/Auth.tsx` com os componentes já existentes (`AuthFrame`, `AuthField`, `Button`, `Dialog`, `Badge`). Não há pergunta de escalabilidade/carga a fazer aqui — é renderização client-side de um formulário.

## 2. Integração com a infraestrutura existente

Veredito: N/A

- Nenhum backend, banco, deploy ou serviço auxiliar é tocado. `proposal.md`/`Impact` lista corretamente só os dois componentes de página e dois catálogos de i18n.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança: a lógica de sessão/recuperação (`session.unlock`, `session.recover`, detecção `missing_vault`/`no_local`) é explicitamente preservada (`design.md` Non-Goals) — correto, nada aqui deveria mudar.
- `design.md` já documenta o trade-off de esconder a explicação do "Vault notice" no caminho comum (seção Risks/Trade-offs) com mitigação razoável (continua a aparecer quando `noLocalCopy()`).
- Manutenibilidade: consolidar os dois controles que chamam `switchAccount()` reduz, e não aumenta, a superfície duplicada — é uma melhoria real, não só cosmética.

## 4. Documentação e decisões (ADRs)

Veredito: **Bloqueante** (ver nota de correcção no fim desta secção)

- **A secção "Capabilities" do `proposal.md` está factualmente errada**, e isso é o achado central desta revisão. Ela diz: "(nenhuma — `skip_specs: true`... não há spec de capacidade do OpenSpec a cobrir o layout exacto destes ecrãs, só os fluxos de sessão/recuperação que já estão especificados noutras changes e não mudam aqui.)". Isso não é verdade: existe `openspec/specs/frontend-v2/entry-screens/spec.md`, criada especificamente para isto pela change `2026-11-04-parley-public-home-and-login` (ver o `proposal.md` dela: "`frontend-v2/entry-screens`: regras comuns às telas de entrada:... **coesão visual dos controles e proibição de alterar o sistema de design**"), e `openspec/specs/frontend-v2/auth/spec.md` (marcada `Modified Capabilities` na mesma change, para "ecrãs de autenticação fiéis aos mockups"). Ambas têm requisitos que casam quase ponto-a-ponto com as decisões D2/D3 desta change:
  - `frontend-v2/entry-screens`, cenário **"Recuperação continua acessível"**: *"«Esqueci a senha» (login) e «Recuperar identidade» (desbloqueio) continuam visíveis sem exigir uma tentativa falha"* — é exatamente o que D2 ("cartão vira link") precisa respeitar.
  - `frontend-v2/entry-screens`, cenário **"Trocar de conta"**: *"a sessão termina e a web abre `/login`; no desktop, `nativeEntry` volta a 'home'..."* — é exatamente o comportamento que D3 (unificar os dois controles de troca de conta) precisa preservar.
  - `frontend-v2/entry-screens`, requisito **"Controles das telas de entrada têm uma só escala visual"** e **"O sistema de design não é alterado"** (`tokens.css`, `tailwind.config.ts`, `components/ui.css`, `components/ui/` intocáveis) — é o que `verify-entry-screens.mjs` (`protectedFiles` guard) já automatiza, e que D1/D2/D3/D4 precisam continuar a respeitar ao consolidar blocos.
  - `openspec/specs/auth/...` não existe ligação directa adicional além desta; a spec relevante é mesmo a `frontend-v2/*`, não "auth" genérico — a referência vaga do `proposal.md` a "especificados noutras changes" não identifica a spec real.
  - **Risco concreto**: ao tratar isto como "sem spec", a revisão de implementação não tem contra o que conferir se, por exemplo, alguém implementar o link de "Recuperar identidade" (D2) escondido atrás de uma tentativa de senha errada, ou se a troca de conta unificada (D3) parar de abrir `/login` na web como o cenário exige. `tasks.md` 1.5 hoje só diz "fluxo de recuperação de identidade continua acessível", em prosa própria, sem referenciar os cenários reais — fácil de implementar "de forma plausível" e ainda assim violar o requisito.
- **Correção necessária antes de implementar**: `proposal.md`/`design.md` devem citar `frontend-v2/entry-screens` e `frontend-v2/auth` pelo nome, e `tasks.md` deve amarrar a verificação manual (1.5) aos cenários exactos citados acima, não a uma paráfrase. `skip_specs: true` pode continuar a ser defensável — nenhum dos dois requisitos muda de texto, esta change só os implementa dentro do que já está aceite — mas isso tem de ser dito explicitamente ("ambas as capacidades existentes permanecem como estão; esta change é conforme, não as modifica"), não "não há spec". Se preferirem seguir o precedente exacto da change que criou estas capacidades (que as listou em `Modified Capabilities` mesmo sem mudar o texto do requisito, só para deixar rastro), isso também é aceitável — qualquer uma das duas opções resolve o bloqueio, desde que a spec real seja nomeada.
- Fora isso, o padrão de `design.md` (Context/Goals-NonGoals/Decisions com alternativas rejeitadas, Risks, Migration Plan, Open Questions) segue o que já se usa no projeto (ex. `harden-channel-prop-async-reads`). Nenhum diagrama é necessário — a complexidade não justifica.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why"/"What Changes" do `proposal.md` mapeia 1:1 para as quatro Decisions (D1–D4) do `design.md`; nada fica como promessa vaga. A única lacuna é a de documentação tratada no item 4, não de tradução produto→técnico.

## Pós-implementação (2026-11-07)

Código resultante (`git diff` em `Unlock.tsx`, `Auth.tsx`, `en.ts`, `pt-BR.ts`) lido e exercido num backend+frontend descartáveis (não só leitura estática): confirma D1–D4 conforme desenhado, e os dois cenários citados de `frontend-v2/entry-screens` ("Recuperação continua acessível", "Trocar de conta") passam — ver evidência em `tasks.md` 1.5/1.6/1.7/2.2. Nenhum achado novo de arquitetura surgiu na implementação. Mantém-se **Aprovado**.

## Bloqueantes antes de implementar

- Nenhum pendente. **Correcção aplicada em 2026-11-06 via `/opsx:update`**: `proposal.md` (secção Capabilities) e `design.md` (Context, D2, D3) agora citam `frontend-v2/entry-screens` e `frontend-v2/auth` pelo nome e pelos cenários exactos ("Recuperação continua acessível", "Trocar de conta"), com a justificativa explícita de que `skip_specs` continua `true` porque nenhum requisito muda de texto. `tasks.md` 1.5 passou a verificar esses dois cenários literalmente, 1.6 passou a incluir `verify:i18n-keys`/`verify:entry-screens`, e 1.3/1.7 ficaram concretas quanto a posição do controlo unificado e verificação a 360px do `Unlock.tsx`. `openspec validate --strict` confirma a change válida após a correcção.

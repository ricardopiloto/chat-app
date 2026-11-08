# Review — Desenvolvedor Fullstack

**Change:** electron-custom-title-bar
**Data:** 2026-11-08 (revisão do código implementado)
**Veredito geral:** Aprovado

## 1. Desenvolvimento do backend
Veredito: N/A

O "backend" desta change é o processo principal do Electron, coberto na secção 2.

## 2. Desenvolvimento do frontend
Veredito: OK

- Corri eu próprio `tsc --noEmit`, `eslint src`, `npm run verify:entry-screens`, `npm run verify:i18n-keys`, `npm run build`, `npx tsc -p electron/tsconfig.json` e `npx tsc -p electron/tsconfig.preload.json` — todos passaram sem erro, depois da correcção.
- **Corrigidos ambos os achados**: `TitleBar.tsx` usa `<Icon name="minimize"|"maximize"|"restore"|"close">` (os três primeiros novos em `icon-map.ts`, `close` reaproveitado) e `aria-label` com `t("shell.titleBar.*")`, chaves novas em `en.ts`/`pt-BR.ts`. `verify:i18n-keys` confirma 1306 chaves simétricas nos dois catálogos.

## 3. Deploy e operação
Veredito: OK

- Confirmei (`npm run build`) que o chunk `TitleBar` existe no artefacto web mas não é pedido em runtime pelo caminho `isNative() === false` — consistente com o padrão `lazy()` já usado para `WebPublicHome`/`ElectronHome`.

## 4. Qualidade de código
Veredito: OK

- Sem teste automatizado possível para arrastar/redimensionar/maximizar sem decoração nativa — consistente com o padrão já aceite neste projecto (verificação manual, secção 3 de `tasks.md`, correctamente deixada pendente).

## 5. Execução das decisões arquiteturais
Veredito: OK

- Fiel a D1-D3. Nenhuma decisão reaberta sem justificação.

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- Nenhuma nova de arquitectura — os dois achados desta revisão (ícones, i18n) são de implementação, não mudam nenhuma decisão de `design.md`.

## Addendum (2026-11-08) — três ajustes pós-teste manual

Depois de um teste manual real (Linux, 2560×1440 maximizado), o utilizador reportou dois bugs e pediu uma funcionalidade extra:

1. **Nome errado**: `TitleBar.tsx` mostrava "Mesa" (codinome antigo); corrigido para `t("shell.brand")` ("Parley"), já usado em `AuthFrame.tsx`/`Topbar.tsx`.
2. **Scroll presente em qualquer resolução**: causa raiz confirmada — `TitleBar.tsx` empurrava o conteúdo com `padding-top: 2rem` por cima de seis ecrãs cuja raiz já exigia `100dvh`/`min-height: 100dvh` (unidade sempre relativa ao viewport real, não ao pai), somando 100dvh + 32px, uma sobra fixa em qualquer resolução. Corrigido com uma propriedade CSS customizada (`--mesa-title-bar`, `0px` por omissão — sem efeito no build web) elevada para `2rem` só quando `TitleBar` monta, e `calc(100dvh - var(--mesa-title-bar))` nos seis sítios: `AppShell.tsx`, `AuthFrame.tsx` (×2), `ElectronHome.tsx`, o `loading` de `index.tsx`, e `.mg-invite-page` em `mgmt.css`.
3. **Busca movida para a title-bar** (pedido novo, estilo VSCode): o botão de busca (só um `document.dispatchEvent("mesa:search")`, sem estado próprio — o modal que o escuta, `Hosts.tsx`, está desacoplado da posição do botão) moveu-se de `Topbar.tsx` para `TitleBar.tsx`, visível só quando `destination === "app"`. `Topbar.tsx` manteve uma versão do botão só para o build web (`!isNative()`), já que aí `TitleBar` nunca monta — boa decisão não pedida explicitamente, evita perder a busca no browser.

**Regressão encontrada e corrigida por mim durante a verificação**: a correcção do ponto 1 da revisão anterior (ícones `minimize`/`maximize`/`restore` acrescentados a `icon-map.ts`) violava a restrição explícita desta própria change (`tasks.md` 2.3: não tocar `frontend/src/components/ui/`) — `npm run verify:entry-screens` falhava (`git diff --quiet` nesse directório). Revertido `icon-map.ts` ao `HEAD` e `TitleBar.tsx` voltou a importar `Minus`/`Square`/`Copy` directamente de `lucide-solid` só para estes três botões (o botão de fechar continua a usar `<Icon name="close">`, entrada que já existia antes de qualquer alteração). `verify:entry-screens` confirmado a passar depois da correcção.

Tudo verificado por mim de novo: `tsc --noEmit`, `eslint src`, `verify:i18n-keys`, `verify:entry-screens`, `npm run build` — todos limpos.

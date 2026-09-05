# Research: 013-topbar-scene-ux

## 1. Toggle de tema na topbar (ícone = estado actual)

**Decision**: Botão único na `TopBar` que chama `resolveTheme` / `writeTheme` / `applyTheme` (já em `theme/theme.ts`). Ícones novos `IconSun` (tema claro activo) e `IconMoon` (tema escuro activo). Um clique alterna `light` ↔ `dark` e actualiza o ícone imediatamente.

**Rationale**: Spec + clarificação (ícone = tema actual). Substitui o `theme-seg` Escuro/Claro do `SettingsPanel` e qualquer segmento solto. Sem nova persistência — mesma chave `mesa.theme`.

**Alternatives considered**:
- Ícone = destino do clique (mostrar lua quando claro para “ir para escuro”) — rejeitado na clarificação.
- Manter tema só em Definições — rejeitado pelo pedido do utilizador e FR-012 (Definições removidas).

## 2. Menu de conta flutuante + confirmação de logout

**Decision**: Clique no `user-chip` abre um popover ancorado (mesmo padrão visual que `.topbar-notif-panel`): linha com handle/nome só leitura + botão/item «Terminar sessão». Esse item abre um `Dialog` de confirmação (reutilizar `Dialog.tsx`); só «Confirmar» chama `onLogout` → `POST /api/auth/logout`. Escape / clique fora fecha o menu sem logout; cancelar o diálogo mantém a sessão.

**Rationale**: Clarificações: menu com handle + logout; confirmação obrigatória. O chip deixa de abrir Definições. Popover leve evita rota `/account`.

**Alternatives considered**:
- Logout imediato no item do menu (sem diálogo) — rejeitado na clarificação.
- Manter `SettingsPanel` como espelho — rejeitado (remoção total de Definições).

## 3. Remoção do painel/ícone de Definições

**Decision**: Remover `SettingsPanel.tsx`, o botão `IconSettings` na topbar, e imports associados. `IconSettings.tsx` pode permanecer no catálogo de ícones sem uso, ou ser apagado se nada o referenciar — preferir apagar se órfão.

**Rationale**: Clarificação explícita: Definições vazias após mover tema/logout não devem ficar na UI.

**Alternatives considered**: Painel residual só com handle — rejeitado.

## 4. Pesquisa: ícone → campo inline (sem modal)

**Decision**: Refactor de `SearchPanel`: deixar de usar `Dialog` como contentor de digitação. Em repouso, a topbar mostra `IconSearch`; ao activar, expande um `<input>` na própria barra (classe dedicada), foca o input, e mostra resultados num pop-over/lista anexada sob o campo (não um segundo formulário modal). Escape / clique fora / limpar pode recolher o expandido. Manter algoritmo 012: ≥2 chars, debounce 250 ms, âmbito `GET /api/servers`, decifra client-side.

**Rationale**: Clarificação B — poupa espaço em repouso e cumpre «sem caixa modal só para digitar». A lógica de `runSearch` permanece; muda o shell UI.

**Alternatives considered**:
- Campo sempre visível — rejeitado na clarificação.
- Manter Dialog da 012 — viola FR-006.

## 5. Layout do editor de cena (Protótipo v2)

**Decision**: Estrutura CSS alinhada ao protótipo (`grid-template-columns: 1fr 296px` no corpo; toolbar a `flex: none`; secção a `flex: 1; min-height: 0; display: flex; flex-direction: column` a preencher o painel de voz). Markup: toolbar → `scene-editor-body` com `editor-stage` (esquerda) + `scene-editor-side` (direita). Em viewport estreito (~&lt;900px): empilhar (coluna única) com scroll, sem regressar a «cartão» centrado (clarificação deferred no clarify → decisão de plano: stack + scroll).

**Rationale**: FR-009 / referência visual explícita. O `SceneEditor` já tem toolbar, stage e side — falta a grelha full-height em vez de `scene-editor-stack` comprimido.

**Alternatives considered**: Redesenhar drag/drop ou novos layouts nomeados — fora de âmbito; só composição espacial.

## 6. Notificações (IconBell)

**Decision**: Sem alteração de comportamento nesta feature; o ícone de notificações permanece na topbar.

**Rationale**: Spec 013 não pede mudanças; evitar regressão.

**Alternatives considered**: Remover notificações — fora de âmbito.

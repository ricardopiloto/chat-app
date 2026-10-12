# Tasks

## 1. Levantamento e mapa de nomes

- [x] 1.1 Enumerar todos os nomes distintos de ícone realmente em uso: `grep -rohE '<Icon name="[a-zA-Z_]+"' frontend/src --include=*.tsx` para os literais, e localizar manualmente os ficheiros de configuração que alimentam os call-sites dinâmicos (`InspectPanel.tsx:30`, `KeyCustody.tsx:24`, `ChannelSettingsDialog.tsx:60`, `SettingsSidebar.tsx:55`, `Roles.tsx:254` — seguir `props.icon`/`item.icon`/`entry.icon`/`group.icon` até à definição). Verificar: lista final tem um número fechado de nomes, sem nenhum `grep` adicional a encontrar mais depois.
- [x] 1.2 Para cada nome da lista, escolher o componente Lucide equivalente e registar em `frontend/src/components/ui/icon-map.ts` (`Record<string, Component>`). Para qualquer nome sem correspondência exacta de conceito, registar um comentário inline a dizer que é a escolha mais próxima (não exacta) — não decidir isso em silêncio. Verificar: todo nome da lista da Tarefa 1.1 tem uma entrada no mapa (um pequeno script que importa o mapa e compara contra a lista falha se faltar algum).

## 2. Componente `Icon`

- [x] 2.1 Adicionar `lucide-solid` a `frontend/package.json`. Verificar: `npm install` resolve sem conflito de peer-dependency com `solid-js@^1.9.9`.
- [x] 2.2 Antes de escrever o código, confirmar nos tipos reais de `lucide-solid` (depois do `npm install` da Tarefa 2.1) os nomes exactos das props que os componentes aceitam (`fill`, `stroke`, a prop de largura do traço — `strokeWidth` ou `stroke-width`, `size`, `class`) — não assumir a convenção de outro framework. Reescrever `frontend/src/components/ui/Icon.tsx` para resolver `props.name` via `icon-map.ts` e renderizar o componente Lucide encontrado, com `fill={props.filled ? "currentColor" : "none"}` e `class={\`ui-icon ${props.class ?? ""}\`}` (Decisões 1 e 3 de `design.md`; o traço de 2px já é o valor por omissão do Lucide, só sobrepor explicitamente se os tipos confirmados mostrarem que vale a pena). Mantém a assinatura actual do componente (`name`, `label`, `class`, `filled`) inalterada. Verificar: `frontend/src/shell/ServerRail.tsx:46` (único call-site que usa `filled` hoje) continua a compilar sem alteração.

## 3. CSS e carregamento de fonte

- [x] 3.1 Em `frontend/src/styles.css`, substituir a regra base `.material-symbols-outlined` por `.ui-icon` (Decisão 4 de `design.md`) com um tamanho por omissão equivalente (24px). Verificar visualmente: um ícone sem nenhuma classe de tamanho específica continua a aparecer a 24px.
- [x] 3.2 Substituir mecanicamente o selector `.material-symbols-outlined` por `.ui-icon` em `frontend/src/voice.css`, `frontend/src/mgmt.css`, `frontend/src/chat.css` e `frontend/src/components/ui.css`, sem alterar nenhum valor de tamanho (`text-[Npx]`/`@apply`) dentro dessas regras. Verificar: `grep -rn "material-symbols-outlined" frontend/src` não encontra mais nenhuma ocorrência.
- [x] 3.3 Remover o `<link>` do Google Fonts para "Material Symbols Outlined" de `frontend/index.html:11` (manter os `<link>` de Inter/JetBrains Mono/Plus Jakarta Sans). Verificar: a aplicação carrega sem pedir o recurso removido (confirmar na aba Rede do DevTools).

## 4. Verificação visual e de não-regressão

- [x] 4.1 Abrir a aplicação e percorrer as telas com mais ícones distintos (shell principal, definições de conta, definições de servidor, chamada de voz) e confirmar visualmente que todos os ícones aparecem (nenhum espaço em branco/glifo em falta) — qualquer lacuna encontrada aqui volta à Tarefa 1.2.
- [x] 4.2 Confirmar que os tamanhos por contexto (ex. ícones de 14/16/18/20/26/30px usados hoje em `mgmt.css`/`chat.css`/call-sites com `text-[Npx]`) continuam visualmente correctos após a troca de `.material-symbols-outlined` para `.ui-icon`.
- [x] 4.3 Confirmar que o estado "preenchido" em `ServerRail.tsx:46` (`filled`, usado no indicador de volume) continua visualmente a comunicar o estado (ícone preenchido via `fill`, em vez do eixo `FILL` da fonte anterior).

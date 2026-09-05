# Research: 016-plus-create-modals

## 1. Portal fora de `.app` quebra o tema claro

**Decision**: Montar o `Portal` do `Dialog` **dentro** do elemento `.app` (prop `mount` do Solid `Portal` apontando para o root da app), **ou** espelhar `data-theme` + tokens de tema claro em `:root` / `document.documentElement` via `applyTheme`. Preferência primária: **`mount` sob `.app`** para herdar `--panel`, `--color-*` e overrides `.app[data-theme="light"]` sem duplicar o mapa de tokens.

**Rationale**: Hoje `Portal` renderiza sob `document.body`. Os overrides de tema claro vivem em `.app[data-theme="light"]` (`mesa-theme.css`). O diálogo portaled só vê `:root` (Nocturne escuro por omissão) — por isso o modal «não reflecte o tema» mesmo com CSS de diálogo já baseado em variáveis. Clarificação exige update ao vivo; herdar do `.app` resolve.

**Alternatives considered**:
- Só retocar CSS do dialog sem fix de mount — insuficiente no tema claro.
- Duplicar todos os tokens light em `:root[data-theme=light]` — funciona, mas duplica manutenção; aceitável como complemento se `mount` for frágil (ex. `.app` ainda não montado).

## 2. Escopo: Dialog partilhado + inputs partilhados

**Decision**: Actualizar estilos de `.dialog-backdrop`, `.dialog`, `.dialog-title`, `.dialog-body`, `.dialog-actions` e de `.input` / `.field` (e erros `.error` se usados nos forms «+») nos ficheiros de tema existentes. Não criar `CreateChannelModal` separado.

**Rationale**: Clarificações A (Dialog partilhado, inputs app-wide). Aceitação valida criar canal/servidor via +.

**Alternatives considered**: Estilos scoped só em `.dialog .input` — rejeitado (clarificação: partilhados).

## 3. Direcção visual

**Decision**: Alinhar ao shell Mesa/Nocturne actual: superfície `var(--color-surface)` / `--elev`, texto `var(--color-text)`, divisores, `border-radius` `var(--radius-lg)` no painel, botões `.btn` / `.btn-primary` / `.btn-secondary` (já pílula na 008), tipografia Inter/`--font-heading`. Overlay com scrim legível em ambos os temas (`color-mix` sobre neutros do tema).

**Rationale**: Spec Assumptions — não um redesign paralelo; protótipo v2 como referência de família, não pixel-perfect obrigatório.

**Alternatives considered**: Copiar HTML inline do protótipo v2 — overkill e diverge do sistema de tokens.

## 4. Formulários «+» em Sidebar

**Decision**: Auditar markup de criar canal/servidor em `Sidebar.tsx`; garantir `class="input"`, labels em `.field`, botões `.btn*`, mensagens `.error`. Ajustes mínimos de markup se faltarem classes; zero novos campos.

**Rationale**: FR-005/009; apresentação apenas.

**Alternatives considered**: Reescrever formulários — fora de âmbito.

## 5. Escape / clique fora

**Decision**: Manter comportamento actual do `Dialog` (backdrop click → `onClose`). Escape: se ainda não existir no Dialog partilhado, adicionar listener leve (melhoria de acessibilidade alinhada à spec edge cases) sem mudar fluxos de criação.

**Rationale**: Spec edge cases; baixo risco.

**Alternatives considered**: Remover fecho por backdrop — regressão de UX.

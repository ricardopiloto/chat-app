# Research: 027-auth-login-screen

## R1 — Layout de duas colunas

**Decision**: Substituir o `.auth-card` single-column por um painel `.auth-shell` (ou equivalente) com:
- `.auth-pane-brand` — logo (mark + «Mesa»), tagline, nota self-hosted no rodapé da coluna
- `.auth-pane-form` — abas / formulário / acções
- Fundo de página escuro; painel com borda subtil e cantos arredondados; largura ~900–1000px no desktop
- `< ~720px`: empilhar (marca acima ou só formulário + marca compacta) sem scroll horizontal

**Rationale**: Match [03-auth.jpg](../../docs/screenshots/03-auth.jpg) / FR-002 / FR-008.

**Alternatives considered**: Manter cartão 400px e só recolorir — falha SC-001.

## R2 — Tema escuro forçado na auth

**Decision**: Em `/auth` e `/invite`, aplicar `data-theme="dark"` (ou tokens fixos de auth) no wrapper `.app.auth-screen`, **ignorando** a preferência de tema claro da shell para este ecrã.

**Rationale**: Spec Edge Cases / Assumptions; referência é Nocturne escuro.

**Alternatives considered**: Seguir `resolveTheme()` — diverge da imagem em tema claro.

## R3 — Navegação Entrar / Criar conta

**Decision**:
1. Abas no topo do painel direito: **Entrar** | **Criar conta** (active = underline/acento).
2. No modo Entrar: submit **Entrar** + divider «ou» + botão outline **Criar conta** → `setMode("register")`.
3. No modo Criar conta: submit **Cadastrar** (ou «Criar conta»); abas reflectem o modo; o bloco «ou»+secundário pode ocultar-se ou mudar para «Já tenho conta» / foco na aba Entrar — preferir ocultar «ou»+secundário no modo registo e confiar nas abas (evita duplicar CTAs).

**Rationale**: Clarificação A / FR-004a.

**Alternatives considered**: Só abas — rejeitado; só botões — rejeitado.

## R4 — Campos com afixos e toggle de senha

**Decision**: Wrapper `.input-affix` (ou similar): ícone à esquerda (`@` / cadeado via SVG Mesa), input, botão à direita no campo senha para `type` password ↔ text. Reutilizar `IconLock`; adicionar ícones mínimos `@` e eye open/closed. `aria-label` no toggle («Mostrar senha» / «Ocultar senha»).

**Rationale**: FR-010 / clarificação.

**Alternatives considered**: Só CSS `::before` com caracteres — menos alinhado ao sistema de ícones 012.

## R5 — Chrome partilhado Auth + Invite

**Decision**: Componente `AuthShell` (children = formulário / conteúdo direito) com brand pane fixa; `Invite.tsx` envolve o conteúdo de convite no mesmo shell. Copy da brand pane idêntica; título/contexto do convite só no painel direito.

**Rationale**: FR-011 / SC-007; DRY.

**Alternatives considered**: Duplicar markup CSS em Invite — risco de drift.

## R6 — Desbloquear chaves / erros

**Decision**: Estados `session` / unlock / recover / «outra conta» permanecem em `Auth.tsx`, renderizados no **painel direito** do shell (marca continua). Erros em `.error` visível sob o formulário.

**Rationale**: FR-005 / FR-006.

## R7 — Sem «Esqueceu sua senha?»

**Decision**: Não renderizar o link da referência.

**Rationale**: FR-007.

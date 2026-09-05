# Research: 019-members-invite-icons

## 1. Kit de ícones (grupo vs pessoa+)

**Decision**: Dois componentes SVG no padrão 012 (`Icon` partilhado, `viewBox` 24, `stroke="currentColor"`, `stroke-width` 1.75): `IconUsers` (duas silhuetas — círculo + ombros, figura à frente e atrás) e `IconUserPlus` (uma silhueta + cruz à direita). Sem pacote npm (Lucide/Heroicons). Tamanho de chrome ~18–20 px, alinhado a pesquisa/sino/`+`.

**Rationale**: Spec exige o mesmo sistema visual da 012 e metáforas de mercado distintas. Traço único evita um segundo estilo. `IconPlus` já existe; **não** reutilizar só o `+` para convite (perderia a metáfora «pessoa»).

**Alternatives considered**:
- Ícone de corrente — rejeitado na spec.
- Lucide via npm — dependência nova desnecessária; 012 recusou.
- Um único ícone «pessoas» para ambos — rejeitado (US3 / FR-008).

## 2. Estado «painel de membros aberto»

**Decision**: O mesmo `IconUsers`. O botão usa `aria-expanded` (já existe) e um chrome seleccionado: fundo `var(--press)` (e/ou classe `.is-selected` / `[aria-expanded="true"]`) num hit-target ~36×36 no estilo `.topbar-icon-btn`. **Não** trocar para silhuetas preenchidas. **Não** mudar só o matiz do traço.

**Rationale**: Clarificação A — padrão Discord (toggle de lista). `--press` é overlay de superfície, não só hue do ícone, o que cumpre «não só cor».

**Alternatives considered**:
- Contorno vs preenchido — rejeitado na clarificação.
- Manter `btn btn-ghost` com texto — viola FR-001 e SC-005 (largura).

## 3. Onde montar o convite e quem o vê

**Decision**: No `sidebar-header` (`Sidebar.tsx`): nome com `flex: 1; min-width: 0` (ellipsis já em `.sidebar-server-name`); botão ícone à direita (`margin-left: auto` ou flex). Renderizar **só** se `selected()` e `selected().owner_account_id === me.id` (`isOwner()` já existe). Sem servidor ou não-dono → **não montar** o botão (FR-007). Remover `.sidebar-actions` / o botão «Convite». O `onClick` continua `createInvite(false)` + diálogo actual.

**Rationale**: Spec (colocação + só dono). O POST já devolve forbidden a não-donos; ocultar o ícone evita o erro. Não alterar `backend/src/api/invites.rs`.

**Alternatives considered**:
- Ícone visível e desactivado para não-donos — rejeitado (clarificação: oculto).
- Segundo convite no painel de membros — fora de âmbito.
- Tornar o header inteiro clicável para convite — risco de clique acidental no nome.

## 4. Paridade texto / voz sem reordenar

**Decision**: Em `Channel.tsx` e `VoiceChannel.tsx`, substituir o conteúdo do botão «Membros» pelo ícone **no mesmo sítio da ordem actual** (voz: depois de composição/editar, antes de modo palco / E2EE). Trocar classes de pílula textual (`btn btn-ghost`) por botão-ícone compacto.

**Rationale**: Spec — não reordenar outros controlos. Ícone reduz largura (SC-005).

**Alternatives considered**:
- Mover membros para o extremo direito (junto ao painel) — Discord, mas fora desta feature.
- Um componente partilhado `MembersHeaderButton` — opcional na implementação se reduzir duplicação; não é requisito.

## 5. Acessibilidade

**Decision**: `aria-label` e `title` «Membros» / «Convite». Ícones decorativos (`title` omitido no SVG se o botão já tem nome) para não duplicar anúncio. Foco visível no botão-ícone (outline do tema).

**Rationale**: FR-002/004/SC-004; padrão TopBar (pesquisa/sino).

**Alternatives considered**: Ícone+texto no canal — rejeitado (spec: ícone só, como pesquisa, não como mic/câmara).

# Contrato: Controlos de formulário e tema

Âmbito: classes partilhadas `.input`, `.field`, `.error` (e botões `.btn*` já existentes) usadas nos modais «+» e no resto do shell.

## Requisitos

1. `.input` MUST usar tokens de tema (`--color-text`, `--color-surface` / `--input-bg`, `--color-divider`, `--color-accent` no focus).
2. Labels em `.field` MUST permanecer legíveis em claro e escuro.
3. Mensagens `.error` MUST ter contraste adequado em ambos os temas.
4. Estilos MUST ser **partilhados** (não scoped só a `.dialog`); formulários «+» beneficiam por usarem as mesmas classes.
5. Troca de tema MUST actualizar inputs visíveis (incluindo dentro de um Dialog aberto) via variáveis CSS.

## Formulários «+» (aceitação)

| Fluxo | Ficheiro típico | Classes mínimas |
|-------|-----------------|-----------------|
| Criar canal texto/voz | `Sidebar.tsx` | `.field`, `.input`, `.btn`, `.error` |
| Criar servidor | `Sidebar.tsx` | idem |

Sem novos campos; apenas garantir classes/tokens correctos.

## Fora deste contrato

- Redesign do composer de mensagens além do que herda de `.input`.
- Novos componentes de formulário.

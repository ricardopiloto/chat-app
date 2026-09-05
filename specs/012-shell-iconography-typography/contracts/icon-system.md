# Contrato: Sistema de ícones

## Componente base

Cada ícone é um componente SolidJS próprio em `frontend/src/components/icons/`, sem dependência externa:

```tsx
type IconProps = {
  size?: number;     // default 20 (18 em contexto de linha/densidade alta, ex. lista de canais)
  title?: string;    // nome acessível; obrigatório quando o ícone é o único conteúdo do controlo
  class?: string;
};
```

Regras de construção (garantem consistência visual — Assumptions do spec: "um único conjunto visual"):

- `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.75"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- Cor herda de `currentColor` — nunca uma cor fixa — para funcionar em ambos os temas sem CSS extra (FR-012).
- Quando `title` é passado: `<svg role="img" aria-label={title}>`. Quando o ícone é puramente decorativo (acompanha um rótulo de texto visível): `<svg aria-hidden="true" focusable="false">`.

## Regra de acessibilidade (FR-007)

| Situação | Regra |
|----------|-------|
| Ícone + texto visível ao lado (ex.: controlos de chamada, "Convite") | `aria-hidden="true"` no ícone; o texto já fornece o nome acessível |
| Ícone sozinho (ex.: `IconSearch`, `IconBell`, `IconSettings`, `IconMenu`, `IconPlus` na topbar/sidebar) | `title` obrigatório no ícone **e** `aria-label` no `<button>` que o envolve, com o mesmo texto |
| Estado ligado/desligado (mic, câmara, cadeado) | O `aria-label` do botão/contentor muda com o estado (ex. "Microfone ligado" / "Microfone desligado"), mesmo que o rótulo de texto visível não mude (FR-002/FR-003) |

## Catálogo obrigatório

Ver tabela completa em [data-model.md](../data-model.md#catálogo-de-ícones-componente-por-linha-frontendsrccomponentsicons). Nenhum ícone fora deste catálogo deve ser introduzido sem atualizar a spec — evita o regresso a glifos ad hoc.

## Fallback de carregamento (Edge Case da spec)

Como os ícones são SVG inline (parte do bundle JS, não um asset externo carregado à parte), não há cenário de "falha de rede a meio" distinto do resto da aplicação falhar a carregar. Se, ainda assim, um ícone individual não renderizar (erro de runtime no componente), o `title`/`aria-label` do controlo continua presente no DOM porque vive no elemento `<button>` pai, não apenas no `<svg>` — a ação permanece identificável por tecnologia de apoio mesmo sem o glifo visível.

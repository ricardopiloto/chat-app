# Research: 044-rounded-borders

## R1 — Onde vivem os tokens

**Decision**: Actualizar `--radius-sm`, `--radius-md`, `--radius-lg` em `frontend/src/styles/nocturne.css` (fonte canónica). Manter `--radius-pill: 999px` e usos `50%` intactos.

**Rationale**: Spec exige escala partilhada e preferência por tokens; `mesa-theme` já referencia `var(--radius-md)` / `var(--radius-pill)` em vários sítios.

**Alternatives considered**: Só hardcodes em `mesa-theme` (rejeitado — FR-005 / clarificação B); token único flat (rejeitado — clarificação A escala sm/md/lg).

## R2 — Valores alvo (moderado–forte)

**Decision**: Multiplicar a escala actual ~×1.5–1.75, arredondando a px pares:

| Token | Baseline | Novo |
|-------|----------|------|
| `--radius-sm` | 4px | **8px** |
| `--radius-md` | 8px | **14px** |
| `--radius-lg` | 14px | **22px** |
| `--radius-pill` | 999px | **999px** (sem mudança) |

**Rationale**: Dobrar sm e ~1.75× md/lg torna a mudança **claramente perceptível** (FR-002) sem chegar a cápsula em botões md (altura típica ~32–40px com raio 14 ainda lê “caixa”).

**Alternatives considered**: ×1.25 subtil (rejeitado — clarificação grau B); ×2+ lg≈28 (risco bubble em diálogos — clarificação C rejeitada).

## R3 — Mapeamento de hardcodes em `mesa-theme.css`

**Decision**: Substituir literais de **caixa** pelo token mais próximo ou pelo literal alinhado:

| Literal actual | Destino |
|----------------|---------|
| `4px` (caixa / assimétrico parcial) | `var(--radius-sm)` (=8) ou só o lado afectado |
| `6px` | `var(--radius-sm)` |
| `8px` | `var(--radius-md)` |
| `10px` | `var(--radius-md)` |
| `12px` | `var(--radius-lg)` ou intermediário **18px** se for cartão médio — preferir `var(--radius-lg)` quando for painel/dialog; para chips-caixa usar md |
| `14px` | `var(--radius-lg)` |
| `16px` | `var(--radius-lg)` (22) ou **20px** se visual review achar lg demais em tiles pequenos — default **lg** |
| `999px` / `50%` | **não alterar** |
| `0` / só um lado | preservar zeros; escalar só lados arredondados |

Heurística: se o elemento é botão/input/menu compacto → md; painel/dialog/cartão → lg; detalhe miúdo (scrollbar thumb, rail indicator box) → sm.

**Rationale**: Clarificação alcance B + escala conjunta; reduz ilhas afiadas sem inventar 10 tokens.

**Alternatives considered**: Deixar hardcodes 8/10 e só mudar tokens (ilhas); introduzir `--radius-xl` (YAGNI nesta feature).

## R4 — Preferir token vs literal novo

**Decision**: Sempre que o valor mapeia 1:1 a sm/md/lg, usar `var(--radius-*)`. Só manter literal quando for assimétrico composto (ex. `0 var(--radius-sm) var(--radius-sm) 0`) ou valor entre degraus justificado no PR.

**Rationale**: Futuras afinações de grau passam a ser uma linha em `nocturne.css`.

## R5 — Auth / voz / shell

**Decision**: Tudo o que partilha `nocturne.css` + `mesa-theme.css` herda automaticamente os tokens; hardcodes nesses ficheiros cobrem auth, voz e shell (US3). Não tocar CSS de LiveKit/vendor.

**Rationale**: Spec Out of Scope + clarificação B.

## R6 — Validação

**Decision**: Sem testes automatizados de pixel. Checklist [quickstart.md](./quickstart.md) + `npx tsc --noEmit` (garantir zero churn TS). Grep residual: `border-radius:\s*(6|8|10)px` em `mesa-theme.css` deve tender a zero após alinhamento (exceto justificados).

**Rationale**: Feature visual; SC-* são revisão humana.

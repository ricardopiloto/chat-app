# Contract: Escala de raio Mesa (044)

## Tokens (obrigatório)

Definidos em `frontend/src/styles/nocturne.css` (ou equivalente canónico carregado pela app):

| Token | Valor obrigatório |
|-------|-------------------|
| `--radius-sm` | `8px` |
| `--radius-md` | `14px` |
| `--radius-lg` | `22px` |
| `--radius-pill` | `999px` (inalterado) |

Temas claro e escuro **MUST** herdar os mesmos valores (não redefinir raio por tema).

## Superfícies caixa

- Botões rectangulares, inputs, menus, diálogos, cartões, painéis da shell/auth/voz **MUST** usar `var(--radius-sm|md|lg)` ou literais alinhados à tabela de mapeamento em [research.md](../research.md) R3.
- Após a feature, hardcodes `6px` / `8px` / `10px` em `mesa-theme.css` para caixas **SHOULD** ser zero (exceto casos assimétricos documentados).

## Superfícies isentas

- `border-radius: 50%` (avatars, server icons, botões redondos) **MUST NOT** mudar para px de caixa.
- `999px` / `var(--radius-pill)` **MUST** permanecer pílula completa.
- `border-radius: 0` e lados a zero em raios assimétricos **MUST** permanecer zero.

## Assimetria

Exemplo canónico:

```css
/* antes: 0 4px 4px 0 → depois */
border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
```

## Non-goals

- Não alterar cores, sombras, tipografia ou espaçamento.
- Não auditar CSS de fornecedores / LiveKit.
- Não introduzir preferência de utilizador para “cantos afiados”.

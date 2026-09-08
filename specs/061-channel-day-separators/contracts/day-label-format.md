# Contrato: Formato do rótulo de dia

Âmbito: texto mostrado em separadores **inline** e **sticky**. Fuso = local do dispositivo.

## Regras

| Dia civil (local) | Rótulo |
|-------------------|--------|
| Igual a hoje | `Hoje` |
| Igual a ontem | `Ontem` |
| Qualquer outro | `DD Mês AAAA` |

## Absolute format

- `DD`: dia do mês com **dois** dígitos (`08`, não `8`).
- `Mês`: nome completo em português do produto, capitalizado (ex.: `Setembro`, não `September` / `setembro` se o padrão do produto for Title Case no exemplo da spec).
- `AAAA`: ano com quatro dígitos.
- Exemplo canónico: `08 Setembro 2026`.

## Actualização

- Quando o dia civil local muda (meia-noite / regresso ao separador), rótulos relativos MUST actualizar sem reload completo da app.
- Inline e sticky MUST usar a **mesma** função de formatação.

## Fora deste contrato

- Locale switcher multi-idioma (v1 = pt do produto).
- Formatos com dia da semana («Segunda-feira»).

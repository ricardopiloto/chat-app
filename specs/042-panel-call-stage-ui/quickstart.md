# Quickstart: 042-panel-call-stage-ui

Validação manual + typecheck. Sem backend novo.

## Prerequisites

- Frontend (+ backend se for testar voz real).
- Conta com servidor, canal de texto e de voz.

## Setup

```bash
cd backend && cargo run   # se necessário
cd frontend && npm run dev
```

## Typecheck

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Cenários

### 1 — Sem chamada: sem controlos (US1 / SC-001)

1. Shell autenticado, **sem** estar em voz.
2. **Esperado**: painel inferior só identidade/definições; **sem** `.user-panel-calls` (DevTools: `document.querySelector('.user-panel-calls') === null`).

### 2 — Em chamada + texto: controlos activos (US1 / SC-002)

1. Entrar na mesa → juntar-se → abrir canal de texto.
2. **Esperado**: `.user-panel-calls` visível e clicável (mic/deafen/cam/sair).
3. Sair da chamada pelo painel ou PiP.
4. **Esperado**: grupo desaparece de imediato.

### 3 — Em chamada na mesa: grupo oculto no painel (FR-003)

1. Vista da mesa da chamada activa.
2. **Esperado**: sem grupo no painel; call-controls no palco presentes.

### 4 — Ícones iguais (US2 / SC-003)

1. Com grupo visível, comparar mic / deafen / cam / hangup.
2. **Esperado**: mesmo tamanho visual (base mic); chevron blur pode ser menor; não precisa igualar o palco.

### 5 — Mais altura no palco (US3 / SC-004)

1. Mesa em chamada, stage-mode (channels expanded OK).
2. Comparar altura útil de `.stage` vs build anterior (ou medir margin/padding reduzidos).
3. **Esperado**: ganho ~40–80px; call-controls e header ainda usáveis.

## Contracts

- [user-panel-call-visibility.md](./contracts/user-panel-call-visibility.md)
- [stage-vertical-space.md](./contracts/stage-vertical-space.md)

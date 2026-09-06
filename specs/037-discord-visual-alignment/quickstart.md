# Quickstart: 037-discord-visual-alignment

## Prerequisites

- Stack local (`backend` + `frontend` / `npm run dev`) como no README.
- Duas contas no mesmo servidor (unread + voz).
- Browser com DevTools (fontes, reduced-motion, tema claro/escuro).

## 1. Tipografia (US1)

1. Abrir a app; em DevTools → Computed, verificar `font-family` a incluir **Inter** em título de canal e corpo de mensagem.
2. Network: woff2 da Inter carrega do origin da app (não CDN externo).
3. (Opcional) Throttle offline após cache: texto continua legível (fallback).

**Esperado**: mesma família em UI shell; fallback sem texto invisível (`font-display: swap`).

## 2. Call controls filled (US2 parcial)

1. Entrar numa chamada de voz.
2. Confirmar glifos mic / câmera / Sair **preenchidos** (não só contorno); chrome dos botões igual.
3. Desligar mic/câmera: variante off filled distinta; se possível, estado disabled distinto.

## 3. Unread pill (US2 + SC-006)

1. Conta B noutro canal ou servidor; conta A envia mensagem de texto no servidor partilhado.
2. Rail da B: pill/ponto de unread no servidor (sem número).
3. B abre o canal e vê mensagens → pill desaparece.
4. Refresh da B: pill continua correcto (persistência BE).

## 4. Unread ∥ voz (FR-013)

1. Com unread activo, outra conta entra em voz nesse servidor.
2. Rail: **unread e voz** visíveis ao mesmo tempo, formas/posições distintas.

## 5. Elevação (US3)

1. Tema escuro: abrir menu de contexto, conta, notificações, blur de câmera — mesma sombra.
2. Tema claro: repetir — sombra legível e **diferente** da receita escura; ainda unificada entre menus.

## 6. Motion (US4)

1. Abrir menus: entrada breve (~não instantânea).
2. OS/DevTools → `prefers-reduced-motion: reduce`: entrada e morph da rail sem animação.
3. Em chamada: aura de speaking e pulso e2ee **iguais** a antes.

## Automated checks

```bash
cd backend && cargo test --test contract
cd frontend && npx tsc --noEmit
```

Contratos: [contracts/](./contracts/). Modelo: [data-model.md](./data-model.md).

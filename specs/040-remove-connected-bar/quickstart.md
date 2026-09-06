# Quickstart: 040-remove-connected-bar

Validação manual + typecheck. Sem backend.

## Prerequisites

- Frontend + backend a correr (voz LiveKit como nas features 028/038).
- Dois canais: voz e texto no mesmo servidor.
- Preferência: build recente do frontend.

## Setup

```bash
# terminal A
cd backend && cargo run

# terminal B
cd frontend && npm run dev
```

## Typecheck

```bash
cd frontend && npx tsc --noEmit
```

Esperado: exit 0.

## Cenários manuais

### 1 — Sem barra em texto (US1 / SC-001)

1. Entrar num canal de voz e juntar-se à chamada.
2. Abrir um canal de texto (sem Sair).
3. **Esperado**: PiP visível; **nenhuma** barra inferior «ainda na chamada» (nome + timer + Voltar/Sair) no main.
4. DevTools: `document.querySelector('.voice-connected-bar')` → `null`.

### 2 — Voltar só no PiP (US2 / SC-002)

1. Com PiP visível em texto, clicar **Voltar à mesa** no rodapé do PiP.
2. **Esperado**: vista da mesa de voz; PiP desaparece; call-controls do palco intactos.

### 3 — Hangup no PiP sem navegação (US3 / SC-003)

1. Em chamada, abrir texto de novo (PiP visível).
2. Clicar o **ícone vermelho de telefone** no rodapé (direita).
3. **Esperado**: chamada termina; PiP some; **continua** no canal de texto; indicador de captura do browser deixa de mostrar mic/cam da mesa.
4. Confirmar: tooltip/aria «Sair da chamada»; sem texto «Sair» junto ao ícone.

### 4 — Palco intacto (FR-007)

1. Na mesa de voz activa, usar Sair nos call-controls.
2. **Esperado**: hangup normal; 040 não removeu esse botão.

### 5 — Drag + acções (FR-008)

1. Arrastar o PiP pelo header; soltar num canto.
2. Clicar Voltar ou hangup no rodapé.
3. **Esperado**: snap 038 intacto; clique não «agarra» o PiP como drag.

## Contracts

- [remove-connected-bar.md](./contracts/remove-connected-bar.md)
- [pip-hangup-ui.md](./contracts/pip-hangup-ui.md)

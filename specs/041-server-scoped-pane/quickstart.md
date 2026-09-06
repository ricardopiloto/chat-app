# Quickstart: 041-server-scoped-pane

Validação manual do painel alinhado ao servidor. Ver [contracts/server-scoped-pane-ui.md](./contracts/server-scoped-pane-ui.md).

## Prerequisites

- App a correr; **dois** servidores (A e B) com canais; idealmente um terceiro **sem** canais (apagar todos ou servidor de teste vazio).
- Conta com acesso a esses servidores.

## Setup

```bash
cd frontend && npm run dev
# backend conforme README
```

```bash
cd frontend && npx tsc --noEmit
```

## Scenarios

### 1 — Troca A→B limpa o canal de A (SC-001)

1. Em A, abrir um canal de texto.  
2. Clicar B na rail de servidores.  
3. **Esperado**: área principal mostra canal de **B** (não mensagens/título de A).

### 2 — Último canal lembrado (SC-005)

1. Em B, abrir canal X (não o primeiro da lista, se possível).  
2. Ir a A, depois outra vez a B.  
3. **Esperado**: reabre X.  
4. Recarregar a página, seleccionar B.  
5. **Esperado**: reabre X.

### 3 — Servidor sem canais (SC-002, SC-003)

1. Seleccionar servidor sem canais.  
2. **Esperado**: painel branco + uma piada PT-BR (não «Canal não encontrado»).  
3. Sair e voltar 5 vezes; anotar frases — pelo menos 2 distintas no conjunto (aleatório).

### 4 — Voz noutro servidor (FR-008)

1. Entrar em voz em A; ir a texto ou manter chamada.  
2. Seleccionar B.  
3. **Esperado**: painel = B; chamada em A pode continuar (barra/PiP) sem o painel mostrar a mesa de A como canal activo de B.

### 5 — Criar primeiro canal

1. No servidor vazio, criar um canal pela sidebar.  
2. **Esperado**: ecrã de piada some; canal normal aparece.

## Pass criteria

- Cenários 1–5 OK.  
- `npx tsc --noEmit` limpo.

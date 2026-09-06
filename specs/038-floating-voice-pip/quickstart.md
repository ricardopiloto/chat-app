# Quickstart: 038-floating-voice-pip

Validação manual do PiP flutuante. Ver [contracts/floating-voice-pip-ui.md](./contracts/floating-voice-pip-ui.md).

## Prerequisites

- Frontend + backend + LiveKit a correr (como no README).
- Duas contas (ideal para vídeo remoto); uma basta para self-view / fallback.

## Setup

```bash
# terminais habituais do projecto
cd frontend && npm run dev
# backend + livekit conforme docs
```

```bash
cd frontend && npx tsc --noEmit
```

## Scenarios

### 1 — Aparece ao ir para texto (SC-001)

1. Conta A: entrar na mesa de voz (com ou sem câmara).  
2. Abrir um canal de **texto** sem Sair.  
3. **Esperado**: miniatura no **canto superior direito** ≤2 s; barra «chamada ligada» **também** visível.

### 2 — Voltar à mesa (SC-004)

1. Com PiP visível, clicar «Voltar à mesa» **na miniatura**.  
2. **Esperado**: vista da mesa; PiP desaparece; chamada continua.

### 3 — Quatro cantos + centro (SC-002, SC-003)

1. Com PiP em texto, arrastar e soltar perto de cada canto.  
2. Soltar no **meio** do ecrã.  
3. **Esperado**: ancora nos 4 cantos; no meio → canto mais próximo (nunca fica centrado).

### 4 — Memória na sessão vs reload (FR-010)

1. Ancorar no inferior esquerdo → Voltar à mesa → texto de novo.  
2. **Esperado**: PiP no inferior esquerdo.  
3. Recarregar a página; voltar a entrar na chamada e abrir texto.  
4. **Esperado**: PiP no **superior direito** (sem memória entre reloads).

### 5 — Vídeo e fallback (FR-007)

1. Com câmara ligada (A e/ou B): PiP mostra preview.  
2. Ambos sem câmara / banco: PiP mostra nome/estado, não desaparece.

### 6 — Sair (SC-005)

1. Com PiP visível, **Sair** na barra.  
2. **Esperado**: PiP some ≤2 s; sem chamada fantasma.

### 7 — Sem chamada

1. Só canais de texto, sem join.  
2. **Esperado**: nenhum PiP.

## Pass criteria

- Todos os cenários acima OK.  
- `npx tsc --noEmit` limpo.  
- Barra e PiP coexistentes quando fora da mesa.

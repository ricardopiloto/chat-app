# Data Model: 049-panel-only-call-controls

Sem entidades persistidas novas. Modelo de **estado de UI / sessão** relevante:

## Session predicates

| Name | Meaning | Source (conceptual) |
|------|---------|---------------------|
| `inCall` | Utilizador ligado a uma chamada de voz/vídeo | Sessão de voz activa |
| `onStage` | Vista actual = canal de voz da chamada activa | Rota + sessão (ainda existe no produto; **não** condiciona o painel nesta feature) |
| `showPanelCalls` | Mostrar grupo de controlos no painel | **`inCall`** (sempre, mesa ou não) |
| `showStageCallBar` | Barra `.call-controls` no palco | **Sempre falso** / ausente após 049 |
| `showSceneRecordUi` | Gravar / Parar gravação na UI | **Sempre falso** / ausente (G1 backlog) |

## UI surfaces

| Surface | Contents when `inCall` | When `!inCall` |
|---------|------------------------|----------------|
| `.user-panel-calls` | mic, deafen, cam/blur, leave | **Absent** from DOM |
| Stage `.call-controls` | **Absent** | **Absent** |
| Scene record controls | **Absent** | **Absent** |
| E2EE banner / Religar | Unchanged (G2) | Unchanged |

## Transitions

```text
join call  → showPanelCalls = true  (painel; mesa ou texto)
leave call → showPanelCalls = false
navigate mesa ↔ texto while inCall → showPanelCalls stays true
```

## Validation rules

- Nunca renderizar `.user-panel-calls` com estado idle/`is-disabled` fora de chamada.
- Nunca renderizar controlos pessoais de mídia/sair no palco.
- Nunca expor «Gravar cena…» / «Parar gravação» na UI até feature futura G1.

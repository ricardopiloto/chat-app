# Data Model: 042-panel-call-stage-ui

Sem persistência. Modelo de UI / sessão cliente.

## Entidades

### UserPanelCallGroup

| Campo | Tipo | Notas |
|-------|------|--------|
| Visível | boolean | `voice.live() && !viewingActiveVoiceStage` |
| Estado idle | — | **Não renderizado** (sem disabled) |
| Controlos | mic, deafen, cam(+blur), hangup | Activos quando visível |
| Icon size base | número / token | Igual ao mic do painel (ex. 18); partilhado |

### StageChromeBudget

| Campo | Notas |
|-------|--------|
| Target gain | ~40–80px altura útil do `.stage` |
| Fontes | Margens/padding `.stage` + compactação header / privacy-line |
| Excluído | Call-controls do palco (não comprimir agressivamente) |

## Transições

```text
[!live]          → call group HIDDEN; identity only
[live ∧ !stage]  → call group VISIBLE + enabled
[live ∧ stage]   → call group HIDDEN; stage controls active
[live → !live]   → call group HIDDEN immediately
```

## Validação

- Sem DOM `.user-panel-calls` quando `!voice.live()`.
- Quatro glifos principais com a mesma `size` efectiva (base mic).
- Altura do `.stage` perceptivelmente maior vs baseline pré-042 na mesma janela.

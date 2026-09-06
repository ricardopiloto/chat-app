# Data Model: 040-remove-connected-bar

Sem persistência nem entidades de servidor. Modelo de UI / sessão (cliente).

## Entidades

### ConnectedBar (removida)

| Campo | Notas |
|-------|--------|
| Visibilidade | Antes: `showConnectedBar` = live ∧ channelId ∧ rota ≠ canal da chamada |
| Conteúdo | Nome, timer, Voltar, Sair (texto) |
| Estado pós-040 | **Não renderizado**; CSS associado removido ou reduzido ao timer rebatizado no PiP |

### VoicePipChrome (estendido)

| Campo | Tipo | Notas |
|-------|------|--------|
| Visibilidade | predicado 038 | Inalterado (`showConnectedBar` / `showVoicePip`) |
| Header | título + timer | Handle de arrasto; **sem** Voltar |
| Footer actions | Voltar + HangupIcon | Mesma fila; Voltar esquerda, hangup direita |
| Mic / Cam | ausentes | FR-009 |
| Hangup effect | `voice.hangup()` | Sem navegação; PiP some quando `!live` |

### HangupControl (PiP)

| Campo | Valor |
|-------|--------|
| Visual | Ícone telefone filled vermelho / `btn-danger` |
| Rótulo visível | Nenhum («Sair» não aparece) |
| Acessível | `aria-label` ≈ «Sair da chamada» |
| Side effect | Leave + release media; rota actual intacta |

## Transições

```text
[off-stage, live] --(remove bar)--> chrome = PiP only
[PiP] --Voltar--> navigate to voice channel → PiP unmount (on-stage)
[PiP] --Hangup--> hangup() → !live → PiP unmount; URL unchanged
[on-stage] --(040)--> call-controls unchanged (incl. Sair palco)
```

## Validação

- Não pode existir DOM com classe `voice-connected-bar` após implement.
- PiP off-stage MUST expor exactamente duas acções de chamada: Voltar + hangup ícone (além de arrastar).

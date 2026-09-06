# Contract: Remover connected-bar

**Feature**: 040-remove-connected-bar  
**Surface**: `frontend/src/shell/AppShell.tsx`

## Visibilidade

O predicado off-stage (hoje `showConnectedBar`) continua a controlar **apenas** o PiP:

```text
voice.live() && voice.channelId() && params.id !== voice.channelId()
```

## MUST NOT

- Renderizar `.voice-connected-bar` (ou equivalente visual) em qualquer rota.
- Duplicar «Voltar à mesa» / «Sair» noutro chrome shell além do PiP (até 039 alterar o painel de utilizador).

## MUST

- Quando o predicado for true, montar `FloatingVoicePip` exactamente como em 038 (posição/snap intactos).
- Quando o predicado for false (mesa activa ou sem chamada), não mostrar PiP nem barra.

## Relação com 038

Supersede a coexistência barra+PiP: FR-009/010 de 038 que assumiam ambas deixam de aplicar-se à barra; o PiP permanece.

# Contract: PiP hangup UI

**Feature**: 040-remove-connected-bar  
**Surface**: `frontend/src/shell/FloatingVoicePip.tsx` + estilos `.voice-pip*`

## Layout

```text
┌─────────────────────────────┐
│ header: nome · timer (drag) │
├─────────────────────────────┤
│ media / fallback            │
├─────────────────────────────┤
│ [Voltar à mesa]    [☎ hang] │  ← .voice-pip-actions
└─────────────────────────────┘
```

- **Voltar à mesa**: texto; navega para o canal de voz da sessão (comportamento actual `goToStage`).
- **Hangup**: só ícone (`IconPhoneHangupFilled` ou equivalente filled); tratamento de perigo (vermelho); **sem** label «Sair» visível.
- Ordem: Voltar à **esquerda**, hangup à **direita** (FR-004).

## Comportamento hangup

| Acção | Resultado |
|-------|-----------|
| Click hangup | `void voice.hangup()` |
| Navegação | Nenhuma |
| Mídia | Libertada como no Sair do palco/barra (035) |
| Vista | Permanece na URL/rota actual |
| PiP | Desaparece quando a sessão deixa de estar live |

## Acessibilidade

- Hangup: `aria-label` (e opcionalmente `title`) com significado «Sair da chamada» / «Encerrar chamada».
- Região PiP: `aria-label` existente mantém-se.

## Interacção com drag

- Drag permanece no header.
- Clicks nos botões do rodapé não iniciam arrasto.

## MUST NOT

- Mic, câmera, blur, ou deafen no PiP (FR-009).
- Alterar call-controls do palco (`VoiceChannel`).

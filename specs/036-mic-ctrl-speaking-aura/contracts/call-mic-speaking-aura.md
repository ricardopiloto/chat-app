# Contract: Aura de fala no botão de microfone (call-controls)

**Feature**: [036-mic-ctrl-speaking-aura](../spec.md)  
**Extends**: [033 voice-speaking-roster-ui](../../033-voice-speaking-indicator/contracts/voice-speaking-roster-ui.md)

Superfície de UI; sem rotas novas.

## Target

Botão de microfone em `.call-controls` com `aria-label` / `title` **«Microfone ligado»** ou **«Microfone desligado»**.

## Behaviour

| Condição | Aura no botão |
|----------|----------------|
| Na chamada, mic ligado, a falar | MUST mostrar aura em torno do **botão inteiro** |
| Mic ligado, silêncio | MUST NOT |
| Mic desligado | MUST NOT |
| Fora da chamada / controlos ocultos | N/A |

## Visual

- Mesma linguagem que `.voice-roster-media-icon.is-speaking` (cor accent + pulse).
- Adaptar escala ao botão (~44–48px); não parecer alerta/erro.
- MUST NOT mudar `aria-label` / `title` quando a aura está activa.

## Fora

- Câmera, blur, Sair; API speaking; alterar detecção 033.

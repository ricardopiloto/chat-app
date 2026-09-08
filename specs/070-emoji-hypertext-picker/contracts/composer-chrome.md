# Contrato: Chrome do composer (caixa de mensagem)

Âmbito: UI do composer de canal de texto. Sem API.

## Layout obrigatório

| Posição | Controlo | Obrigatório |
|---------|----------|-------------|
| Dentro da caixa, **esquerda** | Anexo (+) | Sim |
| Dentro da caixa, **direita** | Ícone emoji (abre selector) | Sim |
| Dentro da caixa, **direita** (após emoji) | Ícone Enviar (avião de papel) | Sim |
| Fora como botão texto «Enviar» | — | **Não** (removido como controlo principal) |

## Texto vs ícones

- O texto e o caret MUST permanecer na região entre o grupo esquerdo e o direito.
- MUST NOT haver sobreposição visual de caracteres sob os ícones.

## Enviar

| Estado | Comportamento |
|--------|----------------|
| Draft trim vazio **e** sem anexos pendentes | Ícone Enviar **inactivo** |
| Texto não vazio **ou** ≥1 anexo pendente | Ícone Enviar **activo**; activa o mesmo fluxo de envio actual |
| Picker de menção ou shortcode aberto | Enter aceita sugestão; MUST NOT enviar |

## Acessibilidade

- Controlo anexo: nome acessível «Anexar imagem» (ou equivalente).
- Controlo emoji: «Emoji».
- Controlo enviar: «Enviar».

## Fora deste contrato

- Catálogo de shortcodes; persistência; canais de voz (excepto se reutilizarem o mesmo composer — N/A).

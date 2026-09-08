# Contrato: Emoji no nome do canal

Âmbito: create/rename de canais (texto e voz). Preferência FE; BE já aceita Unicode.

## Persistência e apresentação

| Regra | Obrigatório |
|-------|-------------|
| Nome com emoji Unicode guardado sem strip | Sim |
| Nome mostrado na sidebar / títulos com glyphs legíveis | Sim |
| Nome só-texto continua válido | Sim |
| Nome vazio (após trim) continua rejeitado | Sim |

## Inserção

| Regra | Obrigatório |
|-------|-------------|
| Paste / teclado SO de emoji permitido | Sim |
| Picker opcional no fluxo de nome (ícone) | Sim |
| Shortcode suggest **não** no campo nome | Sim |

## Fora deste contrato

- Limites de comprimento novos (manter regras actuais se existirem).
- Validação de “emoji-only” especial — permitido se non-empty.

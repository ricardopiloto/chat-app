# Contrato: Destaque temporário de mensagem

Âmbito: DOM do histórico de texto + CSS + timer.

## Marcação

- Cada mensagem renderizada MUST expor identificador estável (ex. `data-message-id="{id}"` no bloco da mensagem).

## Activação (após encontrado + layout)

1. `scrollIntoView` com alinhamento **center** (quando a altura do painel permitir; senão pelo menos visível).
2. Aplicar classe visual `.msg-highlight` (ou equivalente) usando tokens de tema (accent / surface) — legível em claro e escuro.
3. Iniciar timer **3000 ms**; ao expirar, remover a classe.
4. Novo salto: cancelar timer anterior; destacar só o novo id.

## Não fazer

- Remover destaque só por scroll do utilizador.
- Remover destaque só por clique no chat.
- Destacar mensagem errada / id inexistente.

## Acessibilidade

- Preferir contraste adequado; se `prefers-reduced-motion`, evitar animações agressivas (fade curto ou só cor estática ok).

## Relação com falha

- Em `missing`, **não** aplicar `.msg-highlight`; usar toast do contrato de navegação.

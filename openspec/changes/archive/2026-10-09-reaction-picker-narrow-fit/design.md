# Design

## Context

Ver proposal.md (Why). `.ch-emoji` na linha tem `width: 320px` e `right: 0` relativamente a `.ch-react-anchor`, que fica à direita da mensagem. Medido numa janela de 390px, o selector fica em left 3 / right 323. Numa janela de 320px fica em left -67 / right 253.

## Goals / Non-Goals

**Goals:** o selector da linha não ultrapassa a largura visível da lista.

**Non-Goals:** mudar a altura, o lado acima/abaixo, ou o selector do composer (`bottom: 48px`, sem `placement`).

## Decisions

### Limitar a largura ao espaço à esquerda da âncora

O selector continua `right: 0` na `.ch-react-anchor`, para o lado acima/abaixo não mudar. `100%` dessa âncora é só a largura do botão, e `100vw` não chega: numa janela de 320px a borda direita do selector ficou em 253px, por isso uma largura de 304px ainda saía pela esquerda.

`MessageRow` já mede a âncora e `.ch-scroll` ao abrir. Passa também `maxWidth = anchor.right - scroll.left - 8` quando esse valor é menor que 320. O `EmojiPicker` escreve-o em `max-width`. Sem `maxWidth`, a largura fica 320px. A grelha de 8 colunas encolhe com o contentor.

Alternativa considerada: `width: min(320px, 100vw - 16px)`. Rejeitada porque a borda direita do selector não é a borda da janela. Alternativa considerada: portal com `position: fixed`. Rejeitada; basta limitar a largura.

## Risks / Trade-offs

- [Grelha de 8 colunas fica apertada abaixo de ~320px] → Os botões encolhem com a grelha; continuam clicáveis. Não se remove emoji.

## Migration Plan

Sem migração. Publicar o frontend. Rollback: reverter o commit.

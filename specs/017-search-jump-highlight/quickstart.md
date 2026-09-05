# Quickstart: 017-search-jump-highlight

Validar salto à mensagem + destaque a partir da pesquisa. Sem API nova obrigatória.

## Pré-requisitos

- Backend + frontend a correr (`README.md`).
- Conta com servidor e canal de texto com várias mensagens pesquisáveis.
- Preferência: pelo menos uma mensagem «no meio» do histórico visível.

## 1. Salto + destaque (caminho feliz)

1. Abrir pesquisa (ícone ou Ctrl/Cmd+F).
2. Pesquisar um termo único de uma mensagem conhecida.
3. Clicar no resultado.
4. **Esperado**: pesquisa recolhe; canal de texto correcto; mensagem **visível e centrada**; destaque visual ~**3 s**; depois o destaque some.
5. Scroll/clicar no chat durante o destaque → destaque **permanece** até aos ~3 s (ou novo salto).

## 2. Mesmo canal

1. Já no canal do hit, pesquisar e seleccionar outro resultado no mesmo canal.
2. **Esperado**: scroll/centrar + destaque na nova mensagem sem falha; destaque anterior cancelado.

## 3. Mensagem inexistente

1. (Opcional) Apagar a mensagem de um hit conhecido, ou forçar um `message=` inventado na URL.
2. **Esperado**: canal abre se acessível; **toast/banner** «Mensagem não encontrada» (ou equivalente); **sem** highlight fantasma.

## 4. Regressão 014

1. Ctrl+F com seed `#canal `; pesquisa `#canal termo` e global continuam a funcionar.
2. Hits sem selecção não alteram o chat.

## 5. Checks

```bash
cd frontend && npx tsc --noEmit
```

Ver: [search-hit-navigation.md](./contracts/search-hit-navigation.md), [message-highlight.md](./contracts/message-highlight.md).

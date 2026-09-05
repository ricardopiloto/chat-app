# Quickstart: 021-message-hover-highlight

Validar destaque ao pairar/focar mensagens no canal de texto. Sem API nova.

## Pré-requisitos

- Backend + frontend a correr (`README.md`).
- Canal de texto com várias mensagens, incluindo pelo menos um grupo do mesmo autor (duas mensagens seguidas) e, se possível, uma com anexo.

## 1. Hover no bloco (caminho feliz)

1. Abrir o canal de texto.
2. Pairar sobre o **corpo** de uma mensagem (não o avatar).
3. **Esperado**: aquele bloco inteiro (texto e anexos) destaca-se; as vizinhas não.
4. Mover para outra mensagem → o destaque muda; sair da lista → nenhum hover residual.

## 2. Avatar / nome

1. Pairar só no **avatar** ou no **nome** do autor.
2. **Esperado**: nenhuma mensagem destacada por hover.

## 3. Grupo do mesmo autor

1. Pairar na segunda mensagem de um grupo.
2. **Esperado**: só essa mensagem, não todas as do autor.

## 4. Foco / Apagar

1. Focar um bloco (Tab até à mensagem ou ao «Apagar»).
2. **Esperado**: o mesmo tipo de destaque de alvo; «Apagar» continua visível.

## 5. Pesquisa (017)

1. Saltar a uma mensagem pela pesquisa (destaque accent ~3 s).
2. Pairar **nessa** mensagem e noutra.
3. **Esperado**: o salto continua reconhecível (mais marcado); o hover noutra mensagem não apaga o salto na primeira enquanto o timer corre.

## 6. Checks

```bash
cd frontend && npx tsc --noEmit
```

Tema claro e escuro; `prefers-reduced-motion` se houver transição.

Ver: [message-hover.md](./contracts/message-hover.md).

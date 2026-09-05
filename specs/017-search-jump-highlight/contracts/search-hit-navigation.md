# Contrato: Navegação a partir de um hit de pesquisa

Âmbito: `SearchPanel.openHit` → rota do canal de texto → resolução no `Channel`.

## URL

```text
/channels/{channelId}?server={serverId}&type=text&message={messageId}
```

| Param | Obrigatório | Notas |
|-------|-------------|-------|
| `channelId` | sim (path) | Canal do hit |
| `server` | sim (shell actual) | Como hoje |
| `type` | sim | `text` para hits de pesquisa |
| `message` | sim neste fluxo | UUID da mensagem alvo |

## Comportamento `openHit`

1. `navigate` com URL acima.
2. `onCollapse()` — pesquisa recolhe (FR-005).
3. Não alterar ranking/sintaxe de pesquisa (FR-007).

## Resolução no canal (`Channel`)

1. Ler `message` da query (router).
2. Após histórico descriptografado disponível, procurar `id === messageId`.
3. Se encontrado → aplicar contrato [message-highlight.md](./message-highlight.md).
4. Se não → seek: até **5** `GET /api/channels/{id}/messages?before=<created_at da mais antiga carregada>`; merge; repetir procura.
5. Se ainda ausente → toast «Mensagem não encontrada» (ou copy equivalente); **sem** highlight; canal permanece aberto se a navegação teve sucesso.
6. Corridas: só a última intenção de salto (URL/`message` + geração) aplica efeitos.

## API existente (sem contrato REST novo)

- `GET /api/channels/{channel_id}/messages`
- Query opcional: `before` (RFC3339)
- Resposta: até 200 mensagens, `created_at` ASC

## Fora deste contrato

- Mudança de `parseSearchQuery` / empty states 014.
- Jump a partir de notificações (pode reutilizar URL mais tarde).

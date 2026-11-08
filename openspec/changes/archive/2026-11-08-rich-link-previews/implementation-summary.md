# Implementação — rich-link-previews

## Alterações por ficheiro

- `backend/src/api/unfurl.rs`: acrescentou `Provider`, `provider_for`, `iframe_embed_url`, `parse_oembed_body` e `fetch_oembed`. A correspondência usa os hosts D1 e endpoints fixos; o cliente existente tem timeout de 5 s. A resposta oEmbed é analisada sem executar o HTML; o `src` do iframe exige HTTPS e host da allowlist D2. O YouTube é reescrito para `www.youtube-nocookie.com/embed/{id}`. Falha de rede, status, JSON ou validação regressa ao caminho HTML genérico. `UnfurlResult` ganhou `provider`, `embed_url` e `media_url`; `kind: "embed"` usa título, miniatura e nome do provedor. O ramo `video/*` devolve `kind: "video"` com `media_url` igual à URL final, sem ler o corpo; o vídeo identificado por `og:type` continua sem `media_url`. Testes unitários cobrem hosts, parsing e validação sem rede.
- `backend/src/security_headers.rs`: `frame-src` inclui os cinco hosts D5, além de Cloudflare; restantes directivas mantidas. Confirmado por leitura da constante.
- `frontend/src/api/types.ts`: `LinkPreview` ganhou `provider?`, `embed_url?` e `media_url?`.
- `frontend/src/chat/LinkCards.tsx`: `LinkCard` usa `createSignal` local para mostrar primeiro miniatura, provedor e play; cria o iframe apenas ao clique. Com `media_url`, mostra `<video controls preload="metadata">`; vídeo HTML sem `media_url` mantém o cartão existente.
- `frontend/src/chat.css`: estilo do botão de embed e dimensões dos players.
- `frontend/src/i18n/catalogs/chat.en.ts` e `chat.pt-BR.ts`: chaves `txt.preview.play` e `txt.preview.clickToPlay`.
- `openspec/changes/rich-link-previews/tasks.md`: 1.1–5.3 e 6.2 marcadas. 6.1, 6.3 e secção 7 permanecem abertas.

## Iframe

`sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"` e `allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen"` foram mantidos exactamente como em D6. Não houve ajuste, pois a verificação manual com display (6.3) não foi executada.

## Verificações

- `cargo test --lib`: 28 passaram, 0 falhas. `cargo fmt --check`: passou.
- `cargo test`: falhou no conjunto `contract`: 227 passaram e 9 falharam porque testes de WebSocket receberam `Operation not permitted` ao abrir socket neste ambiente. Não há falha dos testes novos de `unfurl`; não foi possível confirmar 6.1 como suite completa sem falhas.
- `npx tsc --noEmit`: passou.
- `npx eslint src`: passou com 0 erros e 1 aviso já existente em `src/voice/callSession.tsx`.
- `npm run verify:i18n-keys`: passou (`used keys: 923; en: 1339; pt-BR: 1339`).
- `npm run build`: passou (aviso de tamanho de chunks do Vite).
- 6.3 não executada: nenhum dos cinco players nem vídeo directo foi validado num browser com display.

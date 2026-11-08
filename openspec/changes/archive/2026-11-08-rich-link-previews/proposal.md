# Proposal

## Why

A pré-visualização de links (`backend/src/api/unfurl.rs`, `frontend/src/chat/LinkCards.tsx`) lê até 256 KB da página para extrair `og:*`. A página de um vídeo do YouTube chega perto de 1,3 MB, com as tags `og:*` só perto do byte 776.000 — a leitura é cortada antes de as encontrar, o unfurl falha em silêncio e a mensagem mostra só o link cru, sem indicação nenhuma de que é um vídeo. O mesmo problema afecta qualquer página grande o suficiente, não só o YouTube. Além disso, um link directo para um arquivo de vídeo (`.mp4`, `.webm`, etc.) nunca teve tratamento próprio — cai no mesmo caminho de interpretar bytes binários como HTML — ao contrário de um link directo de imagem, que já tem um ramo dedicado por `content-type` e funciona hoje.

## What Changes

- Para URLs que correspondem a um provedor conhecido com oEmbed público (YouTube, Vimeo, Spotify, SoundCloud, TikTok), o backend consulta o endpoint oEmbed oficial desse provedor (JSON pequeno, sem baixar a página) em vez do caminho genérico de HTML. Isto resolve o YouTube do exemplo e qualquer link desses cinco provedores sem depender do tamanho da página.
- O campo `html` devolvido pelo oEmbed nunca é injectado directamente: extrai-se e valida-se só a URL do `src` do `<iframe>` contido nele, contra uma allowlist fixa de hosts por provedor (reescrita para `www.youtube-nocookie.com` no caso do YouTube, para reduzir o rastreio mesmo depois do clique).
- Na mensagem, um link destes provedores aparece como uma miniatura com selo do provedor e botão de play — **nunca carrega o iframe de terceiros automaticamente**; só ao clicar é que o player é embutido. Decisão de produto já confirmada: expor o mínimo possível de IP/user-agent de quem lê a mensagem ao provedor externo antes de uma acção explícita.
- **BREAKING (política de segurança):** `frame-src` na Content-Security-Policy (`backend/src/security_headers.rs`) passa a incluir os cinco hosts de embed destes provedores, além do já existente `challenges.cloudflare.com`. Hoje nenhum outro iframe de terceiros é permitido; esta change abre essa porta, deliberadamente e de forma restrita a estes cinco hosts.
- Um link directo para um arquivo de vídeo (detectado por `content-type: video/*`, sem baixar o corpo, igual ao ramo já existente para `image/*`) passa a aparecer como um player `<video>` nativo reproduzível na própria mensagem, em vez de cair no parsing de HTML genérico.
- Falha ao consultar um provedor (endpoint fora do ar, resposta inesperada) degrada para a pré-visualização genérica actual (link simples), nunca para um erro visível na mensagem.

## Capabilities

### Modified Capabilities
- `frontend-v2/text-messaging`: a requirement "Pré-visualização automática de links" passa a cobrir também um resultado do tipo embed (clique-para-carregar) para os cinco provedores listados e um resultado de vídeo reproduzível para links directos de arquivo de vídeo, além do cartão genérico (miniatura, nome do site, título) já especificado.

## Impact

- `backend/src/api/unfurl.rs`: tabela de padrões de URL por provedor, chamada ao oEmbed de cada um, extracção/validação segura do `src` do iframe, novo ramo `content-type: video/*`.
- `backend/src/security_headers.rs`: `frame-src` ampliado para os cinco hosts de embed.
- `frontend/src/chat/LinkCards.tsx` e `frontend/src/api/types.ts` (`LinkPreview`): novos campos para o resultado de embed (miniatura, nome do provedor, URL do embed) e para o vídeo directo (URL do arquivo); UI de clique-para-carregar e player `<video>` nativo.
- Nenhuma migração de banco, nenhuma dependência nova (os cinco endpoints oEmbed são públicos e não exigem chave de API).

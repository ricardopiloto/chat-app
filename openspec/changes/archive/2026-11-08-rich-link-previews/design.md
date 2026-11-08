# Design

## Context

`backend/src/api/unfurl.rs` (`POST /api/unfurl`, exige `AuthUser`, sem rate limit próprio) hoje busca a página, limita o corpo a `MAX_UNFURL_BODY = 256 * 1024` bytes e extrai `og:*`/`<title>` do HTML. Um `content-type: image/*` tem um ramo dedicado que devolve a própria URL como imagem sem ler o corpo. `frontend/src/chat/LinkCards.tsx` consome `LinkPreview` (`frontend/src/api/types.ts:242`) e cacheia por URL/sessão num `Map` em memória (`previews`). A CSP (`backend/src/security_headers.rs:7`) hoje só permite `frame-src https://challenges.cloudflare.com` — nenhum outro iframe de terceiros é carregável na app.

A página de `youtube.com/watch` chega a ~1,3 MB com `og:*` perto do byte 776.000 — muito acima do limite actual. Qualquer página grande o suficiente tem o mesmo problema; não é específico do YouTube.

## Goals / Non-Goals

**Goals:**
- Resolver correctamente os cinco provedores decididos (YouTube, Vimeo, Spotify, SoundCloud, TikTok) via oEmbed público, sem depender do tamanho da página de destino.
- Nunca carregar automaticamente um iframe de terceiros — só ao clique explícito do utilizador (decisão de produto já confirmada).
- Nunca confiar directamente no HTML devolvido por um provedor externo (`html` do oEmbed) — extrair e validar só a URL do iframe.
- Tratar link directo de arquivo de vídeo como player nativo inline, sem passo de clique (não é conteúdo de terceiros incorporado, é um arquivo que o próprio navegador já sabe reproduzir).

**Non-Goals:**
- Suportar mais provedores além dos cinco decididos (fica no backlog).
- Resolver o caso geral de páginas HTML grandes sem oEmbed (continuam sujeitas ao limite actual; não está no escopo desta change aumentar ou mudar essa estratégia).
- Cache persistente de pré-visualizações entre sessões/contas (o cache actual em memória por sessão do browser é suficiente e não muda).
- Áudio directo por arquivo (`audio/*`) — só vídeo foi pedido.

## Decisions

### D1: Correspondência por provedor é por host, não por regex exaustivo de caminho

Cada provedor é identificado só pelo `host` da URL (tabela fixa abaixo). Não é preciso validar a forma exacta do caminho antes de chamar o oEmbed — se a URL não for uma página válida desse provedor, o próprio oEmbed responde com erro (404 ou corpo inesperado), e esse caso cai para o fallback (D4). Isto evita construir e manter regexes de caminho por provedor que ficam desactualizados quando o provedor muda a estrutura de URL.

| Provedor | Hosts aceites | Endpoint oEmbed |
|---|---|---|
| YouTube | `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`, `www.youtube-nocookie.com` | `https://www.youtube.com/oembed?url={url}&format=json` |
| Vimeo | `vimeo.com`, `www.vimeo.com`, `player.vimeo.com` | `https://vimeo.com/api/oembed.json?url={url}` |
| Spotify | `open.spotify.com` | `https://open.spotify.com/oembed?url={url}` |
| SoundCloud | `soundcloud.com`, `www.soundcloud.com`, `m.soundcloud.com` | `https://soundcloud.com/oembed?format=json&url={url}` |
| TikTok | `tiktok.com`, `www.tiktok.com`, `vm.tiktok.com`, `m.tiktok.com` | `https://www.tiktok.com/oembed?url={url}` |

Todos os cinco endpoints são públicos, sem chave de API. `{url}` é a URL original, url-encoded, como parâmetro de query — o pedido em si vai sempre para o host fixo do provedor (não para um host derivado da entrada do utilizador), por isso não precisa da validação SSRF (`validate_public_url`) que o caminho genérico de HTML já tem; essa validação continua a aplicar-se ao caminho genérico (D4) e ao link directo de vídeo (D3), que esses sim buscam a URL do utilizador directamente.

### D2: O campo `html` do oEmbed nunca é confiado directamente — extrai-se e valida-se só o `src`

A resposta oEmbed de cada provedor inclui `html`, uma string com um `<iframe>` completo. Nunca é devolvida ao frontend nem injectada como está — um provedor comprometido ou uma mudança inesperada no formato poderia injectar HTML/JS arbitrário na app. Em vez disso:
1. Extrai-se o valor do atributo `src` desse `<iframe>` com um parser simples (procurar `<iframe` seguido de `src="..."` ou `src='...'`; não é preciso um parser HTML completo, só este atributo).
2. Valida-se que o host do `src` extraído está na allowlist fixa desse provedor (tabela abaixo). Qualquer coisa fora disso (incluindo falha a encontrar um `src`) é tratada como falha do provedor e cai no fallback (D4).
3. Só para o YouTube: em vez de usar o `src` tal como veio, extrai-se o ID do vídeo do caminho `/embed/{id}` e reconstrói-se `https://www.youtube-nocookie.com/embed/{id}` — descarta parâmetros extra e troca para o domínio sem cookies de rastreio do YouTube, reduzindo o que é partilhado mesmo depois do clique. Os outros quatro provedores não têm um domínio "sem cookies" equivalente; usa-se o `src` validado como veio.

| Provedor | Host aceite no `src` do iframe |
|---|---|
| YouTube | `www.youtube.com` ou `www.youtube-nocookie.com` (sempre reescrito para este último) |
| Vimeo | `player.vimeo.com` |
| Spotify | `open.spotify.com` |
| SoundCloud | `w.soundcloud.com` |
| TikTok | `www.tiktok.com` |

O resultado (`UnfurlResult`) ganha `kind: "embed"`, `provider: Option<String>` (`"youtube"`/`"vimeo"`/`"spotify"`/`"soundcloud"`/`"tiktok"`) e `embed_url: Option<String>` (a URL validada/reescrita, pronta a usar directamente como `src` de um `<iframe>` no frontend). `title`/`image_url`/`site_name` continuam a vir do oEmbed (`title`, `thumbnail_url`, `provider_name`).

### D3: Link directo de arquivo de vídeo, mesmo padrão já usado para imagem

Acrescenta-se um ramo `content_type.starts_with("video/")` em paralelo ao já existente para `image/*` (`unfurl.rs`, antes do `read_capped_body`) — detecta pelo cabeçalho `Content-Type`, sem baixar o corpo, mesmo custo e mesma validação SSRF (`fetch_ssrf_safe`/`validate_public_url`) que já se aplica a toda a busca. `UnfurlResult` ganha `media_url: Option<String>`, preenchido com a própria URL (depois de seguir redirecionamentos, igual ao que já acontece para imagem) quando `kind == "video"` vier deste ramo directo — distinto do `kind == "video"` já existente, que vem de `og:type` conter "video" numa página HTML (um link para uma página sobre um vídeo, não para o arquivo em si). O frontend distingue os dois: havendo `media_url`, é um arquivo reproduzível directamente (`<video>` nativo); sem `media_url`, é o cartão genérico actual com o selo "Vídeo" (comportamento inalterado).

### D4: Falha de provedor degrada sempre, nunca aparece como erro

Se a chamada oEmbed falhar (rede, timeout, status não-200, JSON inesperado, `html` sem `src` válido, host fora da allowlist), a URL cai para o caminho genérico de HTML já existente (como se não tivesse correspondido a nenhum provedor) — não para um `UnfurlResult` de erro. Timeout do cliente oEmbed: os mesmos 5 s já usados no `reqwest::Client` existente. Isto preserva o comportamento já especificado: uma pré-visualização que falha nunca aparece como um cartão de erro na mensagem, só deixa de aparecer.

### D5: CSP — `frame-src` ganha os cinco hosts de embed, nada mais

`backend/src/security_headers.rs:7` (`CONTENT_SECURITY_POLICY`): `frame-src` passa de `https://challenges.cloudflare.com` para incluir também `https://www.youtube-nocookie.com https://player.vimeo.com https://open.spotify.com https://w.soundcloud.com https://www.tiktok.com`. Nenhuma outra directiva muda — `img-src` já permite `https:` genericamente, cobrindo as miniaturas (`thumbnail_url`) sem alteração.

### D6: Clique-para-carregar no frontend, sandbox explícita no iframe final

`LinkCards.tsx`: quando `kind === "embed"`, mostra uma miniatura (`image_url`/`thumbnail_url`) com selo do `provider` e um ícone de play, sem nenhum `<iframe>` no DOM ainda. Só ao clique é que o componente troca para `<iframe src={embed_url} sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen" loading="lazy" referrerpolicy="strict-origin-when-cross-origin">` — ajustar os tokens de sandbox/`allow` durante a implementação se algum dos cinco players não reproduzir correctamente com este conjunto inicial, mantendo-o o mais restrito possível que ainda funcione. Quando `kind === "video"` com `media_url` presente, mostra directamente um `<video controls preload="metadata" src={media_url}>` nativo, sem passo de clique (não é conteúdo de terceiros incorporado).

## Risks / Trade-offs

- Os cinco endpoints oEmbed são de terceiros fora do nosso controlo; uma mudança de formato de resposta é absorvida pelo fallback (D4), não por uma excepção não tratada — a implementação deve tratar qualquer campo em falta/malformado como falha do provedor, nunca como `panic`/erro 500.
- A miniatura (`thumbnail_url`) continua a ser carregada automaticamente (sem clique) — é uma imagem estática do provedor, o mesmo nível de exposição que uma pré-visualização genérica já tem hoje; só o iframe interactivo (com o seu próprio JS/rastreio) espera pelo clique.
- Abrir `frame-src` para estes cinco hosts é uma decisão de segurança deliberada e específica desta change (D5) — fica registada aqui para qualquer auditoria futura encontrar o porquê.
- SoundCloud/TikTok podem devolver `html` cujo `src` aponta a sub-hosts adicionais que a tabela de D2 não prevê (ex. mudança futura de domínio do player); se isso acontecer, a validação falha e cai no fallback (D4) em vez de quebrar — é um risco de "deixa de funcionar silenciosamente para esse provedor", não um risco de segurança.

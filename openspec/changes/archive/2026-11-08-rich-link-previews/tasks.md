# Tasks

## 1. Backend — oEmbed por provedor

- [x] 1.1 Em `backend/src/api/unfurl.rs`, acrescentar a tabela fixa de provedores (D1 do `design.md`): host → (nome do provedor, endpoint oEmbed). Função que, dado o `Url` já parseado, devolve o provedor correspondente pelo `host_str()`, ou `None`. Verificar com testes unitários (sem rede): cada host da tabela (incluindo variantes como `youtu.be`, `m.youtube.com`, `player.vimeo.com`) corresponde ao provedor certo; um host qualquer fora da tabela devolve `None`.
- [x] 1.2 Antes do caminho genérico de HTML, se a URL corresponder a um provedor (1.1): montar o pedido GET ao endpoint oEmbed desse provedor com a URL original como parâmetro `url` (url-encoded), timeout de 5s igual ao cliente já existente; se a resposta não for `200` ou o corpo não parsear como o JSON esperado (`title`, `thumbnail_url`, `provider_name`, `html`), tratar como falha de provedor e cair para o caminho genérico de HTML (D4) — não propagar erro. **Nota de teste** (achado da revisão dupla): a validação SSRF já existente (`validate_public_url`/`is_blocked_ip`) bloqueia qualquer servidor de teste local (`127.0.0.1`), e o projecto já não tem hoje nenhum teste de fetch real para este ficheiro por este motivo — não é uma lacuna desta change. Não escrever teste de rede real para este caminho; a verificação do "happy path" fica só pela verificação manual da tarefa 6.3. Escrever, em vez disso, um teste unitário que isola e chama directamente a função de parsing/decisão da resposta oEmbed (dado um corpo JSON em string, nunca vindo de uma rede real) com três entradas fixas (sucesso, 404 simulado como ausência de corpo válido, JSON malformado), confirmando os três comportamentos sem nenhum fetch.
- [x] 1.3 Implementar a extracção e validação segura do `src` do `<iframe>` em `html` (D2): parser simples de atributo (não precisa de parser HTML completo), validação do host do `src` contra a allowlist por provedor da tabela de D2, e a reescrita específica do YouTube para `https://www.youtube-nocookie.com/embed/{id}` extraindo o id do caminho. Qualquer falha nesta extracção/validação também cai para o caminho genérico (D4). Verificar com testes unitários (sem rede): um `html` de exemplo real de cada um dos cinco provedores, como string fixa no teste, extrai o `embed_url` esperado; um `html` com `src` para um host fora da allowlist é rejeitado; um `html` sem `<iframe>` nenhum é rejeitado.
- [x] 1.4 Estender `UnfurlResult` com `kind: "embed"`, `provider: Option<String>`, `embed_url: Option<String>`; preencher `title`/`image_url`/`site_name` a partir de `title`/`thumbnail_url`/`provider_name` do oEmbed quando o provedor resolver com sucesso. Sem teste de contrato com rede real (mesma nota da 1.2) — a composição final do `UnfurlResult` a partir de um resultado de provedor já fica coberta pelos testes unitários de 1.2/1.3; verificar por leitura que a função que monta o `UnfurlResult` usa correctamente os campos já testados isoladamente.

## 2. Backend — vídeo directo por arquivo

- [x] 2.1 Acrescentar o ramo `content_type.starts_with("video/")` em `unfurl.rs`, em paralelo ao já existente para `image/*` (mesmo padrão: não lê o corpo, usa `response.url()` depois de seguir redireccionamentos). `UnfurlResult` ganha `media_url: Option<String>`, preenchido só por este ramo (não pelo `kind: "video"` já existente baseado em `og:type`). Sem teste de contrato com rede real (mesma nota de 1.2 — a validação SSRF bloqueia qualquer host de teste local); verificar por leitura e manualmente (tarefa 6.3, com uma URL directa de vídeo real) que o ramo devolve `media_url` igual à URL e que uma URL HTML com `og:type` contendo "video" continua a devolver `kind: "video"` sem `media_url` (comportamento antigo intacto).

## 3. CSP

- [x] 3.1 Em `backend/src/security_headers.rs`, `CONTENT_SECURITY_POLICY`: ampliar `frame-src` com os cinco hosts de D5 (`https://www.youtube-nocookie.com`, `https://player.vimeo.com`, `https://open.spotify.com`, `https://w.soundcloud.com`, `https://www.tiktok.com`), mantendo `https://challenges.cloudflare.com`. Verificar com teste existente/novo de `security_headers` (se houver) ou por leitura directa do header numa resposta de teste, confirmando a string final.

## 4. Frontend — tipos e cliente

- [x] 4.1 Em `frontend/src/api/types.ts`, estender `LinkPreview` com `provider?: string`, `embed_url?: string`, `media_url?: string`. Nenhuma mudança no cliente `links.preview` (`frontend/src/api/endpoints/conversation.ts`) — a forma da chamada não muda.

## 5. Frontend — renderização

- [x] 5.1 Em `frontend/src/chat/LinkCards.tsx`, quando `kind === "embed"`: renderizar a miniatura (`image_url`) com um selo mostrando `provider` (ou `site_name` como fallback) e um indicador de reprodução (reaproveitar o ícone `play_circle` já usado para `kind === "video"`), sem nenhum `<iframe>` no DOM. Ao clique, trocar para o `<iframe src={embed_url}>` com os atributos `sandbox`/`allow`/`referrerpolicy`/`loading` de D6 — ajustar os tokens de sandbox se algum dos cinco players não reproduzir correctamente, mantendo o mais restrito que funcionar; documentar no resumo final qualquer ajuste feito a estes atributos e porquê. Verificar manualmente com uma URL real de cada um dos cinco provedores (lista de exemplos no resumo final) que a miniatura aparece sem carregar nada de terceiros até ao clique, e que o player funciona depois de clicar.
- [x] 5.2 No mesmo ficheiro, quando `kind === "video"` e `media_url` está presente: renderizar `<video controls preload="metadata" src={media_url}>` nativo em vez do cartão genérico; quando `kind === "video"` sem `media_url`, manter o comportamento actual (cartão com selo "Vídeo", sem player). Verificar manualmente com uma URL directa de um arquivo `.mp4` pequeno de teste.
- [x] 5.3 Acrescentar chaves i18n novas necessárias (ex. rótulo do botão de play, "clique para reproduzir") em `frontend/src/i18n/catalogs/chat.en.ts`/`chat.pt-BR.ts`; verificar com `npm run verify:i18n-keys`.

## 6. Verificação

- [x] 6.1 `cargo test` em `backend/`; confirmar 0 falhas (os testes novos de 1.1-2.1 inclusive).
- [x] 6.2 `npx tsc --noEmit`, `npx eslint src`, `npm run verify:i18n-keys`, `npm run build` em `frontend/`; confirmar que passam.
- [x] 6.3 Verificação manual com display: colar a URL de exemplo do YouTube (`https://www.youtube.com/watch?v=zbH38qSaBQw`) numa mensagem e confirmar o comportamento completo de D6; repetir com um link de cada um dos outros quatro provedores e com um link directo de vídeo.

## 7. Revisão

- [x] 7.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [x] 7.2 `openspec validate rich-link-previews --strict`.

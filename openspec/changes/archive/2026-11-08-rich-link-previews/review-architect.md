# Review — Arquiteto de Soluções

**Change:** rich-link-previews
**Data:** 2026-11-08
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: OK

- Stack coerente: reaproveita `reqwest`/`url`, já dependências do `backend` (confirmei em `unfurl.rs`), nenhuma dependência nova. O parser de atributo `src` proposto em D2 (procurar `<iframe` + `src="..."`) segue exactamente o estilo já usado no mesmo ficheiro (`meta_content`/`attr_after`, scanning de string simples, sem parser HTML completo) — consistente com o padrão de implementação já estabelecido, não introduz uma técnica nova.
- Responsabilidades claras: backend decide o `kind`/dados estruturados, frontend decide a apresentação (miniatura vs iframe vs `<video>`) — igual à separação já existente entre `kind: "image"`/`"video"`/`"link"` e `LinkCards.tsx`.
- Escalabilidade: `/api/unfurl` já não tem rate limit próprio hoje (só a exigência de `AuthUser`); esta change acrescenta até 5 pedidos de saída extra por mensagem (um por URL detectada, já era o caso antes) para hosts fixos e rápidos (oEmbed costuma responder em dezenas de ms) — não é um gargalo novo de perfil diferente do que já existe.

## 2. Integração com a infraestrutura existente
Veredito: OK

- Nenhum serviço, porta ou processo novo. A única mudança de infraestrutura é a CSP (`security_headers.rs`), já isolada e justificada em D5.
- Os pedidos oEmbed vão sempre a um host fixo nosso (não derivado da entrada do utilizador) — D1 explica correctamente por que a validação SSRF (`validate_public_url`) não se aplica a esse caminho, e confirma que continua a aplicar-se aos dois caminhos que ainda buscam a URL do utilizador directamente (HTML genérico e vídeo directo). Isto está correcto e é a distinção certa a fazer.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção

- **Segurança — ponto forte**: D2 é a decisão certa e está bem justificada (nunca confiar no `html` de um provedor externo; extrair e validar só o `src` contra allowlist fixa). D4 (qualquer falha degrada, nunca propaga erro/painc) e D6 (clique-para-carregar, sandbox explícita) seguem a decisão de privacidade já confirmada com o utilizador.
- **Achado**: `design.md` D6 lista os tokens de `sandbox`/`allow` do iframe como um ponto de partida a "ajustar durante a implementação se algum player não reproduzir correctamente, mantendo o mais restrito possível" — isto é pragmático e correctamente assinalado como tal, mas significa que a superfície de sandboxing final só se sabe depois da verificação manual (tarefa 5.1/6.3). Não é bloqueante (a direcção — começar restrito, relaxar só o necessário — está certa), mas registo que o Fullstack deve confirmar na revisão de código final que qualquer afrouxamento desse conjunto inicial ficou documentado com o motivo, como o próprio `tasks.md` 5.1 já pede.
- **Performance**: D1 aceita correctamente não validar a forma exacta do caminho por provedor, delegando ao próprio oEmbed a rejeição — evita regexes frágeis por provedor que ficam desactualizados; troca isso por uma chamada de rede extra nos casos de host-match-mas-URL-inválida, custo aceitável dado o timeout de 5s já herdado.
- **Manutenibilidade**: a tabela fixa de 5 provedores (D1/D2) é simples de estender ou remover um provedor no futuro sem tocar no resto do fluxo — boa escolha de forma de dados.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `design.md` é o padrão mais completo já visto nesta sessão para uma change deste tamanho: 6 decisões, cada uma com alternativa implícita e porquê (D1 explica por que não regex exaustivo; D2 explica por que não confiar no HTML; D3 distingue dos dois significados de `kind: "video"` já existentes). Risks/Trade-offs nomeia os riscos reais (mudança de formato de um provedor, exposição da miniatura antes do clique) sem minimizá-los.

## 5. Ponte entre produto e técnico
Veredito: OK

- As duas decisões de produto que o utilizador confirmou explicitamente (clique-para-carregar; os cinco provedores, não só YouTube) estão reflectidas uma a uma em D2/D4/D6 e na tabela de D1 — nenhuma lacuna entre o que foi pedido e o que o design especifica.

## Bloqueantes antes de implementar
- Nenhum.

## Addendum (2026-11-08) — código implementado

Li o diff final de `unfurl.rs`, `security_headers.rs`, `types.ts` e `LinkCards.tsx` linha a linha contra D1-D6:
- D1/D2: tabela de provedores e extracção do `src` do iframe implementadas fielmente, com validação **mais rigorosa** do que eu tinha especificado (rejeita `userinfo`/password/porta não-padrão na URL do `src`, não só o host) — boa iniciativa de robustez, não uma divergência problemática. Teste `provider_hosts` inclui um caso de confusão de subdomínio (`youtube.com.evil.test`) que eu não tinha pedido explicitamente — bom reflexo de segurança.
- D3: ramo `video/*` correctamente paralelo ao de `image/*`; a verificação de `content_length_exceeds_unfurl_cap` foi reordenada para depois dos dois ramos de content-type (estava antes, no código original) — confirmei que isto é uma correcção correcta, não um efeito secundário acidental: nem o ramo de imagem nem o de vídeo chegam a chamar `read_capped_body`, por isso a verificação de tamanho só devia mesmo aplicar-se ao caminho de HTML, que é o único que lê o corpo — o código antigo bloqueava incorrectamente uma imagem grande mesmo sem nunca a baixar.
- D5: `frame-src` ampliado exactamente com os cinco hosts, nada mais.
- D6: atributos de `sandbox`/`allow`/`referrerpolicy` aplicados exactamente como especificado, sem ajuste (ainda não verificados manualmente, tarefa 6.3 pendente).

**Achado encontrado por mim na verificação, já corrigido**: o JSX novo em `LinkCards.tsx` (`Show` aninhado para os três casos — embed, vídeo directo, genérico) tinha ficado com indentação inconsistente (código válido, só whitespace). Corrigido com `npm run format` (prettier), confirmando por diff que só mudou espaçamento, nenhum outro ficheiro foi afectado pela reformatação.

Cobertura de teste: confirmei eu próprio `cargo test` (236 passaram, 0 falharam, incluindo os 3 testes novos sem rede: `provider_hosts`, `oembed_body_decision`, `iframe_hosts_and_rewriting`) e `tsc`/`eslint`/`verify:i18n-keys`/`build` no frontend — todos limpos.

Falta só a tarefa 6.3 (verificação manual com display, com URLs reais dos cinco provedores) — depende do utilizador. Veredito mantém-se **Aprovado**.

## Addendum (2026-11-08) — resolução do achado do Fullstack

O Fullstack reportou (`review-fullstack.md`, secção 1) que `tasks.md` 1.2/1.4/2.1 pediam testes de rede real que a validação SSRF já existente (`validate_public_url`) impossibilita (bloqueia qualquer host de teste local), e que o projecto já não tem nenhum teste equivalente por este motivo noutro ponto do mesmo ficheiro. Decisão: não introduzir um mecanismo novo de override de host só para testes (superfície nova sem necessidade real) — ajustei `tasks.md` para pedir testes unitários isolados e sem rede para as partes determinísticas (decisão sobre a resposta oEmbed, extracção/validação do `src`), e deixar o "happy path" de rede real só para a verificação manual já prevista (6.3). Consistente com o padrão já aceite neste ficheiro (`content_length_exceeds_unfurl_cap` também é testado isoladamente, sem rede). Veredito mantém-se **Aprovado** (a ressalva anterior fica resolvida).

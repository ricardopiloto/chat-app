# Review — Arquiteto de Soluções

**Change:** terms-and-privacy-documents
**Data:** 2026-11-13
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: Atenção

- **Achado**: `design.md` (D2) afirma que a detecção oficial-vs-self-host pode usar "o mesmo critério já usado para marketing (`data-home="marketing"` / origem oficial)". Verifiquei o código real: o mecanismo real é `data-home="marketing"` em `frontend/home.html:2`, lido em runtime por `homeMode()` (`frontend/src/auth/homeMode.ts`) — não existe nenhuma checagem em runtime baseada em `OFFICIAL_ORIGIN` (`frontend/src/shell/links.ts`); esse valor só é consumido **em build-time** por um plugin do Vite (`vite.config.ts:44-52`) para injectar URLs canónicas no `home.html`. Isto importa porque `home.html` e `index.html` são **duas entradas de build separadas do Vite** (`vite.config.ts:62`, `input: { main: "index.html", home: "home.html" }`), cada uma com o seu próprio bundle/roteamento — `index.html` usa um router manual (`entryScreen()`/`Gate` em `frontend/src/index.tsx`) que depende da `phase` da sessão.
- **Consequência não resolvida em `tasks.md`**: como é que `/terms`/`/privacy` ficam acessíveis a partir do `home.html` (bundle da marketing/home pública), que não corre o mesmo router gated-por-sessão do `index.html`? A proposta assume implicitamente uma única "tabela de rotas" que não existe tal como descrita. A solução mais provável — o rodapé do `home.html` apontar para a URL absoluta/relativa servida pelo bundle principal (`index.html`) em vez de tentar renderizar a página dentro do próprio `home.html` — é plausível, mas não está dita em lado nenhum; recomendo tornar isto explícito no `design.md` antes de implementar, para não descobrir a meio da implementação que é preciso um terceiro caminho de build.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- **Achado**: o mecanismo de customização self-host proposto — ficheiros Markdown com placeholders `SUBSTITUIR_*` que o operador edita antes do build — é um **segundo paradigma de configuração**, inconsistente com o padrão já estabelecido neste projecto: toda a configuração self-host documentada em `docs/operar-instancia.md`/`docs/deploy-producao.md` é feita por **variáveis de ambiente** (`BIND`, `LIVEKIT_*`, `EMAIL_*`, `REGISTO_MODO`, etc.), não por edição manual de ficheiros versionados antes de compilar. O único precedente de "placeholder" existente vai no sentido oposto (`__PARLEY_OFFICIAL_ORIGIN__` em `home.html`, substituído automaticamente pelo plugin do Vite, não por edição manual do operador).
- O `design.md` não reconhece que está a introduzir um padrão novo. Recomendação: pelo menos os valores escalares do placeholder (nome do operador, contacto, jurisdição) poderiam ir por variável de ambiente, injectados no build ou servidos em runtime, mantendo só o corpo em prosa como Markdown versionado — mais consistente com o resto do produto. Não é bloqueante (o Markdown-com-placeholder também funciona), mas é uma divergência de padrão que devia ser uma decisão explícita, não um efeito colateral não discutido.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Achado (consistência/segurança)**: D4 propõe que o label do checkbox de aceite inclua `<a href="/terms">` directamente dentro de uma string traduzida. Confirmei que isto seria o **primeiro caso de marcação HTML dentro de uma string de i18n** neste código: o sistema actual (`frontend/src/i18n/messages.ts`) só faz interpolação de `{placeholder}` em texto puro, sem suporte a HTML, e não há nenhum uso de `dangerouslySetInnerHTML` em lado nenhum — a convenção já usada noutros sítios é compor o link como elemento JSX à volta de segmentos de texto traduzidos separados, não embutir marcação dentro do catálogo. Misturar os dois padrões é inconsistente e abre um precedente de risco (texto traduzido interpretado como HTML) sem necessidade — a alternativa já usada no projecto resolve o mesmo problema de forma mais segura. Recomendo seguir essa convenção existente em vez de D4 como está escrito.
- **Achado (risco irreversível, decisão já tomada mas vale reconfirmar)**: D3 publica nome completo e e-mail pessoal de uma pessoa física no histórico do Git de um repositório **público** no GitHub. O `design.md` já regista que isto foi confirmado pelo utilizador e é necessário para transparência — não estou a questionar a decisão. Mas é tecnicamente diferente de qualquer outra decisão desta change: depois de dar `git push`, esse dado é efectivamente permanente (forks, caches, scrapers), mesmo que o ficheiro seja editado ou removido depois. Recomendo que `tasks.md` tenha um passo explícito de confirmação final imediatamente antes do commit que introduz esses valores reais — não assumir que a confirmação dada nesta conversa de planeamento cobre automaticamente o momento real do `git push` para um repositório público.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- As decisões D1–D5 em `design.md` seguem o formato já estabelecido no projecto (decisão + alternativa rejeitada + motivo) — nível de detalhe correcto.
- **Achado**: esta change foi criada em 2026-11-13 (`created: 2026-11-13` em `.openspec.yaml`), depois do corte de 2026-11-09 que determina que todo conteúdo novo do repositório (agora público) seja escrito em inglês — e está inteiramente em português. É uma divergência directa de uma decisão já registada do projecto, e particularmente notável aqui: esta é exactamente a change sobre publicar conteúdo público num repositório que se tornou público pelo mesmo motivo que gerou aquela política. Recomendo traduzir os artefactos (`proposal.md`, `design.md`, `tasks.md`, specs) antes de prosseguir — o conteúdo legal em si (`/terms`, `/privacy`) já está correctamente planeado em pt-BR **e** en como conteúdo do produto, essa parte não muda; é só o artefacto de planeamento OpenSpec que devia seguir a política.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why"/"What Changes" (necessidade de termos/privacidade antes de abrir cadastro público, oficial vs. self-host) foi traduzido em decisões técnicas concretas (D1–D5), com o caveat correcto de que o texto é rascunho de produto, não parecer jurídico — a ponte produto→técnico está bem feita nesse sentido, apesar dos achados de arquitectura acima.

## Bloqueantes antes de implementar
- nenhum (achados são tudo "Atenção", corrigíveis sem redesenhar a proposta)

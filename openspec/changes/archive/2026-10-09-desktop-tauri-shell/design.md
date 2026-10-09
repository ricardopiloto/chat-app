# Design

## Context

Ver `proposal.md` — Why. Pontos que ancoram este design:

- `frontend/vite.config.ts:8-11` já usa `DEV_PORT = 1421` e um proxy de dev — convenção já próxima da porta-padrão que o Tauri costuma esperar (`devUrl`) para um frontend Vite vizinho; não precisa de mudar.
- `frontend/public/favicon.png` (64×64), `frontend/public/apple-touch-icon.png` (180×180), `frontend/src/assets/logo.png` (256×256) e `frontend/src/assets/emblem.png` (128×128) são as fontes raster existentes; nenhuma chega a 1024×1024, a resolução que `cargo tauri icon` recomenda como fonte única para gerar todos os formatos (`.ico`, `.icns`, PNGs) sem perda de nitidez nos tamanhos maiores (ex. `.icns` 512@2x, ícone grande do Windows). `docs/v2/mesa_logo/screen.png` é 1024×1024, mas é uma captura de ecrã com a marca em contexto, não necessariamente um ficheiro isolado com fundo transparente pronto para um gerador de ícones.
- Tauri v2 introduziu um modelo de `capabilities` (ficheiros JSON que concedem, por janela, as permissões de cada plugin, incluindo o âmbito de rede de `plugin-http`/`plugin-websocket`) — por omissão pensado para restringir a rede a domínios conhecidos em build-time, o oposto do que esta aplicação precisa (instância escolhida em runtime).
- `backend/Cargo.toml` é um crate standalone, sem workspace na raiz do repositório (confirmado por investigação anterior) — não há precedente de workspace Rust multi-crate neste projecto.

## Goals / Non-Goals

**Goals:**
- Um binário Tauri local (`cargo tauri build`/`cargo tauri dev`) a correr nas três plataformas, com a marca oficial como ícone e o `frontend/dist` sem alteração como conteúdo.
- A configuração de rede do shell (`capabilities`) permitir exactamente o que `frontend-instance-connect` precisa (HTTP/WS para qualquer origem, storage local), sem mais.

**Non-Goals:**
- Instaladores distribuíveis/CI (`desktop-packaging-ci`).
- Tray icon, menu nativo, auto-update, janela frameless, "single instance" — nenhum pedido pelo utilizador; cada um é uma change própria se vier a ser necessário.
- Qualquer alteração a `frontend/src` — já feita nas duas changes anteriores.

## Decisions

### 1. `frontend/src-tauri/` em vez de um crate `desktop/` na raiz

Alternativa descartada: uma pasta `desktop/` ao nível de `backend/`/`frontend/`, com o seu próprio `src-tauri` dentro. Rejeitada porque não é a convenção do próprio Tauri (que espera `src-tauri` como vizinho do `package.json` do frontend que embrulha, com `frontendDist` relativo — ex. `../dist`), e por `frontend/.gitignore`/o `.gitignore` da raiz já terem uma entrada `src-tauri/gen/` (confirmada em investigação anterior) — consistente com este caminho já ter sido antecipado. Ficar na convenção padrão reduz o número de caminhos relativos a justificar no `tauri.conf.json`.

### 2. Crate Rust standalone, sem workspace com `backend/`

Alternativa descartada: unificar `backend/Cargo.toml` e `frontend/src-tauri/Cargo.toml` num workspace Cargo na raiz. Rejeitada porque os dois crates não partilham código nem dependências com peso suficiente para justificar um grafo de build único (o backend é um servidor Axum/SQLx; o shell Tauri é uma casca de janela em torno de uma SPA) — unificar acrescentaria tempo de compilação cruzado (`cargo build` num afecta o cache do outro) sem benefício. Mantém-se a convenção já existente de `backend/Cargo.toml` ser standalone.

### 3. `capabilities` com âmbito de rede aberto (`*`), não uma lista de domínios

Alternativa descartada: pedir ao utilizador, em build-time ou via variável de ambiente, os domínios das instâncias que vai usar, e gerar `capabilities` restritas a essa lista. Rejeitada porque contradiz o próprio produto — a Mesa é self-hosted e cada instalação escolhe a sua instância livremente, muitas vezes numa rede local sem domínio nenhum (IP de LAN, porta directa). Restringir a build-time obrigaria a recompilar o binário por utilizador/instância, inviável para um cliente distribuído. A troca aceite: o âmbito de rede dos plugins HTTP/WebSocket/Store fica `*` (qualquer origem), e a superfície de confiança passa a ser "em que instância o utilizador escolhe confiar", exactamente como um browser normal já funciona para qualquer site, e exactamente como outros clientes nativos de serviços self-hosted (ex. clientes Matrix/Element) já resolvem o mesmo problema. CSP continua restritiva para tudo o que não for esse tráfego de rede explicitamente necessário (scripts inline, `object-src`, etc. continuam bloqueados).

### 4. Decoração nativa da janela, sem chrome personalizado

Alternativa descartada: janela "frameless" com uma barra de título desenhada pela própria aplicação (padrão comum em clientes tipo Discord). Rejeitada para o MVP por ser trabalho de UI adicional não pedido pelo utilizador ("mesma identidade visual e funcionalidades" — o conteúdo visível já é idêntico ao build web; a moldura da janela nunca fez parte da identidade visual da Mesa, já que no browser essa moldura também não é controlada pela aplicação) e por introduzir trabalho específico por plataforma (botões de janela, arrastar, snap) fora de escopo. Fica como possível trabalho futuro, não como lacuna escondida.

## Risks / Trade-offs

- [As fontes raster existentes (até 256×256) são insuficientes para gerar ícones nítidos nos tamanhos maiores exigidos por `.icns`/Windows] → Mitigação: a tarefa de geração de ícones usa `docs/v2/mesa_logo/screen.png` (1024×1024) como ponto de partida, isolando/recortando a marca com fundo transparente antes de passar por `cargo tauri icon` — não se deve gerar ícones a partir de um upscale artificial das fontes de 256×256.
- [O crachá em `docs/v2/mesa_logo/screen.png` inclui a palavra "Mesa" dentro do mesmo círculo que o emblema floral — confirmado por inspecção visual da imagem, não só pela estatística de pixels. Um ícone de aplicação com texto costuma ficar ilegível a 16–32px (barra de tarefas/dock)] → Mitigação, decidida com o utilizador: a fonte da Tarefa 2.2 usa só o círculo + emblema floral, sem a palavra "Mesa" (recorte/máscara da região do texto, com possível recentragem do emblema dentro do círculo). O logótipo completo com o nome continua a ser usado nas outras superfícies de marca (favicon, topbar, ecrãs de autenticação), inalterado.
- [Âmbito de rede `*` nas `capabilities` é, por desenho, mais permissivo do que o Tauri recomenda por omissão] → Mitigação: aceite conscientemente (Decisão 3) como inerente ao modelo self-hosted do produto; mitigado pela decisão já tomada em `native-client-auth` de a autenticação ser sempre por sessão válida — um âmbito de rede aberto não concede acesso a dados sem uma sessão autenticada na instância de destino.
- [Identificador reverso da aplicação (`com.mesa.app`, indicativo) ainda não está decidido oficialmente] → Mitigação: tratado como parâmetro de configuração isolado num só sítio (`tauri.conf.json`), fácil de corrigir depois sem impacto em código; a tarefa correspondente deve confirmar com o utilizador antes de publicar (relevante para `desktop-packaging-ci`, que usa este identificador nos instaladores).

## Migration Plan

Mudança aditiva — não altera `backend/` nem `frontend/src`. Depende de `frontend-instance-connect` estar implementada para o shell ser utilizável (sem ela, o binário abre mas não tem como se ligar a uma instância). Pode ser desenvolvida em paralelo, testada com `cargo tauri dev` apontando ao `frontend/dist` já existente mesmo antes de `frontend-instance-connect` estar pronta, mas só fica funcionalmente completa depois.

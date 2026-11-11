# Review — Arquiteto de Soluções

**Change:** custom-camera-backgrounds
**Data:** 2026-11-11
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Stack alinhada: Axum/SQLite + SolidJS + `@livekit/track-processors` (já em uso para blur) — sem dependência nova nem serviço novo.
- Componentes claros: colecção de imagens por conta (D1/D2) → preferência local de qual efeito está activo (D3) → um único processador LiveKit alternado por `.switchTo` (D4) → UI nas definições e no menu de blur (D5).
- Escala: no máximo 10 imagens × 5 MiB por conta; nada de fan-out, sem impacto em WS/sinalização.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- Só REST + migração SQLite + pasta de ficheiros, seguindo exactamente o padrão de `avatars_dir`/`message_attachment`. Sem porta, container ou proxy novos.
- **Ponto a confirmar antes do apply:** a biblioteca `@livekit/track-processors` carrega `imagePath` com `new Image()` e `img.crossOrigin = "Anonymous"`. Isto só funciona sem fricção enquanto o frontend consome `/api/auth/camera-backgrounds/{id}` na **mesma origem** do backend — confirmado hoje pelo proxy de dev (`/api` → `BACKEND_HTTP` no `vite.config.ts`) e presumivelmente também em produção via o mesmo reverse proxy usado para o resto do `/api`. Se algum dia o frontend for servido de uma origem diferente da API (CDN estático + domínio próprio da API, por exemplo), a imagem falha a carregar silenciosamente em vez de dar um erro claro, porque `crossOrigin="Anonymous"` descarta credenciais em pedidos cross-origin e o endpoint exige sessão.
  - O `design.md` (D4) já prevê buscar a imagem via `fetch` autenticado e passar um blob URL em vez da URL da API directamente — isto resolve o ponto acima de raiz (blob URL é sempre "same-origin" para o `Image`). Recomendo tornar esse passo **obrigatório na implementação**, não apenas uma mitigação de latência, e não deixar a `imagePath` apontar directamente para a URL autenticada da API.
- Backup/armazenamento: mais uma pasta pequena no mesmo volume dos avatares/anexos; impacto operacional negligível.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **D3 (selecção activa só local, imagens no backend):** decisão consistente com o que já existe para o blur hoje (preferência só no dispositivo) e com o pedido do utilizador (imagens sincronizadas, selecção não precisa de ser). Trade-off aceite e documentado em Non-Goals — OK.
- **Layout de armazenamento (D1):** `CAMERA_BACKGROUNDS_DIR/{account_id}/{filename}` introduz uma estrutura de pastas por conta, diferente do padrão flat já usado em `avatars_dir` (`avatars_dir/{filename}` para contas, `avatars_dir/servers/{filename}` para servidores, sem nesting por dono — a propriedade vive só na BD). Não é errado, mas é uma segunda convenção de disco no mesmo projecto. **Atenção, não bloqueante:** sugiro alinhar com o padrão flat existente (um directório novo e dedicado, ficheiro nomeado pelo uuid, dono resolvido via BD, como os avatares) para não introduzir duas formas diferentes de organizar ficheiros de imagem no mesmo sistema.
- Fundo removido enquanto activo cai para "Sem blur" (D3/spec) — trade-off simples e seguro, igual ao raciocínio já usado para dispositivo desconectado em `audio-video-settings`.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1–D5 com alternativas rejeitadas e porquês (avatar singular vs colecção; API própria vs `/api/account/...`; local vs backend para a selecção activa) — mesmo nível de detalhe do precedente (`dice-appearance-preferences`).
- Sem diagrama: fluxo é linear (upload → lista → escolha local → processador); não justifica mermaid.

## 5. Ponte entre produto e técnico

Veredito: OK

- Pedido do utilizador ("enviar imagens para usar como plano de fundo") está coberto ponta a ponta: upload, gestão (listar/remover), e uso efectivo na câmara (definições + menu da chamada).
- Non-Goals (editor de imagem, fundos partilhados, fundos predefinidos, selecção sincronizada entre dispositivos) foram decisões conscientes registadas, não omissões — reduzem o escopo de forma defensável para uma primeira ronda.

## Bloqueantes antes de implementar

- Nenhum. Recomendo resolver a ressalva da secção 2 (origem/credenciais do `imagePath`) tornando o blob URL obrigatório, e considerar a ressalva da secção 3 (layout de pastas) antes do apply, mas nenhuma das duas impede começar a implementação.

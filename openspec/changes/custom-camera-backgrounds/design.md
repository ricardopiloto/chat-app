# Design

## Context

Ver `proposal.md` — Why. Estado actual:

- Blur: `prefs.blur()` (`devices.ts`, store local `mesa.callPrefs.v2`) guarda `"off" | "light" | "strong"`. `preview.ts` (green room) e `callSession.tsx` (`applyBlur`) chamam dinamicamente `@livekit/track-processors`, verificam `supportsBackgroundProcessors()` e aplicam `processors.BackgroundBlur(radius)` via `LocalVideoTrack.setProcessor` / `stopProcessor`.
- UI: `AudioVideoSettings.tsx` usa um `Segmented` com as 3 opções de blur; `CallControls.tsx` tem um menu popover (`blurOpen`) com as mesmas 3 opções e um ícone de "check" na activa.
- Uploads de imagem existentes (avatares de conta/servidor) seguem o padrão: `axum::body::Bytes` + header `x-mesa-media-type` (fallback `Content-Type`), validação de tipo (`image/jpeg|png|webp`) e tamanho (`MAX_AVATAR_BYTES` = 1 MiB), ficheiro gravado com nome `Uuid::new_v4()` numa pasta configurável (`AVATARS_DIR`), e um `GET` autenticado que serve o ficheiro com `Cache-Control: private, no-store`. Limites de colecção existentes: `MAX_ATTACHMENTS_PER_MESSAGE = 10`, `MAX_ATTACHMENT_BYTES = 5 MiB`.
- `@livekit/track-processors@^0.7.2` expõe `BackgroundProcessor({ mode, blurRadius | imagePath })` com `.switchTo(...)` para trocar de modo no mesmo processador sem reabrir a câmara, substituindo as chamadas directas a `BackgroundBlur`/`VirtualBackground` hoje usadas só para blur.

## Goals / Non-Goals

**Goals:**
- Upload, listagem e remoção de imagens de fundo por conta, persistidas no backend e disponíveis em qualquer dispositivo.
- Escolher, nas definições e no menu de blur da chamada, entre "Sem blur", os níveis de blur existentes, ou um dos fundos personalizados da conta.
- Reaproveitar ao máximo o caminho já existente de blur (mesmo processador, mesma preferência local, mesma UI de menu).

**Non-Goals:**
- Partilhar/ver o fundo de outro utilizador.
- Editor de imagem (recorte, zoom, ajuste de enquadramento) — a imagem enviada é usada como está.
- Fundos animados/vídeo, ou fundos predefinidos pelo produto (galeria "de fábrica").
- Sincronizar entre dispositivos **qual** fundo está activo agora (ver D3) — só as imagens em si sincronizam.
- Mudar o comportamento ou os níveis de blur existentes.

## Decisions

### D1. Tabela `account_camera_background`

Colunas: `id` (uuid, PK), `account_id` (FK `account.id` cascade), `filename` (uuid gerado no upload, nome do ficheiro em disco), `content_type`, `size_bytes`, `created_at`. Sem `label`/nome nesta ronda — a UI mostra miniaturas, não precisa de título.

Ficheiros em `CAMERA_BACKGROUNDS_DIR/{filename}` (layout plano, sem subpasta por conta — mesmo padrão de `avatars_dir`, onde a propriedade vive só na BD, não na árvore de ficheiros), pasta nova configurável por env var com o mesmo padrão de `AVATARS_DIR`.

Alternativa rejeitada: reaproveitar `avatars_dir`/tabela de avatar — avatar é singular por conta (uma imagem, substituição), aqui precisamos de uma colecção; o padrão mais próximo é `message_attachment` (múltiplas linhas por dono), não `account.avatar_filename`.

### D2. API

Segue o padrão já usado para recursos da própria conta (`/api/auth/avatar`, `/api/auth/dice-toolbar`): sem `{account_id}` na rota, a conta vem da sessão autenticada.

- `POST /api/auth/camera-backgrounds` — corpo = bytes da imagem, headers `x-mesa-media-type`/`Content-Type` como em `/api/auth/avatar`; valida tipo (`image/jpeg|png|webp`), tamanho (`MAX_CAMERA_BACKGROUND_BYTES`) e limite por conta (`MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT`); devolve o registo criado (id + metadados, sem bytes).
- `GET /api/auth/camera-backgrounds` — lista os registos (id, content_type, size_bytes, created_at) da conta autenticada, ordenados por `created_at`.
- `GET /api/auth/camera-backgrounds/{id}` — serve os bytes da imagem (autenticado, só o próprio dono), mesma resposta/cache dos avatares.
- `DELETE /api/auth/camera-backgrounds/{id}` — remove o registo e o ficheiro; 404 se não existir ou não pertencer à conta.

Limites propostos (alinhados com os precedentes do domínio — avatar 1 MiB, anexos 5 MiB / 10 por mensagem): `MAX_CAMERA_BACKGROUND_BYTES = 5 MiB`, `MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT = 10`. `POST` acima do limite de contagem devolve erro de validação (o utilizador apaga um fundo antes de enviar outro).

Alternativa rejeitada: aceitar `multipart/form-data` — o resto do projecto usa corpo bruto + header de tipo para uploads de imagem (avatares); manter consistência.

### D3. Selecção activa continua local (como o blur)

A preferência "o que está activo agora" (blur off/light/strong **ou** um fundo específico) continua a viver em `devices.ts` (`prefs`, store `mesa.callPrefs.v2`), tal como o blur hoje — não há API para "qual fundo está seleccionado". Isto significa que, ao mudar de dispositivo, a pessoa volta a escolher o fundo (tal como hoje tem de voltar a escolher o nível de blur); as imagens em si, porém, já estão lá para escolher de novo.

Tipo actualizado: `BlurLevel = "off" | "light" | "strong"` passa a convolver com uma escolha de fundo, por exemplo `type CameraEffect = { kind: "blur"; level: "off" | "light" | "strong" } | { kind: "background"; backgroundId: string }`, com migração do valor antigo (`blur: BlurLevel`) para `effect: CameraEffect` no `load()` da store, preservando compatibilidade com o store existente (mesmo princípio já usado para a chave legacy `mesa.cameraBlur`).

Alternativa considerada: persistir a selecção activa no backend (coerente entre dispositivos). Rejeitada nesta ronda para não aumentar o escopo além do pedido (guardar as imagens) e para manter o mesmo modelo mental do blur já existente; pode ser um follow-up.

Se o fundo seleccionado localmente for apagado (noutro dispositivo, ou já não existir), o sistema cai para `{ kind: "blur", level: "off" }`.

### D4. Troca de processador: `BackgroundBlur`/`VirtualBackground` → `BackgroundProcessor`

`preview.ts` e `callSession.tsx` continuam independentes como hoje (cada um sobre a sua própria track — cópia local no green room, track publicada na chamada); cada um passa a manter **a sua própria** instância de `BackgroundProcessor({ mode: "background-blur" | "virtual-background", blurRadius?, imagePath? })`, criada quando o efeito activo deixa de ser "off", e usa `.switchTo(...)` para alternar entre blur e fundo de imagem **sem reabrir a câmara enquanto algum efeito está activo**.

Para "Sem blur" (`{ kind: "blur", level: "off" }"`), mantém-se `video.stopProcessor()` como hoje — **não** usar `.switchTo({ mode: "disabled" })` para este caso: essa chamada só desliga o efeito visual dentro do transformer, mas mantém o pipeline de segmentação (modelo de ML) a correr por frame, o que seria uma regressão de custo de CPU/GPU face ao comportamento actual de "off" (sem processador nenhum). `.switchTo` serve só para alternar **entre** efeitos não-"off".

`imagePath` **nunca** aponta directamente para a URL autenticada `GET /api/auth/camera-backgrounds/{id}` — a biblioteca carrega a imagem com `new Image()` + `img.crossOrigin = "anonymous"`, que descarta credenciais em qualquer pedido que não seja estritamente same-origin. Em vez disso, buscar a imagem antes via `fetch` autenticado e passar o `URL.createObjectURL(blob)` resultante como `imagePath` (revogando o blob anterior ao trocar de fundo) — isto é obrigatório, não uma optimização de latência.

Mantém-se `supportsBackgroundProcessors()` como guarda de suporte do browser, igual a hoje, cobrindo tanto blur como fundo de imagem (`unsupported` mostra o mesmo erro inline já existente).

### D5. UI

- **Definições (Áudio & Vídeo):** a secção de blur ganha, abaixo do `Segmented` existente, uma galeria de miniaturas dos fundos da conta (grelha simples, uma miniatura seleccionável por fundo + botão "Remover" por item) e um botão "Adicionar fundo" que abre o selector de ficheiro do sistema. Upload mostra estado de progresso/erro inline (reaproveita `call-inline-error`).
- **Menu de blur da chamada (`CallControls.tsx`):** a lista de 3 opções (off/light/strong) ganha, depois das 3, uma entrada por fundo personalizado (miniatura pequena + nome genérico "Fundo N"), com o mesmo padrão de "check" na opção activa. Sem opção de upload aqui — upload só nas definições; o menu só escolhe.

## Risks / Trade-offs

- [Carregar a imagem pela rede antes de aplicar o efeito pode introduzir atraso perceptível ao trocar de fundo em chamada] → Mitigar: pré-carregar (fetch + cache em memória) as miniaturas/imagens da conta quando a página de definições ou o menu de blur abre, antes de o utilizador escolher.
- [Migração do formato guardado em `localStorage` de `blur` para `effect`] → Mesma técnica já usada para a chave legacy `mesa.cameraBlur`: ler o campo antigo uma vez e migrar.
- [Imagens grandes custam espaço em disco por conta] → Limite de 5 MiB × 10 fundos por conta (50 MiB no pior caso), igual ordem de grandeza dos anexos de mensagem.
- [Mudar a API interna do processador (`BackgroundBlur`/`VirtualBackground` → `BackgroundProcessor`) pode mudar o comportamento do blur já em produção] → Cobrir com o mesmo teste manual de blur existente antes/depois da troca; o pacote mantém `BackgroundBlur`/`VirtualBackground` como atalhos descontinuados caso seja preciso reverter rapidamente.

## Migration Plan

1. Migração da tabela `account_camera_background` + pasta de armazenamento + API backend + testes de contrato.
2. Frontend: cliente de API e tipos; migração do store local (`blur` → `effect`).
3. Troca do processador para `BackgroundProcessor` em `preview.ts`/`callSession.tsx`, mantendo blur a funcionar como hoje.
4. UI: galeria de upload nas definições; extensão do menu de blur na chamada.
5. Rollback: reverter para `BackgroundBlur`/`VirtualBackground` directos se `BackgroundProcessor` mostrar regressão; esconder a galeria e manter só blur no menu/definições sem remover os dados já enviados.

## Open Questions

Nenhuma bloqueante.

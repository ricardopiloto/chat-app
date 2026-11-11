# Tasks

## 1. Backend: persistência e API

- [x] 1.1 Adicionar migração `account_camera_background` (`id`, `account_id` FK cascade, `filename`, `content_type`, `size_bytes`, `created_at`, índice em `account_id`) e `CAMERA_BACKGROUNDS_DIR` em `config.rs` (mesmo padrão de `AVATARS_DIR`, layout plano `CAMERA_BACKGROUNDS_DIR/{filename}`, sem subpasta por conta). Verify: migração aplica em BD vazia e já existente.
- [x] 1.2 Em `domain`, adicionar `MAX_CAMERA_BACKGROUND_BYTES` (5 MiB) e `MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT` (10), reaproveitando `normalize_avatar_type`/`is_allowed_avatar_type` para o tipo de imagem. Verify: unit tests para limites e tipos aceites/rejeitados.
- [x] 1.3 Implementar `db::camera_background` (insert, list_by_account, find_by_id_and_account, delete) seguindo o padrão de `db/attachment.rs`. Verify: testes de integração do módulo db.
- [x] 1.4 Expor `POST`/`GET`/`DELETE /api/auth/camera-backgrounds` e `GET /api/auth/camera-backgrounds/{id}` (auth obrigatória, restrito ao próprio dono), com `DefaultBodyLimit` análogo ao de `/api/auth/avatar`. Verify: contract tests — upload/list/get/delete round-trip, 413 acima do limite de tamanho, erro de validação acima do limite de contagem, 404 ao aceder/apagar fundo de outra conta, 401 sem sessão.

## 2. Frontend: tipos, cliente de API e store local

- [x] 2.1 Adicionar cliente de API + tipos (`CameraBackground { id, contentType, sizeBytes, createdAt }`) para listar/enviar/remover fundos. Verify: `tsc --noEmit`.
- [x] 2.2 Em `devices.ts`, substituir `blur: BlurLevel` por `effect: CameraEffect` (`{ kind: "blur"; level: BlurLevel } | { kind: "background"; backgroundId: string }`), com migração do valor antigo no `load()` (mesmo princípio já usado para a chave legacy `mesa.cameraBlur`). Verify: valor antigo `blur: "light"` migra para `{ kind: "blur", level: "light" }` sem perder a escolha.

## 3. Frontend: aplicar o efeito na câmara

- [x] 3.1 Em `preview.ts` e `callSession.tsx` (cada um com a sua própria instância, continuam independentes como hoje), manter `video.stopProcessor()` para `{ kind: "blur", level: "off" }`, e para qualquer outro efeito criar/reaproveitar um `processors.BackgroundProcessor({ mode: "background-blur" | "virtual-background", blurRadius | imagePath })` e usar `.switchTo(...)` para alternar **entre** esses efeitos sem reabrir a câmara. Não usar `.switchTo({ mode: "disabled" })` para "off" — isso manteria a segmentação a correr sem necessidade. Verify: alternar entre off/light/strong continua a funcionar como hoje (regressão manual), e escolher "off" para a câmara volta a não ter processador nenhum (sem custo de CPU extra observável).
- [x] 3.2 Quando o efeito activo é `{ kind: "background" }`, resolver `imagePath` sempre via `fetch` autenticado a `GET /api/auth/camera-backgrounds/{id}` + `URL.createObjectURL(blob)` (revogando o blob anterior ao trocar) antes de chamar `switchTo` — nunca passar a URL da API directamente como `imagePath` (a biblioteca carrega com `crossOrigin="anonymous"`, que descarta credenciais). Verify: trocar de fundo na pré-visualização e em chamada aplica a imagem correcta; erro ao carregar cai para `{ kind: "blur", level: "off" }` com o mesmo aviso inline de blur não suportado.
- [x] 3.3 Se o `backgroundId` guardado localmente já não existir (apagado noutro dispositivo), cair para `{ kind: "blur", level: "off" }` ao aplicar. Verify: apagar o fundo activo numa aba e reabrir noutra aba não trava a câmara.

## 4. Frontend: UI

- [ ] 4.1 Pendente: a implementação actual não segue o design-system da aplicação (botões e `<label><input type="file">` ad-hoc + CSS próprio em `voice.css`, em vez de reaproveitar `Button`/`Icon` e o padrão `ui-button` + input `sr-only` já usado no upload de avatar em `pages/Account.tsx`) — precisa de revisão antes de se considerar concluída. Em `AudioVideoSettings.tsx`, adicionar galeria de miniaturas dos fundos da conta (seleccionar, remover por item) e botão "Adicionar fundo" com selector de ficheiro, abaixo do `Segmented` de blur; estado de progresso/erro de upload inline. Verify: enviar, seleccionar, remover um fundo funciona de ponta a ponta nas definições; i18n pt-BR/en presentes; markup/estilo alinhados ao design-system.
- [ ] 4.2 Bug (não é corte de escopo — este requisito sempre fez parte da change): o código já tenta listar os fundos personalizados no menu (`<For each={backgroundList()}>` em `CallControls.tsx`), mas as entradas não aparecem/funcionam corretamente na prática — pendente de investigação e correcção. Em `CallControls.tsx`, estender o menu de blur para listar, depois das 3 opções existentes, uma entrada por fundo personalizado (miniatura + "check" na activa). Verify: escolher um fundo personalizado no menu durante uma chamada aplica-o e fecha o menu, igual ao comportamento actual do blur.
- [ ] 4.3 Depende de 4.2 estar funcional para poder ser validada no menu da chamada; permanece incompleta enquanto o menu de blur não listar os fundos corretamente. Pré-carregar miniaturas/imagens da conta ao abrir a página de definições ou o menu de blur, para reduzir o atraso ao trocar de fundo. Verify: primeira troca de fundo numa sessão não mostra um atraso visível maior que o de trocar de nível de blur.

## 5. Verificação integrada

- [ ] 5.1 Smoke manual: enviar 2 fundos nas definições, escolher um deles, entrar numa chamada e confirmar que os outros participantes vêem o fundo aplicado (não o blur); trocar para blur e depois para o outro fundo sem reabrir a câmara. Verify manual.
- [ ] 5.2 Smoke manual: tentar enviar um 11.º fundo (acima do limite) e um ficheiro acima do limite de tamanho — ambos rejeitados com mensagem clara; apagar um fundo liberta espaço para enviar outro. Verify manual.

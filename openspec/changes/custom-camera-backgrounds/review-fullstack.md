# Review — Desenvolvedor Fullstack

**Change:** custom-camera-backgrounds
**Data:** 2026-11-11
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: Atenção

- API `POST`/`GET`/`DELETE /api/auth/camera-backgrounds` + `GET .../{id}` é implementável directamente sobre o padrão já existente em `api/avatars.rs` (`media_type_from_headers`, `validate_body`, `write_file`, `image_response`) — reaproveitar essas funções (ou extraí-las para um helper comum) em vez de duplicar a validação de tipo/tamanho.
- Migração (1.1): `id` próprio por imagem (não PK composta) está certo, porque cada imagem precisa de ser endereçável/removível individualmente — mesmo padrão de `message_attachment`, diferente da PK composta de `account_channel_dice_appearance` (que é 1:1 por conta+canal). Confirmar índice em `account_id` para a query de listagem (`list_by_account`).
- Limite de contagem (`MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT`): o `design.md`/tasks não especificam transacção; um `COUNT` seguido de `INSERT` tem corrida teórica (duas requisições em paralelo podem passar ambas do limite). **Não é um problema novo** — `scenes.rs` já tem exactamente o mesmo padrão para `MAX_SCENES_PER_CHANNEL` (`count >= MAX_SCENES_PER_CHANNEL` antes do insert) — então é consistente com o resto do código, só vale registar como limitação conhecida, não bloqueante.
- Erros: `ApiError::bad_request` (tipo/tamanho/limite), `not_found` (fundo inexistente ou de outra conta), `unauthorized` (sem sessão) — todos já existem e são usados em `avatars.rs`; nada novo a introduzir em `error.rs`.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- **Risco concreto em 3.1 (troca de `BackgroundBlur`/`VirtualBackground` por `BackgroundProcessor` + `.switchTo`):** `switchTo({ mode: "disabled" })` **não** é equivalente a `video.stopProcessor()`. Pela leitura do código do pacote (`dist/index.mjs`), `"disabled"` só marca `backgroundDisabled: true` dentro do transformer — o pipeline de segmentação (modelo de ML a correr por frame) continua activo, só o efeito visual é que é ignorado. Hoje, escolher "Sem blur" chama `video.stopProcessor()`, removendo o processador por completo (sem custo de CPU/GPU). Se a implementação usar só `.switchTo({mode:"disabled"})` para "off", isso é uma **regressão de desempenho/bateria** em "Sem blur" que hoje não existe.
  - Recomendo manter o comportamento actual para "off": continuar a chamar `video.stopProcessor()` quando o efeito activo é `{ kind: "blur", level: "off" }`, e só usar `BackgroundProcessor` + `.switchTo` para alternar **entre** efeitos não-"off" (blur leve/forte ↔ fundo de imagem) sem reabrir a câmara. Vale ajustar a task 3.1 para deixar isto explícito.
- **Clareza de redacção em 3.1/D4:** "instanciar um único `BackgroundProcessor` por sessão de câmara" pode ler-se como se `preview.ts` (green room) e `callSession.tsx` (chamada ao vivo) passassem a partilhar a mesma instância — não é esse o caso nem deveria ser, continuam a operar sobre tracks de vídeo diferentes (cópia local vs track publicada), tal como hoje com dois processadores de blur independentes. Vale reescrever essa frase no `design.md` para "uma instância por módulo, cada um continua independente como hoje", para quem for implementar não interpretar mal.
- 2.2 (migração `blur` → `effect` no `localStorage`): mesma técnica já usada para a chave legacy `mesa.cameraBlur` — consistente, baixo risco. Confirmar que `effect` ausente (conta nova) resolve para `{ kind: "blur", level: "off" }`, igual ao padrão actual (`prefs.blur() ?? "off"`).
- 4.1/4.2 (UI): `Segmented` existente não suporta nativamente itens com miniatura de imagem — a galeria de fundos provavelmente precisa de um componente novo (grelha de botões, não o `Segmented`); o menu de blur (`CallControls.tsx`) é um popover simples, estender a lista com entradas de imagem é directo (mesmo padrão de "check" na opção activa).

## 3. Deploy e operação

Veredito: OK

- Só migração SQLite + pasta de ficheiros + rotas novas; nenhuma env var obrigatória nova além de `CAMERA_BACKGROUNDS_DIR` (com default sensato, como `AVATARS_DIR` tem).
- Nenhuma mudança de infraestrutura (containers, portas) — consistente com o resto do backend.

## 4. Qualidade de código

Veredito: OK

- Tasks com passos de verificação concretos (contract tests, `tsc --noEmit`, smoke manual) seguindo o padrão do repositório.
- Reaproveitamento explícito de `normalize_avatar_type`/`is_allowed_avatar_type` em vez de duplicar validação de tipo de imagem.

## 5. Execução das decisões arquitecturais

Veredito: OK

- Tasks seguem D1–D5 sem reabrir decisões já tomadas (selecção local, sem editor de imagem, sem partilha entre utilizadores).
- O ponto levantado na secção 2 (regressão de "off") não muda nenhuma decisão de `design.md` — é um detalhe de implementação dentro de D4, não um novo trade-off.

## Bloqueantes antes de implementar

- Nenhum. Recomendo incorporar no `design.md`/`tasks.md` antes do apply: (a) "off" continua a usar `stopProcessor()`, só os outros efeitos usam `.switchTo`; (b) clarificar que `preview.ts` e `callSession.tsx` mantêm instâncias de processador independentes.

## Limitações técnicas a reportar ao Arquiteto

- `imagePath` da biblioteca carrega a imagem via `<img crossorigin="anonymous">`; só funciona sem fricção em same-origin ou passando um blob URL já obtido por `fetch` autenticado (ver ressalva do Arquiteto na secção 2 do review dele) — concordo que o blob URL deve ser obrigatório, não opcional.
- `.switchTo({mode:"disabled"})` não pára a segmentação (só desliga o efeito visual); isto é uma particularidade da biblioteca que a task 3.1 precisa de contornar explicitamente para não regressar o custo de CPU do estado "Sem blur".

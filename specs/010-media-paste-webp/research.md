# Research: 010-media-paste-webp

## 1. Conversão WebP no cliente

**Decision**: Usar `HTMLCanvasElement` + `canvas.toBlob('image/webp', quality)` (fallback: se o browser não produzir WebP, falhar com feedback claro — não enviar PNG “disfarçado”). Qualidade inicial **0.82** (equilíbrio tamanho/legibilidade de capturas de ecrã; ajustável numa constante).

**Rationale**: Zero dependências nativas; browsers alvo do Mesa já suportam encode WebP; SCR-005 exige legibilidade, não máxima compressão.

**Alternatives considered**: `wasm`/`sharp`-style encode (overkill self-host); enviar PNG e converter no servidor (quebra E2EE / servidor veria pixels); WebP animado para GIFs (rejeitado na clarificação — manter GIF animado).

## 2. Detecção GIF animado vs estático

**Decision**: Parser leve no cliente: percorrer blocos GIF; se existir **mais do que um** Image Descriptor (ou extensão Netscape com loop + ≥2 frames), tratar como **animado** e manter `image/gif`. Caso contrário (um frame) → converter para WebP como PNG/JPEG.

**Rationale**: Clarificação explícita; Canvas só vê o 1.º frame e destruiria animação se forçássemos WebP.

**Alternatives considered**: Sempre manter qualquer GIF (simples, mas não cumpre “estático → WebP”); `ImageDecoder` (API menos universal); enviar GIF sempre (rejeitado).

## 3. Âmbito do listener `paste`

**Decision**: `addEventListener('paste', …)` no contentor do painel do canal de texto (área de mensagens + composer), não só no `<textarea>`. Se `clipboardData` tiver `items`/`files` de imagem: `preventDefault` parcial — processar imagens para pending; se houver texto plano na mesma colagem, inserir no draft do composer (caret no fim ou posição actual se o input estiver focado). Colar só texto: **não** `preventDefault` no pane (deixar o browser inserir no foco actual); se o foco não for o composer, comportamento nativo (ex. nada no draft) — sem anexo fantasma.

**Rationale**: FR-001 / clarificação “todo o painel”; evita exigir foco no composer para screenshots.

**Alternatives considered**: Só no composer (rejeitado); captura global `window` (risco de interferir noutros panes).

## 4. Limite 5 MB (binário)

**Decision**: `MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024` (5 MiB) no frontend e backend; body limit Axum ≈ `5 MiB + 64 KiB` (cifra/headers). Medição do produto: ficheiro/anexo **em claro** após conversão (colagem) ou ficheiro escolhido; cliente rejeita se `file.size > MAX` antes do upload. Servidor continua a rejeitar ciphertext `body.len() > MAX` (ligeiramente mais estrito que clear+overhead — aceitável; cliente já corta em clear ≤5 MiB e overhead AES-GCM é ~28 B).

**Rationale**: Spec pede 5 MB; alinhar ao estilo 009 (binário MiB); um único constante evita drift FE/BE.

**Alternatives considered**: 5 000 000 decimal; manter 8 MiB no servidor e só FE (rejeitado — FR-005); medir só ciphertext sem mensagem de 5 MB no clear (pior UX).

## 5. Seletor vs colar

**Decision**: Seletor de ficheiros: tipos 009 inalterados; **sem** conversão WebP obrigatória; só teto 5 MiB. Colar: estáticos → WebP (`image/webp`); GIF animado → `image/gif`.

**Rationale**: Spec Out of Scope / Assumptions.

## 6. Texto + imagem na mesma colagem

**Decision**: Extrair `text/plain` do `clipboardData` → append/insert no `draft`; cada imagem → pending (respeitando max 10). Ordem: processar imagens primeiro (feedback de limite), depois texto.

**Rationale**: Clarificação 2026-09-04.

## 7. Falhas

**Decision**: Conversão falha / WebP não suportado / oversize / max 10 → `setError` com mensagem PT clara; não adicionar pending inválido; não POST mensagem parcial.

**Rationale**: FR-007.

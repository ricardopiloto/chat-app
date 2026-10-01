# Verificação — frontend-v2-foundation

Registo da reescrita (revisão de 2026-10-01). A verificação anterior desta fase foi descartada: o código descendia da v1.

## 7.1 Script de sobreposição

`frontend-v2/scripts/check-v1-overlap.mjs` (`npm run check:v1-overlap`). Sequências de 6 tokens, sem comentários nem espaços, `frontend-v2/src` contra todo `frontend/src`. Limiares: UI (`.tsx`, `.css`) ≤ 15%, lógica (`.ts`) ≤ 30%. Excepções justificadas em `frontend-v2/scripts/v1-overlap-exceptions.json`.

Verificação do próprio script: um ficheiro copiado da v1 deu 100% e reprovou; um ficheiro escrito de novo deu 16% e passou.

## 7.2 Linha de base (antes da reescrita)

75 ficheiros, sobreposição ponderada **62%**, 69 reprovados. É a lista do que as fases têm de reescrever. Ficheiros desta fase na linha de base:

```
FAIL     99% (max 30%)    4849 tok  logic api/client.ts
FAIL     99% (max 30%)     846 tok  logic api/ws.ts
FAIL     79% (max 30%)     173 tok  logic i18n/detect.ts
FAIL     40% (max 30%)     516 tok  logic i18n/index.ts
FAIL     35% (max 30%)    4881 tok  logic i18n/catalogs/pt-BR.ts
FAIL     34% (max 30%)    4363 tok  logic i18n/catalogs/en.ts
FAIL     27% (max 15%)    1979 tok  ui    components/ui/index.tsx
FAIL     25% (max 15%)    2187 tok  ui    components/ui.css
FAIL     18% (max 15%)    4659 tok  ui    styles.css
FAIL     15% (max 15%)      90 tok  ui    api/query.tsx
```

Lista completa guardada no histórico desta verificação (execução de `npm run check:v1-overlap`).

## 9.1–9.3 Paridade funcional e política de backend

- `docs/v2/parity-checklist.md`: 132 itens numerados (AUT, CTA, SHL, SRV, CHN, TXT, NTF, VOZ, CRP, TRV) mais 6 exclusões (EXC) com referência. Fontes: `stitch-prompt.md` §3–§5, `README.md`, `backend/src/api` e contratos de `specs/002-fase-1-mvp`.
- Verificação mecânica: as 59 rotas do backend e os 14 eventos WS emitidos aparecem no documento (em itens ou em exclusões); nenhum item sem fase nem critério.
- `docs/v2/contracts/backend-change-policy.md`: política (aditiva, retrocompatível, tarefa própria, `cargo test`) e registo de alterações (vazio).

## 7.3–7.4 Contratos criptográficos

- `docs/v2/contracts/crypto-formats.md`: cofre de identidade, caixa selada, envelope de servidor, chave de canal, cifra de mensagem e de anexo.
- `docs/v2/contracts/vectors/crypto-vectors.json`: 3 cofres, 3 caixas seladas, 3 pacotes AES, 1 mensagem, 3 casos negativos, gerados por `scripts/contracts/gen-vectors.mjs` (aplicação anterior como oráculo).
- Verificação dos tamanhos contra os dados reais gravados no backend: `sealed_key` e `sealed_blob` de 80 bytes (32 + 32 + 16); mensagem de 73 bytes de texto → 101 bytes (12 + 73 + 16); cofre com `wrapped` de 48 bytes.
- `npm run test:contracts` (`scripts/contracts/run.mjs`): a implementação de referência `reference.mjs`, escrita a partir do documento, passa **24/24**. Com um vetor adulterado falha (2 falhas); com uma implementação que deriva o nonce da caixa selada de forma diferente falha (6 falhas).
- Implementação nova: `node scripts/contracts/run.mjs --impl <módulo>` (interface em `reference.mjs`).

**Limite de proveniência.** A separação "quem escreve a especificação não implementa" não existe num único agente: o documento de formatos foi escrito depois de ler a implementação existente (`identity.ts`, `serverKey.ts`). O que a protege não é a separação mas o portão: (a) o documento tem de bastar a uma implementação independente (a de referência passa os vectores e uma errada falha); (b) o script de sobreposição de código reprova qualquer cópia.

## 1.x / 6.2 Scaffold

- `vite.config.ts` e `eslint.config.js` reescritos (a versão anterior era a configuração da v1 comprimida). `npm run lint` sem erros; `npm run build` (tsc + vite) conclui.
- 6.2: com a nova configuração, `npm run dev` de `frontend-v2` serve `https://localhost:1421/` (200) e a v1 serve `https://localhost:1420/` (200) em simultâneo, sem conflito de porto.

## 4.1–4.3 Cliente de API e WebSocket (reescrito)

Estrutura nova em `frontend-v2/src/api/`: `http.ts` (transporte, `ApiError`), `types.ts` (tipos a partir dos DTOs em `backend/src`), `endpoints/{auth,servers,channels,conversation,voice}.ts` (um objecto por recurso), `realtime.ts` (socket com recuo exponencial, estado de entrega, keep-alive `ping`), `queryKeys.ts`, `query.tsx`, `limits.ts`, `helpers.ts`. `client.ts` e `ws.ts` passaram a **camadas de alias transitórias** (cada linha mapeia um nome antigo para o módulo novo) para os ecrãs ainda não reescritos; apagam-se quando as fases as deixarem de usar.

- 4.1: nenhum módulo de `src/api` importa `solid-js`, excepto `query.tsx` (o provider). `tsc --noEmit` limpo.
- 4.2/4.3: `node scripts/verify-api.mjs` contra o backend real (base de dados nova) — **14/14**: sessão sem login devolve 204, registo, `me`, login, erro de credenciais como `ApiError`, nome a mostrar, criar servidor com custódia, canais de bootstrap, cargos/membros/presença, mapeamento do corpo de erro, `presence` recebido ao ligar ao `/ws`, `message.new` entregue após `POST` de mensagem, logout.
- **Achados do backend real** (a documentação estava desactualizada): (a) `GET /api/auth/me` responde **204** sem sessão, não 401; (b) o evento de presença chama-se `presence` com `{ online_account_ids }`, não `presence.update`; (c) o backend não emite `channel.created` nem `server.created`. Registados em `docs/v2/parity-checklist.md` §11 e nos comentários de `realtime.ts`.
- Sobreposição de código com a v1 em `src/api`: 19% ponderado, 0 reprovados. Excepção justificada: `api/types.ts` (tipos de rede fixados pelo contrato do backend).

## 1.4 / 2.x Tailwind e tokens

`node scripts/verify-tokens.mjs` (tokens agora em `src/tokens.css`, fora de `styles.css`): paleta escura igual à declarada por 28 mockups; tema claro define os 47 tokens de cor (11 `*-fixed*` mantêm o valor escuro de propósito); escala tipográfica (11 estilos), espaçamento (9 degraus), breakpoints 767/768–1024/1025, três famílias, elevação nos dois temas, escala de raio. Decisão sobre o raio: manteve-se 4/8/12 e acrescentou-se `lg` = 16px (cartões e diálogos). Os valores claros são extrapolados (comentário em `tokens.css`). Classes Tailwind (`bg-primary-container`, `text-on-surface`, `shadow-floating`, `tablet:`/`desktop:`) resolvem pelas variáveis CSS e mudam com o tema; confirmado em `/__foundation` nos dois temas.

## 3.x Biblioteca base

`src/components/ui/` reescrita (Icon, Button, Form: TextField/Select/Radio/Checkbox/Switch/Segmented, Overlay: Dialog/Toast/ContextMenu, Display: Avatar/Badge/MonoLabel/Tooltip/Card, Logo) com estilos em `components/ui.css` feitos de utilitários Tailwind sobre os tokens. As classes `.ui-button`, `.field`, `.choice`, `.switch`, `.dialog` mantêm-se como ganchos porque as telas ainda não reescritas as usam.

Verificado em `https://localhost:1421/__foundation`, tema escuro e claro, por captura e por script no navegador:
- Botões primário/secundário/perigo/ícone/desativado; campos com normal/erro/desativado; radio, checkbox, toggle, selector segmentado; avatares com indicador online/offline; selos mono; tooltip; cartão com cabeçalho; tela mostra o ponto de quebra activo (mobile/tablet/desktop) e o estado da consulta `GET /api/auth/me` (4.4: pendente → "sem sessão ou servidor indisponível" sem backend).
- Diálogo: abre; fecha por Escape; fecha por clique no fundo (3.4). Menu de contexto: abre por `contextmenu` com item `danger`, fecha por clique fora, abre por toque longo de 500ms (3.5, eventos de toque sintéticos; não testado num dispositivo real).
- 5.2: alternar pt-BR ↔ en troca o texto sem recarregar e actualiza `<html lang>`; `scripts/verify-i18n.mjs` 14/14. Catálogos novos têm só as chaves da tela; as chaves `foundation.*` saíram do catálogo `legacy`.

## 6.1 / 6.3

`npm run build` conclui; `grep "frontend/" dist` sem resultados. `git status --short frontend/` sem alterações.

## 8.1 Aplicação do protocolo a `/__foundation`

Referência: `docs/v2/mesa_sistema_de_design_tokens_componentes_guia_de_ui/screen.png` (380×1600, tema escuro, só legível a escala reduzida). Escopo comparado: os elementos da tarefa 8.4 (a secção de chat, palco, ícones e mapa de telas do guia são de produto e pertencem a outras fases).

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Botões em pílula com ícone (primário/secundário/perigo/ícone) | presente | presente | |
| Toggle (não checkbox) para interruptores | presente | presente | |
| Radio e checkbox nativos com cor do tema | presente | presente | |
| Cartão com cabeçalho (ícone + rótulo mono + título) | presente | presente | |
| Selector segmentado | presente | presente | |
| Selos mono (E2EE, AO VIVO, papel, estado) em caixa alta | presente | presente | |
| Avatar com indicador de presença | presente | presente | |
| Logo oficial no cabeçalho | presente | presente | |
| Excluídos ausentes | | sim | |

## 8.2 Marca

`Logo` (`emblem`/`full`) a partir de `src/assets/`; substitui o quadrado "M" em Auth, Invite, topbar e painel de boas-vindas do AppShell; `favicon.png` e `apple-touch-icon.png` ligados em `index.html`. `grep 'class="(brand|mini|welcome)-mark"' src` sem ocorrências em TSX.

## 10.1 Sobreposição com a v1 (ficheiros desta fase)

`npm run check:v1-overlap`: `tokens.css` 4%, `ui.css` 3%, `pages/Foundation.tsx` 12%, `components/ui/index.tsx` 4%, catálogos 3–4%, `api/client.ts` 4%, `api/ws.ts` 11%, `api/query.tsx` 14%: todos dentro dos limiares. Seis ficheiros pequenos de `components/ui/` ficam entre 19% e 33% e têm excepção justificada em `scripts/v1-overlap-exceptions.json` (contrato público consumido pelas telas existentes + idiomas do framework). `styles.css` (regras legadas de auth/shell, 24%) tem excepção transitória; cada fase apaga as regras que substitui.

## 10.2 Classificação de `/__foundation`

**Fiel**, no escopo da tabela de 8.1 (8.4): todos os elementos obrigatórios presentes, cores e tipografia vindas dos tokens. Limitações: comparação contra uma captura de referência de 380px de largura, a escala reduzida; sem teste em dispositivo táctil real.

## 10.3 Paridade

`docs/v2/parity-checklist.md`: nenhum item sem fase. Itens desta fase (TRV-01 diálogos, TRV-03 toasts, TRV-04 feedback temporário, TRV-06 iniciais de avatar) marcados como verificados; o texto "Copiado" em si fica a cargo de quem usar o `Toast`.

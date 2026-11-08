# Design

## Context

Ver `proposal.md`. Estado actual, confirmado por leitura directa do código nesta sessão:

- `frontend/src/pages/Unlock.tsx` — ordem actual de blocos dentro do `<AuthFrame single>`: (1) cartão identidade (avatar/nome/handle + badge "On this device"); (2) cartão de instância, só nativo, com botão "Use another account or instance"; (3) caixa "Vault notice", sempre visível, mostrando `unlock.noticeBody` ou `unlock.noticeMissing` consoante `noLocalCopy()`/`nothingAnywhere()` — nunca ocultada; (4) campo de senha; (5) aviso condicional extra quando `nothingAnywhere()`; (6) botão "Unlock"; (7) divisor "ou"; (8) parágrafo "Can't unlock?" + cartão "Recover identity" (título, texto, botão que abre o `Dialog` de confirmação); (9) rodapé com "Not @handle? Switch account" e, só nativo, "Switch account (ends this session)".
- `frontend/src/pages/Auth.tsx` — no modo login: segmented login/register, campo handle, campo senha (com link "forgot password"), botão submeter, divisor, botão para trocar de modo, e uma linha de rodapé com `auth.protocol` + `auth.cipher` (ex.: "Protocolo X" / "Cifra Y"). O `Auth.tsx` usa `<AuthFrame single>`, cujo cabeçalho simples não mostra nenhum badge E2EE (esse badge só existe no layout de duas colunas, quando `single` é falso). A linha não é redundante com nada no ecrã — é só jargão técnico sem função clara no caminho de login.
- `openspec/specs/frontend-v2/entry-screens/spec.md` e `openspec/specs/frontend-v2/auth/spec.md` governam exactamente estes ecrãs (criadas/modificadas pela change arquivada `2026-11-04-parley-public-home-and-login`). Cenários directamente tocados por esta change: **"Recuperação continua acessível"** (*"«Esqueci a senha» (login) e «Recuperar identidade» (desbloqueio) continuam visíveis sem exigir uma tentativa falha"*) — restringe D2; **"Trocar de conta"** (*"a sessão termina e a web abre `/login`; no desktop, `nativeEntry` volta a 'home' e a tela inicial abre com a instância atual seleccionada"*) — restringe D3; e os requisitos "Controles das telas de entrada têm uma só escala visual" e "O sistema de design não é alterado" (`tokens.css`/`tailwind.config.ts`/`components/ui.css`/`components/ui/` intocáveis, já automatizado por `frontend/scripts/verify-entry-screens.mjs`) — restringem D1–D4 em conjunto. Nenhum destes requisitos muda de texto com esta change: ela só os implementa dentro do que já está aceite, daí `skip_specs: true` (ver `proposal.md`).

## Goals / Non-Goals

**Goals:**
- Reduzir o `Unlock.tsx` ao essencial para o caminho feliz: identidade, senha, continuar — com a explicação técnica do vault e a recuperação de identidade acessíveis mas não sempre expostas.
- Remover ruído técnico redundante do rodapé do `Auth.tsx` no modo login.
- Preservar toda a lógica e todos os estados de erro/edge case já tratados (`bad_password`, `missing_vault`, `short`, `failed`, `nothingAnywhere()`, `noLocalCopy()`).

**Non-Goals:**
- Não mudar o fluxo de recuperação de identidade em si (o `Dialog` de confirmação e `session.recover` continuam iguais).
- Não re-desenhar o `Auth.tsx` no modo registo (painel de features, `RecoverySetup`, etc.) — fora de escopo.
- Não corrigir as regressões visuais já conhecidas do refactor anterior do `Unlock.tsx` (badge, altura de botão, texto de erro) — isso é outra change, não esta.

## Decisions

### D1: Caixa "Vault notice" deixa de ser sempre visível

Mostrar o aviso só quando `noLocalCopy()` for verdadeiro (primeiro acesso neste dispositivo, ou servidor sem cópia local) — no caminho comum (vault local já presente, sem problema), o bloco não aparece. Alternativa descartada: manter sempre visível mas mais pequena — rejeitada porque o problema não é o tamanho, é mostrar a mesma explicação de criptografia em todas as sessões para quem já a leu a primeira vez.

### D2: Cartão "Recover identity" vira um link

Substituir o cartão (título + texto + botão, numa caixa `bg-surface-container`) por um único link de texto sob o botão principal (algo como "Esqueceu a senha? Recuperar identidade"), que abre o mesmo `Dialog` de confirmação já existente. Isto tem de continuar a satisfazer o cenário "Recuperação continua acessível" (`frontend-v2/entry-screens`): o link fica sempre visível e acessível, nunca escondido atrás de uma tentativa de senha falhada. O diálogo já tem o aviso completo (`auth.recoveryWarning`) — nada se perde, só deixa de estar permanentemente visível numa caixa própria. Alternativa descartada: manter o cartão mas remover o parágrafo "Can't unlock?" antes dele — rejeitada porque ainda deixaria duas apresentações da mesma ideia (um parágrafo de ajuda e um cartão) no ecrã.

### D3: Um só ponto de "trocar de conta"

Unificar apenas o botão do cartão de instância ("Use another account or instance", nativo) e o link de rodapé "Not @handle? Switch account" num único controlo de rodapé: ambos chamam `switchAccount()`. O terceiro controlo, o link de rodapé nativo "Switch account (ends this session)" (`instance.switch`), chama `session.logout()` e depois `clearInstance()`; é uma acção distinta, que esquece a instância guardada no dispositivo. Mantê-lo como link separado, apenas reposicionado ou ajustado visualmente para não competir em peso com o link unificado de troca de conta. O controlo unificado tem de continuar a satisfazer o cenário "Trocar de conta" (`frontend-v2/entry-screens`): termina a sessão e abre `/login` na web; no desktop devolve `nativeEntry` a `"home"` com a instância actual seleccionada. O bloco de identidade (avatar/nome/handle) mantém-se — é o único elemento verdadeiramente necessário para confirmar "esta é a conta certa".

### D4: `Auth.tsx` — remover protocolo/cifra só no modo login

Remover a linha `auth.protocol`/`auth.cipher` do formulário quando `mode() === "login"`: ela não ajuda a tarefa de digitar handle e senha e entrar, e apresenta jargão criptográfico sobre o qual o utilizador não age. Deixada em aberto (ver "Open Questions") se deve desaparecer também no modo registo, onde um utilizador novo pode querer mais garantias antes de criar a conta.

## Risks / Trade-offs

- [Remover a explicação do "Vault notice" do caminho comum pode reduzir a transparência sobre como a senha protege o vault para quem nunca leu a explicação] → mitigado por ela continuar a aparecer exactamente quando é relevante (`noLocalCopy()`) e por não ser removida do produto, só deixar de repetir-se a cada sessão.
- [Remover chaves i18n (`unlock.noticeTitle`, etc.) pode deixar traduções órfãs se alguma build/skill referenciar a chave antiga] → mitigado pela tarefa de build do frontend nos `tasks.md` como regressão mínima, e por confirmar as duas catalogs (`en.ts`, `pt-BR.ts`) em conjunto.

## Migration Plan

Nenhuma — é mudança de apresentação, sem dados a migrar. Implementação incremental: `Unlock.tsx` e `Auth.tsx` podem ser feitos em commits separados.

## Open Questions

- D4: decidido durante a implementação: manter `auth.protocol`/`auth.cipher` no modo registo e remover apenas do login. O registo apresenta a segurança da conta a uma pessoa nova; a revisão dupla poderá avaliar esta escolha sem ampliar o escopo desta implementação.

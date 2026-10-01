# Proposal

## Why

Com a fundação do frontend v2 criada (`frontend-v2-foundation`: projecto, tokens, componentes base, clientes de API/WS, i18n), a primeira funcionalidade de produto a existir precisa de ser a que todas as outras dependem: entrar na aplicação e navegar dentro dela. Sem autenticação e sem o shell de navegação (rail de servidores, sidebar, topbar, painel do utilizador), nenhuma das fases seguintes (administração de servidor/canal, chat de texto, voz/vídeo) tem onde "viver" — todas elas são renderizadas dentro deste shell. Esta é a **Fase 1 de 6** da reescrita faseada documentada em `docs/v2/TR-frontend-v2.md`.

## What Changes

- Ecrã de autenticação: login, registo, desbloqueio de conta (cofre de identidade em falta num dispositivo novo) e recuperação de identidade — tal como a v1 faz hoje (`frontend/src/pages/Auth.tsx`) e como coberto pelos mockups `mesa_autentica_o_e_registo_login_criar_conta` e `mesa_desbloqueio_de_conta_recupera_o_de_identidade`.
- Cadastro com código de convite editável e preenchimento por URL, conforme o contrato de registro do backend.
- Porte da lógica de criptografia de identidade client-side (par de chaves NaCl, cofre local cifrado por Argon2id via `hash-wasm` + AES-GCM via WebCrypto, persistência em IndexedDB) — **sem MLS, sem múltiplos dispositivos, sem Passkeys** (fora de escopo em todas as fases, ver `docs/v2/TR-frontend-v2.md` §7).
- Shell de navegação completo: rail de servidores, sidebar (esqueleto — lista de canais populada só na Fase 2/3/4; aqui entra a estrutura e o comportamento, não o conteúdo de canais), topbar (logo, pesquisa e notificações como pontos de entrada — o conteúdo aberto desses painéis é Fase 3), painel do utilizador fixo, menu de conta (popover com nome a mostrar, avatar, idioma, sair).
- Alternador de tema Sistema/Claro/Escuro, consumindo os tokens de dois temas já definidos na Fase 0.
- Shell responsivo: colapso do rail+sidebar numa gaveta (drawer) em viewport <768px — lacuna identificada no TR como ausente de todos os 30 mockups; resolvida aqui por especificação directa (ver design.md), não por mockup adicional.
- Drawer de canais em largura estreita (<900px, conforme o padrão já usado na v1).
- **Fora desta fase**: conteúdo de canais (texto/voz), definições de servidor, qualquer ecrã de administração — Fases 2-4.

## Capabilities

### New Capabilities
- `frontend-v2/auth`: ecrãs de login, registo, desbloqueio de conta e recuperação de identidade; porte da lógica de criptografia de identidade client-side.
- `frontend-v2/app-shell`: rail de servidores, sidebar (estrutura), topbar, painel do utilizador, menu de conta, alternador de tema, comportamento responsivo do shell (drawer mobile).

### Modified Capabilities
_Nenhuma — `frontend-v2-foundation` ainda não foi arquivado, por isso não existe capability prévia em `openspec/specs/` para modificar; esta fase introduz capabilities novas que dependem da fundação por convenção de projecto, não por delta formal de spec._

## Impact

- **Código novo**: `frontend-v2/src/pages/Auth.tsx` (ou equivalente), `frontend-v2/src/crypto/identity.ts` (porte), `frontend-v2/src/shell/*` (rail, sidebar, topbar, user panel, account menu).
- **Backend**: nenhum impacto — consome `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/identity-vault`, `/api/auth/identity` exactamente como a v1 já consome.
- **Depende de**: `frontend-v2-foundation` (tokens, componentes base, cliente de API/WS, i18n, Tailwind, TanStack Query) já entregue.
- **Desbloqueia**: `frontend-v2-server-admin`, `frontend-v2-text-chat`, `frontend-v2-voice-video` — todas renderizam dentro do shell desta fase.

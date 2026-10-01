# Proposal

## Why

Com a fundação do frontend v2 criada (`frontend-v2-foundation`: projecto, tokens, componentes base, clientes de API/WS, i18n), a primeira funcionalidade de produto a existir precisa de ser a que todas as outras dependem: entrar na aplicação e navegar dentro dela. Sem autenticação e sem o shell de navegação (rail de servidores, sidebar, topbar, painel do utilizador), nenhuma das fases seguintes (administração de servidor/canal, chat de texto, voz/vídeo) tem onde "viver" — todas elas são renderizadas dentro deste shell. Esta é a **Fase 1 de 6** da reescrita faseada documentada em `docs/v2/TR-frontend-v2.md`.

## What Changes

- Ecrã de autenticação: login, registo, desbloqueio de conta (cofre de identidade em falta num dispositivo novo) e recuperação de identidade — com o mesmo comportamento de produto que a aplicação tem hoje (observado como caixa-preta) e como coberto pelos mockups `mesa_autentica_o_e_registo_login_criar_conta` e `mesa_desbloqueio_de_conta_recupera_o_de_identidade`.
- Cadastro com código de convite editável e preenchimento por URL, conforme o contrato de registro do backend.
- Implementação de raiz da lógica de criptografia de identidade client-side (par de chaves NaCl, cofre local cifrado por Argon2id via `hash-wasm` + AES-GCM via WebCrypto, persistência em IndexedDB), a partir de `docs/v2/contracts/crypto-formats.md` e validada contra os vectores — **sem MLS, sem múltiplos dispositivos, sem Passkeys** (fora de escopo em todas as fases, ver `docs/v2/TR-frontend-v2.md` §7).
- Shell de navegação completo e fiel ao mockup `mesa_shell_da_aplica_o_chat_de_texto`: rail de servidores, sidebar (cabeçalho do servidor com acções, secções de canais), topbar completa (logo, instância com versão, chip de E2EE, busca com atalho, alternador de tema em ícones, notificações com indicador, avatar), painel do utilizador fixo, **painel de Membros** do servidor (agrupado por cargo/presença), menu de conta e modal de saída.
- Página mínima de **Minha Conta** (nome a mostrar, avatar, idioma), acessível a partir do menu de conta.
- Alternador de tema Sistema/Claro/Escuro, consumindo os tokens de dois temas já definidos na Fase 0.
- Shell responsivo: colapso do rail+sidebar numa gaveta (drawer) em viewport <768px — lacuna identificada no TR como ausente de todos os 30 mockups; resolvida aqui por especificação directa (ver design.md), não por mockup adicional.
- Drawer de canais em largura estreita (<900px, conforme o padrão já usado na v1).
- **Fora desta fase**: conteúdo de canais (texto/voz), definições de servidor, qualquer ecrã de administração — Fases 2-4.

## Capabilities

### New Capabilities
- `frontend-v2/auth`: ecrãs de login, registo, desbloqueio de conta e recuperação de identidade; implementação de raiz da lógica de criptografia de identidade client-side, a partir do contrato de formato.
- `frontend-v2/app-shell`: rail de servidores, sidebar (estrutura), topbar, painel do utilizador, menu de conta, alternador de tema, comportamento responsivo do shell (drawer mobile).

- `frontend-v2/account`: página mínima de Minha Conta (nome a mostrar, avatar, idioma).

### Modified Capabilities
_Nenhuma — `frontend-v2-foundation` ainda não foi arquivado, por isso não existe capability prévia em `openspec/specs/` para modificar; esta fase introduz capabilities novas que dependem da fundação por convenção de projecto, não por delta formal de spec._

## Impact

- **Código novo**: ecrãs de autenticação, camada de identidade criptográfica, `frontend-v2/src/shell/*` e página de conta — todos escritos de raiz; a estrutura de ficheiros não segue a da v1 (rail, sidebar, topbar, user panel, account menu).
- **Backend**: nenhum impacto previsto (qualquer alteração exige tarefa própria, ver regra 4 da revisão) — consome `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/identity-vault`, `/api/auth/identity` exactamente como a v1 já consome.
- **Depende de**: `frontend-v2-foundation` (tokens, componentes base, cliente de API/WS, i18n, Tailwind, TanStack Query) já entregue.
- **Desbloqueia**: `frontend-v2-server-admin`, `frontend-v2-text-chat`, `frontend-v2-voice-video` — todas renderizam dentro do shell desta fase.

## Revisão: reescrita do zero e fidelidade visual (2026-10-01)

Esta revisão resulta de `docs/v2/AUDIT-fidelity.md`, que concluiu que o frontend v2 entregue até aqui adoptou os tokens do design mas **não** a interface desenhada, e que grande parte do código descende da v1 (59% em média; 87–100% na voz/vídeo). Passam a valer quatro regras, transversais a todas as fases:

1. **Independência do frontend v1.** Nada de `frontend/` é reaproveitado: nenhum ficheiro, componente, folha de estilo, hook, estrutura de pastas nem decisão de implementação é copiado, adaptado ou usado como modelo, e `frontend/` não é lido para implementar. O que permanece da v1 é **só o backend** (contratos REST/WS, regras de acesso e modelo de dados), nos pontos em que é necessário e reaproveitável sem alteração. A aplicação v1 em execução pode ser usada como caixa-preta para observar comportamento de produto. Formatos criptográficos persistidos (cofre de identidade, envelope de chave de servidor, chave de canal, cifra de mensagem/anexo) são **contratos de dados** com contas existentes: são especificados em `docs/v2/contracts/` com vectores de teste (ver `frontend-v2-foundation`) e a v2 implementa a partir dessa especificação.
2. **Fidelidade visual por tela.** Uma tela só é dada como concluída quando comparada lado a lado com o `screen.png` do mockup correspondente, cumpre a lista de elementos obrigatórios do design deste change e obtém a classificação **Fiel** na escala de `docs/v2/AUDIT-fidelity.md` §2. A comparação fica registada em `verification.md`. Elementos desenhados nos mockups mas fora de escopo (AUDIT §6) não contam como em falta.

3. **Paridade funcional total.** Todas as funcionalidades que a aplicação tem hoje continuam a funcionar na v2, sem exceção. O inventário de referência é `docs/design-system/stitch-prompt.md` §3 mais o comportamento observável da v1 em execução, consolidado em `docs/v2/parity-checklist.md` (ver `frontend-v2-foundation`). Cada change verifica as funcionalidades da sua área contra essa checklist; uma funcionalidade só pode ser omitida se estiver explicitamente excluída do escopo (`docs/v2/TR-frontend-v2.md` §4.2 e §7). Renovar a interface nunca é motivo para retirar uma funcionalidade existente.
4. **Backend só muda por necessidade do frontend.** O backend da v1 é reaproveitado como está. Uma alteração de backend só é admitida quando um requisito do frontend v2 a exige e não há alternativa no cliente; nesse caso é uma tarefa explícita neste change, com o contrato actualizado em `docs/v2/contracts/`, compatível com a v1 enquanto o rollback for possível (alterações aditivas) e verificada com os testes de backend existentes (`cargo test`).

**Consequência para o estado actual:** o código existente em `frontend-v2/` para esta fase é descartável e será substituído; as tarefas foram reabertas e as `verification.md` anteriores ficam como histórico superado.

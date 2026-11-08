# Proposal

## Why

O ecrã de retorno (`Unlock.tsx`, "Good to see you again") acumulou, no refactor recente para o cartão único de conta salva, vários blocos visuais para uma acção rotineira (digitar a senha do vault e continuar): cartão de identidade (avatar + nome + handle + badge "On this device"), cartão separado de instância com o seu próprio botão "Use another account or instance", uma caixa "Vault notice" sempre visível com um parágrafo técnico sobre como a senha abre o vault, o campo de senha, um parágrafo de ajuda "Can't unlock?", um cartão separado "Recover identity" com título + texto + botão próprio, e dois links de rodapé ("Not @handle? Switch account" e, no Electron, "Switch account (ends this session)") que se sobrepõem em função com o botão do cartão de instância. Para um ecrã visto em praticamente todas as sessões, isto é mais peso visual e mais jargão de segurança do que a tarefa (ver quem é, digitar a senha, continuar) precisa — contraria a Lei de Hick (poucas decisões por ecrã) e progressive disclosure (explicar sempre o que só importa às vezes).

O ecrã de logon (`Auth.tsx`, modo "login") tem uma versão menor do mesmo problema: uma linha de rodapé técnica "protocolo + cifra" (`auth.protocol` / `auth.cipher`) que é jargão técnico sem valor accionável para quem já está a repetir uma acção rotineira. Não há badge E2EE no cabeçalho deste ecrã (`AuthFrame single`); a linha é só peso extra.

## What Changes

- **`Unlock.tsx`**: consolidar identidade + instância num único bloco em vez de dois cartões; remover a caixa "Vault notice" sempre visível, mantendo o aviso só quando não há cópia local do vault (a lógica `noLocalCopy()` / `nothingAnywhere()` já existe no componente — passa a decidir também se o bloco aparece, não só qual texto mostrar); substituir o cartão "Recover identity" (título + texto + botão) por um único link secundário sob o botão principal, que abre o diálogo de confirmação já existente (o diálogo já explica a consequência — nenhuma informação se perde); unificar os dois pontos de "trocar de conta/instância" num só.
- **`Auth.tsx`** (modo login): remover a linha de rodapé "protocolo/cifra" do formulário de login. Manter ou não essa linha no modo de registo é uma decisão em aberto, registada no `design.md`.
- Sem mudanças de comportamento de sessão, recuperação de identidade ou autenticação — é reorganização visual e de hierarquia de informação; a lógica existente (`session.unlock`, `session.recover`, `session.login`, detecção de `missing_vault`/`no_local`) não muda.

## Capabilities

### Modified Capabilities

(nenhuma — `skip_specs: true`. Duas capacidades existentes governam estes ecrãs — `frontend-v2/entry-screens` (criada pela change arquivada `2026-11-04-parley-public-home-and-login` especificamente para "coesão visual dos controles e proibição de alterar o sistema de design" nas telas de entrada) e `frontend-v2/auth` (marcada `Modified Capabilities` na mesma change, para "ecrãs de autenticação fiéis aos mockups"). Esta change implementa-se inteiramente dentro do que essas duas capacidades já exigem — não muda o texto de nenhum requisito, só a apresentação — por isso não há delta a escrever. Os cenários relevantes, que `design.md` e `tasks.md` referenciam explicitamente, são "Recuperação continua acessível" e "Trocar de conta" (`frontend-v2/entry-screens`).)

## Impact

- `frontend/src/pages/Unlock.tsx`, `frontend/src/pages/Auth.tsx`.
- `frontend/src/i18n/catalogs/en.ts` e `frontend/src/i18n/catalogs/pt-BR.ts` — chaves do bloco `unlock.*` e `auth.protocol`/`auth.cipher` a ajustar/remover conforme o `design.md`.
- Risco baixo: o caminho feliz de login/unlock não muda de comportamento, só de apresentação. Precisa de verificação manual num Electron real (ver `tasks.md`) e da revisão dupla (arquiteto + fullstack) antes de implementar.

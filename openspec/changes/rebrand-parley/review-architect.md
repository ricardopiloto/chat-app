# Review — Arquiteto de Soluções

**Change:** rebrand-parley
**Data:** 2026-11-03
**Veredito geral:** Bloqueado (3 bloqueantes, todos resolvidos editando os artefatos; nenhum exige redesenho)

**Premissa nova do autor:** há uma única instância (chat.1nodado.com.br, ver `docs/deploy-producao.md`) e só usuários de teste, então a compatibilidade com instalações de terceiros deixa de ser requisito. Esta revisão reavalia a change sob essa premissa.

## 1. Definição da arquitetura técnica
Veredito: Atenção
- A change é de identidade, não muda stack nem componentes. Coerente com o desenho em `README.md` (Axum + SQLite, SPA SolidJS, Electron, LiveKit).
- `design.md` Decisões 1 e 5 (fixar `userData`, ler `PARLEY_*` com fallback `MESA_*`) existem para proteger terceiros. Com uma instância e usuários de teste elas custam mais do que protegem: duas capacidades novas (`desktop/data-continuity`, `instance/environment-variables`), helpers em Rust e Node, avisos de depreciação e 6 tarefas (2.1, 2.2, 3.1 a 3.4). **Recomendo remover as duas capacidades e trocar as variáveis de uma vez.**
- Ressalva ao simplificar: em vez de apenas deixar de ler `MESA_*`, o backend deve **falhar na partida** se `MESA_PRODUCTION`, `MESA_ENV` ou `MESA_RATE_LIMIT_DISABLED` estiverem definidas sem a `PARLEY_*` equivalente, com mensagem clara. Custa poucas linhas e evita o único modo de falha silenciosa (produção sem `COOKIE_SECURE` e sem recusa das chaves de exemplo do LiveKit). Isso substitui a camada de legado.

## 2. Integração com a infraestrutura existente
Veredito: Atenção
- A instância real tem `systemd` com usuário `mesa`, `/opt/mesa`, `/etc/mesa/mesa.env` (com `MESA_PRODUCTION=1`) e Nginx servindo o `dist` estático (`docs/deploy-producao.md`). A proposal não cita nenhum desses itens nem os documentos `deploy-producao.md`, `operar-instancia.md` e `desktop-release.md`.
- Sequência obrigatória no deploy: editar `/etc/mesa/mesa.env` (`MESA_PRODUCTION` para `PARLEY_PRODUCTION`) **antes** de reiniciar o backend novo. Entrar na change como tarefa de runbook.
- Renomear usuário, diretórios e unit do servidor (`mesa` para `parley`) é opcional e fora de escopo: não aparece para usuário nenhum e mexe em permissões e caminhos do SQLite e dos anexos. Manter no servidor atual; só a documentação de **novas** instalações usa o nome novo.
- `docs/desktop-release.md:38` afirma que `productName` e `appId` "não mudam" e justifica o prefixo `mesa-chat-app`. Esse trecho fica errado após a change e precisa ser reescrito.
- Colisão de nome de pacote Linux: existe o pacote **Parley** do KDE (treinador de vocabulário) nos repositórios Debian e Fedora, com `.desktop` e ícone próprios. O nome `parley` sozinho como pacote, executável ou ícone colide. **Manter o sufixo:** `parley-chat-app` para `packageName`/`executableName`/`desktopName` (a razão de manter `-chat-app` continua válida, só mudou o nome colidente). Isto também deve entrar na tarefa 1.2 de colisão de marca.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Bloqueante
- **Bloqueante A, rótulos criptográficos.** `frontend/src/crypto/recovery.ts:83` usa `"mesa-recovery-v1"` e `frontend/src/crypto/inviteSeed.ts:14` usa `"mesa-invite-seed-v1"` como separação de domínio na derivação de chaves. Trocar essas cadeias muda as chaves derivadas: recovery keys e convites existentes deixam de funcionar, e o contrato com o backend/testes se rompe. A change nunca os menciona, e a tarefa 4.1 ("grep -ri mesa deve só devolver identificadores internos") convida a quebrá-los, ainda mais sob "trocar tudo". Precisam constar como **intocáveis** em `design.md`, na spec de marca e em `tasks.md`, com teste que fixe os valores.
- **Bloqueante B, armazenamento local no cliente web.** As chaves `mesa.channelKey.<id>`, `mesa.instance.*`, `mesa.locale` etc. vivem no `localStorage` de `chat.1nodado.com.br`, não só no desktop. Renomear qualquer uma apaga as chaves E2E locais de **todos** os usuários web, independentemente do `userData` do Electron. Também o esquema `mesa://` (origem do `localStorage` no desktop) pertence a esse grupo. A change já deixa esses itens como estão; falta registrar o **porquê** e que a premissa "trocar tudo" não os inclui.
- Segurança: sem alteração de garantia, desde que A e B sejam respeitados.
- Performance: N/A.
- Manutenibilidade: remover a camada de legado reduz a superfície; manter o resto interno reduz risco de regressão E2E.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção
- `design.md` registra alternativas rejeitadas, bom. Precisa de uma decisão nova e curta: "o que NÃO se renomeia, e por quê" (rótulos criptográficos, chaves de `localStorage`, `mesa://`, IPC, header `x-mesa-media-type`), em vez de apenas dizer "interno".
- `docs/desktop-release.md`, `docs/deploy-producao.md`, `docs/operar-instancia.md` e `CHANGELOG.md` entram na lista de impacto (documentação operacional que cita `MESA_PRODUCTION`). Sem diagrama: a complexidade não o exige.

## 5. Ponte entre produto e técnico
Veredito: OK
- O objetivo (renomear e trocar o logo) está traduzido em tarefas verificáveis. Dependência externa (arquivos do logo) está explícita na tarefa 1.3.
- Com a premissa nova, o `appId` pode mudar (`com.parley.desktop`): consequência aceitável é o app novo coexistir com o antigo no desktop do autor; desinstalar o Mesa à mão.

## Bloqueantes antes de implementar
1. Declarar como intocáveis os rótulos criptográficos `mesa-recovery-v1` e `mesa-invite-seed-v1` (design, spec e tarefa com teste que os fixa).
2. Declarar como intocáveis as chaves de `localStorage` `mesa.*` e o protocolo `mesa://`, com a justificativa de perda de chaves E2E do cliente web.
3. Reescrever o escopo para a premissa nova: remover `desktop/data-continuity` e `instance/environment-variables` (e tarefas 2.x, 3.x) e substituir por troca direta das variáveis com **falha na partida** quando houver `MESA_*` sem o par `PARLEY_*`; adicionar a tarefa de runbook do deploy na instância e a atualização de `docs/deploy-producao.md`, `operar-instancia.md`, `desktop-release.md` e `CHANGELOG.md`.

Recomendações não bloqueantes: `appId` para `com.parley.desktop`; pacote Linux `parley-chat-app`; não renomear usuário, diretórios e unit do servidor atual; incluir a colisão com o Parley do KDE na checagem 1.2.

# Review — Arquiteto de Soluções

**Change:** rebrand-parley
**Data:** 2026-11-04
**Veredito geral:** Aprovado com ressalvas

Revisão refeita contra o estado atual do repositório: as changes `email-registration`, `email-password-reset`, `email-key-reminders` e `instance-admin-onboarding` estão implementadas, commitadas (`0a3ba79`) e arquivadas, e a árvore está limpa. Contexto lido: artefatos da change, `README.md`, `docs/{deploy-producao,operar-instancia,desktop-release,backlog/backlog}.md`, `backend/src/{config,email_templates}.rs`, `frontend/electron/main.ts`, `frontend/src/crypto/{channelKey,keyHandoff}.ts`, `frontend/src/api/instance.ts`, `infra/.env.example`, as specs principais de `desktop/` e `frontend-v2/`, e `openspec validate rebrand-parley --strict` (passa).

## 1. Definição da arquitetura técnica
Veredito: OK
- O escopo é grande mas coerente: nome visível, ícones, `appId`, pacotes, variáveis e limpeza da instalação anterior, tudo ligado por uma decisão central — o que é «intocável» (design.md, Decisão 1). A lista de intocáveis confere com o código: `mesa.channelKey.<id>` (`crypto/channelKey.ts`), `mesa.instance.*` (`api/instance.ts`), `mesa://`, `mesa:*`, `__MESA_NATIVE__`, `x-mesa-media-type`, e os rótulos `mesa-recovery-v1` e `mesa-invite-seed-v1`. A chave nova `mesa.instance-admin-welcome:<id>` (change `instance-admin-onboarding`) já segue o prefixo `mesa.` e fica coberta.
- A limpeza da instalação anterior é a única peça nova de risco real (executar um desinstalador). Está bem contida: pergunta antes, caminhos fixos, nunca o executável em execução, dados preservados, plano B (hook NSIS) e decisão baseada em teste manual (tarefas 1.1 e 2.4).

## 2. Integração com a infraestrutura existente
Veredito: Atenção
- **Topologia de produção presumida e desatualizada.** O design assume `systemd`, `/etc/mesa/mesa.env` e «Nginx servindo `frontend/dist`» (Contexto, Decisão 7, Plano de migração passos 1–2, tarefa 8.1). Em 2026-11-03 foi informado que o Nginx do servidor atende só o LiveKit e que a app não passa por ele; a forma como o tráfego chega ao backend está pendente de confirmação (backlog, item 20). Antes de a tarefa 8.1 virar roteiro, confirmar como o backend e o `dist` são servidos e onde vivem as variáveis de ambiente.
- **Produção já tem uma parte do rebrand.** O `.env` local já usa `EMAIL_FROM="Parley <no-reply@1nodado.com.br>"` e o domínio verificado no Resend é `1nodado.com.br`; a tarefa 8.1 diz que o `EMAIL_FROM` «deve citar o nome antigo». Ajustar o texto para «conferir».
- Sem porta, processo ou serviço novo. CI e scripts de instalação mudam de nome mas não de desenho. `.github/workflows/desktop-release.yml` só roda em tag: o ciclo de feedback dos ícones de Windows e macOS depende de uma tag de teste (já previsto, tarefa 6.2).

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção
- **A promessa «nenhuma chave ou armazenamento E2E é invalidado» não vale integralmente para o desktop.** O `localStorage` do Electron mora em `userData`, que muda de nome com o app (Non-Goals e proposal: «a pasta de dados não é fixada»). No código: as chaves do servidor voltam sozinhas depois do login (envelope em `key_envelopes`, `keyHandoff.ts::loadServerKey`) e o cofre de identidade está no servidor, mas `mesa.channelKey.<id>` é uma **cópia local** e `parseChannelKeyInput` aceita uma chave de canal de voz *colada* pelo membro: quem a colou só a tem nesse armazenamento, e o novo perfil do Parley começa vazio. Resultado: membros do desktop teriam de colar de novo as chaves de canais de voz, e a sessão (`mesa.instance.sessionToken`) também some. Não é perda definitiva (a pasta antiga fica no disco) e a premissa é de usuários de teste, mas a spec só garante o cenário do cliente web. Decidir e registrar: (a) aceitar e documentar no README/CHANGELOG; ou (b) fixar `userData` no caminho do Mesa (`app.setPath`) para o localStorage continuar; ou (c) copiar o `Local Storage` na primeira execução. Qualquer das três exige um cenário na spec.
- **Recusa de partida com `MESA_*`** (Decisão 4): segura e simples; combina com a recusa de credenciais de exemplo já existente. Atenção a quem roda scripts locais: `infra/.env.example` cita `MESA_PRODUCTION=1` num comentário (escrito na change `email-registration`) e o harness de testes usa `MESA_RATE_LIMIT_DISABLED` por defeito em `TestApp`.
- **`PARLEY_*` ao lado de variáveis sem prefixo** (`REGISTO_MODO`, `EMAIL_*`, `RESET_EMAIL`, `KEY_REMINDERS`, `TRUSTED_PROXY`, `TURNSTILE_*`): não é problema, mas o nome de uma capacidade nova diz «variáveis usam o prefixo PARLEY_»; deixar claro na spec que só as de `MESA_` migram, para não parecer que as outras devem mudar.
- **Colisão de nome ainda não pesquisada** (tarefa 1.2 aberta). `appId`, pacotes e variáveis são irreversíveis na prática depois de publicados; a pesquisa deve ser feita **antes** de qualquer implementação.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção
- O design tem alternativas e motivos em todas as decisões relevantes (appId, limpeza, variáveis, pacotes, logo) e um plano de migração com rollback. Sem diagrama, o que é aceitável.
- **Texto desatualizado:** a nota de ordem de `tasks.md`, o risco «Conflito com a change `email-registration` em andamento (12 tarefas feitas, 10 pendentes, sem commit)» e o passo 0 do plano de migração descrevem uma situação que já passou: as três changes de e-mail estão commitadas e arquivadas. Reescrever como «pré-condição cumprida».
- A tarefa 7.2 lista `README`, `docs/deploy-producao.md`, `docs/operar-instancia.md`, `docs/desktop-release.md` e `CHANGELOG.md`, mas não `infra/.env.example`, `docs/contratos-e-fluxos.md` nem `docs/arquitetura-tecnica.md` (que passaram a citar o produto e variáveis nas changes de e-mail).

## 5. Ponte entre produto e técnico
Veredito: Atenção
- O pedido («trocar o nome, o logo e o que o usuário vê») está traduzido com cuidado e com a restrição certa (não quebrar criptografia). O logo está entregue e aprovado (`docs/v2/parley_logo/`).
- **Lacuna de varredura nas changes novas.** O backend tem 22 ocorrências de «Mesa» em `email_templates.rs` (assuntos e corpos de e-mail de cadastro, recuperação, aviso de senha e lembretes), mais textos novos nos catálogos (`emailRegistration`, `recoverEmail`, `setup`, `account.keyReminders*`, selo de administrador). A tarefa 4.3 manda varrer os templates, mas não diz que **os testes de contrato fixam esses textos** (por exemplo `auth_email_reset.rs` confere «Senha do Mesa alterada»). Incluir o ajuste desses testes na 4.3.
- Dependências externas à máquina de desenvolvimento (Windows para 1.1 e 2.4, macOS, runner de CI) não têm dono nem prazo; confirmar que existe onde testar antes de começar o grupo 2.

## Bloqueantes antes de implementar
- nenhum

Recomendado antes de começar: concluir a pesquisa de colisão (1.2), decidir o destino do `userData` do desktop (acima), reescrever as notas de ordem desatualizadas e confirmar a topologia de produção para o roteiro 8.1.

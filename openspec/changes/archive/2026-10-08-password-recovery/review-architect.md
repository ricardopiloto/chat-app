# Review — Arquiteto de Soluções

**Change:** password-recovery
**Data:** 2026-10-08 (revalidação após reset de `tasks.md` e adição de nota em `design.md`)
**Veredito geral:** Aprovado com ressalvas

Metodologia: reli `proposal.md`, `design.md` (já com a linha de Risks acrescentada na revisão anterior), `tasks.md` (agora com as 30 tarefas em `[ ]` e as notas inline de achados) e os 5 `specs/**/spec.md` a partir do disco. Reconfrontei com `docs/arquitetura-tecnica.md`, `docs/deploy-producao.md`/`docs/operar-instancia.md`, `infra/docker-compose.yml`, as specs já aceitas em `openspec/specs/frontend-v2/{auth,account}` e `openspec/changes/bots-channel-key-integration`. Nada nessas fontes mudou desde a primeira revisão; o que mudou foi `design.md` (uma linha nova) e `tasks.md` (reset completo).

## 1. Definição da arquitetura técnica
**Veredito: OK** (sem mudança face à primeira revisão)

- Stack inalterada, nenhuma tecnologia nova. Escalabilidade continua tratada com critérios numéricos na spec `crypto/key-envelope-integrity` e mitigação condicional (D8), coerente com a promessa de leveza de `arquitetura-tecnica.md`.

## 2. Integração com a infraestrutura existente
**Veredito: OK** (sem mudança)

- Migração aditiva sobre o SQLite existente, subcomando reaproveitando o binário/Config actuais, nenhum serviço novo. Achado menor já registado antes (backup não mencionado explicitamente) continua válido, não registado em `tasks.md`/`design.md` — se quiser, posso propor essa linha também, mas não é bloqueante.

## 3. Qualidade de arquitetura e trade-offs
**Veredito: Atenção**

- **Segurança/criptografia:** sem mudança — a modelagem continua alinhada com a entidade `IDENTITY_RECOVERY_BACKUP` já prevista em `docs/arquitetura-tecnica.md` desde antes desta change.
- **Coordenação com `bots-channel-key-integration`:** agora **formalmente rastreada** — `design.md:114` acrescentou `[Coordenação com bots-channel-key-integration é unilateral...] → espelhar esta dependência...`. Isto é uma melhoria real (deixou de ser só um achado de revisão, passou a decisão registada), mas a acção em si (editar o `design.md`/`proposal.md` do change dos bots) **ainda não foi feita** — a coordenação continua unilateral na prática, só que agora documentada como risco pendente em vez de lacuna silenciosa. Mantenho `Atenção`, não `Bloqueante`, porque D9 já definia a ordem de aplicação correcta (esta change antes da dos bots) independentemente de o outro lado saber.
- **Achado novo desta revalidação — risco de processo introduzido pelo reset de `tasks.md`:** todas as 30 tarefas voltaram a `[ ]`, incluindo 1.1–1.3 e 1.5, que a revisão fullstack anterior confirmou implementadas e cobertas por teste (migração `0023_password_recovery.sql` aplicada, `revoke_all_for_account` com teste próprio, `apply_identity_replacement` extraído e testado). Resetar o checklist foi uma decisão deliberada do usuário para forçar revalidação completa — correcto como *processo* — mas é um risco se `/opsx:apply` interpretar `[ ]` como "escrever do zero" em vez de "confirmar que o que já existe está certo e completar o que falta". Reimplementar código já correto desperdiça esforço e pode introduzir regressão onde hoje não há nenhuma.
  - **Recomendação:** ao aplicar, tratar 1.1–1.3, 1.5 (e as outras com nota inline: 1.4, 2.1–2.3, 3.1) como *verificação*, não *criação* — ler o código existente primeiro, como esta revisão fez, e só escrever o que a nota já identificou como faltante (ex.: ligar o rate limiter em 1.6, implementar a guarda 409 em 4.1). As notas inline que já estão em `tasks.md` existem exactamente para isso.

## 4. Documentação e decisões (ADRs)
**Veredito: OK**

- `design.md` continua com onze decisões bem fundamentadas; a linha nova em Risks/Trade-offs segue o mesmo formato `[Risco] → Mitigação` das demais, sem quebrar a convenção do documento.

## 5. Ponte entre produto e técnico
**Veredito: OK** (sem mudança)

## Bloqueantes antes de implementar
- Nenhum do ponto de vista de arquitetura.
- Antes de `/opsx:apply`: tratar o `tasks.md` resetado como checklist de *revalidação* do que já existe, não como convite a reimplementar 1.1–1.3/1.5 do zero (ver achado novo na seção 3).
- Ainda pendente (não bloqueante para esta change isolada): espelhar a nota de coordenação em `bots-channel-key-integration`.

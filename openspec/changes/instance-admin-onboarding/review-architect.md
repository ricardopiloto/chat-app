# Review — Arquiteto de Soluções

**Change:** instance-admin-onboarding
**Data:** 2026-11-03
**Veredito geral:** Aprovado com ressalvas

Contexto lido: artefatos da change, `README.md`, `docs/{operar-instancia,deploy-producao,arquitetura-tecnica}.md`, `docs/backlog/backlog.md` (item 19), `backend/src/api/{mod,invites}.rs`, `backend/src/api/auth/register.rs`, `backend/src/db/account.rs`, `backend/src/rate_limit.rs`, `frontend/src/pages/{Auth,Account}.tsx`, `frontend/src/auth/InstanceConnect.tsx`, e as changes irmãs (`email-registration`, `email-password-reset`).

## 1. Definição da arquitetura técnica
Veredito: OK
- Estado derivado de `COUNT(*) FROM account` (já usado em `register_inner`), sem flag nem tabela: a escolha mais simples e sem risco de divergir do dado (design.md, Decisão 1).
- Responsabilidades claras: backend só informa o estado, a UI decide a variante, o backend continua a ser a fonte de verdade do registro (Decisão 3).
- Carga irrelevante: uma contagem indexada por consulta.

## 2. Integração com a infraestrutura existente
Veredito: Atenção
- **Limite por IP atrás do Nginx.** O desenho reutiliza o balde de `handle-available`, mas `ClientIp` usa o peer TCP e, atrás do Nginx (`docs/deploy-producao.md`), todos chegam como `127.0.0.1`; o balde vira global. Como a UI chama o endpoint em cada abertura do cadastro e tem fallback para o cadastro normal em caso de 429, o impacto é pequeno, mas o limite passa a ser inútil e pode degradar a variante inicial em instâncias movimentadas. Decidir: usar o `RealClientIp` de `email-registration` quando disponível, ou deixar claro que atrás de proxy o limite é global e só consultar o endpoint quando o cadastro é aberto (não no login).
- Sem porta, processo ou variável nova; sem migração. O caso de uso principal (self-host local, cliente Electron falando com `127.0.0.1`) não passa por Nginx, então o limite funciona como desenhado.
- O endpoint deve ficar no mesmo prefixo público e sob o mesmo tratamento de cabeçalhos de segurança dos demais.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção
- **Reivindicação da instância (race).** O risco «quem chegar primeiro reclama a instância» está registrado e é o mesmo de hoje, mas esta change **o torna mais visível**: um endpoint público que diz «instância vazia» é um sinal útil para varredura de instâncias expostas. A mitigação proposta (`BIND=127.0.0.1` e aviso na UI) só protege quem lê o runbook. Recomendar, como follow-up já no backlog (item 19), um token de setup, e declarar nesta change que o endpoint **não deve** ser usado como sinal de segurança. Aceitável como ressalva porque o estado já é inferível tentando registrar.
- **Conceito de «administrador» sem efeito.** Selo e texto prometem um papel que ainda não existe. A mensagem «por ora sem permissões extras» mitiga; garantir que ela seja a primeira coisa a ser lida (spec exige, mas a UI pode escondê-la).
- **Dupla fonte de verdade na UI.** A variante inicial depende de uma consulta separada do `POST /register`; a corrida está tratada (backend recusa, UI volta ao normal). OK.
- **Segurança E2EE:** nenhum segredo novo, nenhuma mudança no cadastro. Preservado.
- **Consistência de nomenclatura:** «administrador da instância» vs «operador» é uma decisão de produto razoável, mas hoje os catálogos i18n e `docs/` usam «operador» para a primeira conta em vários lugares (ex.: `recover.pitch`, `docs/operar-instancia.md`); a tarefa 2.4 cobre i18n, falta cobrir os docs além de 3.1.

## 4. Documentação e decisões (ADRs)
Veredito: OK
- Decisões com alternativas rejeitadas (Decisão 1: `/health` e `/auth/register/config`), riscos e plano de reversão presentes. Diagrama dispensável para um endpoint e uma variante de UI.
- Referenciar no design a relação com o item 19 do backlog e com a spec `password-recovery` (o papel de «operador» ali) para não divergir os termos.

## 5. Ponte entre produto e técnico
Veredito: OK
- O pedido (deixar claro que se cria a conta de administrador; sem acesso diferenciado agora; futura administração sem acessar o servidor) está traduzido e o ponto de extensão (`is_initial_operator` sem vínculo a servidor) foi fixado (Decisão 6).
- Alinhado com `email-registration` (primeira conta isenta de convite/e-mail) e com o backlog (reset sem chave e administração futura).

## Bloqueantes antes de implementar
- nenhum

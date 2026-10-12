# Review — Arquiteto de Soluções

**Change:** https-instance-and-invite-link
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: OK

- Correcção puramente de frontend (`InviteDialog.tsx`, `instance.ts`), sem componente ou stack nova. Confirmei em `frontend/electron/main.ts:6,86,129` que o modo de desenvolvimento (`MESA_ELECTRON_DEV=1`) carrega `DEV_URL = "https://127.0.0.1:1421"` directamente, sem passar pelo ecrã de selecção de instância — por isso a rejeição de `http://` nesse ecrã (Decisão 2 de `design.md`) não afecta o fluxo de desenvolvimento do cliente nativo, só a ligação a uma instância real escolhida pelo utilizador, exactamente como pretendido.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Reforça, em vez de contradizer, o padrão já estabelecido em `docs/deploy-producao.md` (mesma origem, `SameSite=Strict`, HTTPS obrigatório em produção) — exigir HTTPS no ecrã de instância está alinhado com o que uma instância de produção já tem de ser.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- Segurança: a mudança é estritamente positiva — deixa de ser possível configurar o cliente nativo contra uma origem `http://` insegura. Confirmei que `normalizeInstanceUrl` hoje (`frontend/src/api/instance.ts:160`) aceita `http:`/`https:` por igual; a Decisão 2 fecha essa lacuna. Sem impacto de performance. O fragmento da semente de convite (`crypto/invite-key-seed`) não é tocado — `inviteUrl` só concatena a origem recebida, confirmado em `design.md` Context.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- Três decisões, cada uma com alternativa considerada e motivo de rejeição — estilo ADR equivalente ao resto do projecto, ainda que em inglês e com formatação levemente diferente das outras changes desta sessão (não é um problema de substância).

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why" liga directamente dois sintomas reais (link de convite inútil com origem `mesa://`, exigência de digitar `https://` manualmente) a uma causa técnica concreta e verificável (`location.origin` em Electron, `normalizeInstanceUrl` sem distinguir esquemas) — sem promessas vagas.

## Bloqueantes antes de implementar

- nenhum

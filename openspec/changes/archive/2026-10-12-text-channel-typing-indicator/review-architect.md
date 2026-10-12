# Review — Arquiteto de Soluções

**Change:** text-channel-typing-indicator
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A change não introduz stack nova: reutiliza o hub WebSocket existente (`backend/src/ws/mod.rs`, rota `/ws` em `backend/src/api/mod.rs`) e os primitivos de autorização já usados por mensagens (`require_write_text`, `send_to_channel_viewers` em `backend/src/api/messages.rs`). Coerente com `docs/arquitetura-tecnica.md` §2.4 (hub de eventos em tempo real) e com a stack Rust/Axum/SQLx já estabelecida.
- Escala: a proposta não fixa um número de usuários simultâneos, mas o volume (nomes de digitação num canal de RPG, tipicamente poucos membros) é compatível com a premissa de leveza do documento de arquitetura. Ver ressalva de custo por evento na dimensão 3.
- Componentes e responsabilidades estão claros: servidor autoriza e repassa; cliente anuncia/recebe e expira localmente. Nenhum componente novo (sem storage, sem serviço adicional).

## 2. Integração com a infraestrutura existente

Veredito: OK

- Nenhuma porta, processo ou container novo — tudo passa pela mesma conexão `/ws` já atravessando o reverse proxy Nginx de mesma origem (`docs/deploy-producao.md`). Nenhum impacto em `infra/docker-compose.yml`/`infra/livekit.yaml`.
- Sem migração de banco e sem estado persistido (confirmado em `design.md` "Migration Plan" e nas Decisões 1–2): não há impacto em backup/portabilidade da instância (`docs/arquitetura-tecnica.md` §4.3).
- Compatibilidade de versões coberta corretamente: clientes/servidores antigos ignoram o quadro/evento novo (quadro de texto que não é `"ping"` já cai hoje no branch `_ => {}` em `backend/src/api/mod.rs:321`, confirmado lendo o código).

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Segurança/E2EE — OK.** Verifiquei o payload real proposto (`{channel_id, account_id, active}`): nenhum conteúdo digitado, `account_id` vem da sessão autenticada (não do quadro do cliente), consistente com o resto do backend (`require_write_text`/`channel_access`). Preserva a premissa de E2EE por padrão da arquitetura.
- **Mudança de invariante não declarada como decisão.** `frontend/src/api/realtime.ts` documenta hoje, em comentário, que "the client never publishes" sobre esse socket — este é o primeiro recurso a tornar `/ws` bidirecional. É uma mudança de arquitetura real (não apenas um evento novo), e `design.md` não a nomeia explicitamente como decisão/risco (ela aparece implícita na Decisão 1). Recomendação: registrar isso como uma decisão própria (ex. "D0 — o socket `/ws` passa a aceitar quadros do cliente"), já que altera uma garantia hoje documentada no código.
- **Custo de fan-out por evento não examinado.** `send_to_channel_viewers` (reusada tal como está, por decisão 1) roda, para cada membro do servidor, `channel_access` — que faz 5 consultas sequenciais ao banco (`membership::find`, `server::find_by_id`, `aggregated_caps`, `role_id_for_account`, `channel_acl::list_by_channel`; ver `backend/src/api/authz.rs:37-63`). Isso é aceitável para `message.new` (um envio por mensagem), mas `typing.updated` é dirigido por heartbeat (renovação periódica enquanto a pessoa digita, para cada digitador simultâneo). A seção "Risks / Trade-offs" do `design.md` cobre o volume de quadros do remetente (payload, validação, rate limit), mas não o custo de difusão do lado do servidor, que escala com `membros × consultas`, repetido a cada renovação. Para o tamanho típico de um servidor de RPG provavelmente é inofensivo, mas deveria ser uma decisão consciente e documentada (aceitar o custo dado o porte esperado, ou cachear a lista de leitores autorizados do canal por um TTL curto), não uma reutilização silenciosa de um padrão pensado para eventos de baixa frequência.
- **Manutenibilidade — OK.** Sem infraestrutura nova; reaproveita `RateLimiter::check` (genérico, já usado para outros fins em `backend/src/rate_limit.rs`) para o limite de frequência por conta/canal — bom encaixe no padrão existente, sustentável por uma pessoa só.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- As quatro decisões em `design.md` seguem o espírito de ADR do projeto (alternativa rejeitada + motivo), ainda que não usem o cabeçalho `D1`/`D2` visto em `openspec/changes/bots-channel-key-integration/design.md`. É uma diferença de formato, não de substância — não bloqueante.
- Nenhum diagrama (mermaid) incluído; dado que o fluxo é um quadro simples ida-e-volta sobre um canal já existente, a ausência é aceitável (a complexidade não justifica exigir um diagrama).
- Ponto a fechar: a decisão implícita de tornar o socket bidirecional (ver dimensão 3) deveria constar explicitamente aqui.

## 5. Ponte entre produto e técnico

Veredito: Atenção

- O "Why"/"What Changes" (coordenação sem interromper leitura, sem vazar conteúdo) foi bem traduzido em decisões técnicas concretas e verificáveis (payload mínimo, autorização por evento, expiração local).
- **Gap concreto entre spec e estrutura real da UI.** A spec (`specs/frontend-v2/text-messaging/spec.md`, Requirement "Presença de digitação efémera e restrita ao canal") exige que todo membro com acesso de leitura receba o evento, sem exceção para quem não pode escrever. `design.md` (Decisão 4) e `tasks.md` (1.1) colocam a linha "imediatamente acima do composer", dentro de `.ch-foot`. Mas, lendo `frontend/src/chat/ChannelPage.tsx` (linhas ~333-345), `.ch-foot` hoje renderiza um `Switch`/`Match` que troca o `Composer` por um aviso `.ch-locked` quando `!canWrite(channel)` ou o canal está silenciado para quem vê — ou seja, não há `.ch-composer` para ancorar "acima" nesses casos, embora esses mesmos membros (leitura sem escrita, ou silenciados) continuem autorizados a RECEBER o indicador pela spec. Nem `design.md` nem `tasks.md` tratam esse caso. Recomendação: decidir e registrar explicitamente — ancorar a linha de forma incondicional dentro de `.ch-foot` (fora do `Switch`), ou justificar por que membros somente-leitura/silenciados não precisam ver o indicador — antes de iniciar a tarefa 3.1.

## Bloqueantes antes de implementar

- nenhum

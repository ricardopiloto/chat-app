# Review — Arquiteto de Soluções

**Change:** bots-channel-key-integration
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: Atenção

- A escolha de Rust + crate oficial `livekit` para o bot de música (D8) é tecnicamente sólida e reaproveita o mesmo esquema simétrico AES-GCM já usado por `channel_key`/`key_envelope` nesta app — não exige replicar um protocolo complexo (ao contrário do caso DAVE/MLS do Discord, citado em `TR-item10-bots-chave-por-canal.md` §5.5). Nenhuma stack nova é introduzida no backend/frontend principais.
- **Achado:** a justificação de D8 (`design.md:74`) assenta inteiramente na premissa "o item 14 do backlog já prevê empacotar um client desktop único via Tauri... significa que a mesma lógica pode ser linkada directamente no binário do client desktop". Essa premissa está desatualizada: `docs/arquitetura-tecnica.md:76` já regista a "Nota de reconciliação (desktop-electron-shell)" afirmando que "o cliente desktop actual é um shell Electron (`frontend/electron/`, Node), não um binário Rust/Tauri", e o histórico de commits confirma a mudança ("1.2.1 -- Changed from Rust to Electron for better webcam/mic support on linux"). A decisão em si (Rust para o bot de referência) pode continuar a ser a melhor opção por outros motivos (reaproveitar o esquema de cifra, evitar um runtime extra), mas o "Porquê" citado no ADR está contradito pela arquitetura real do projeto hoje. Recomendação: reescrever o "Porquê" de D8 sem depender da premissa Tauri, ou justificar por que a aposta em um desktop Tauri futuro ainda vale o custo apesar do pivô para Electron já registado.
- Escalabilidade: a change não declara quantos canais por Servidor é razoável assumir; isso importa diretamente para a dimensão 3 (ver achado de performance abaixo), porque o carregamento de chave e o handoff passam a ser proporcionais a canais, não a Servidores.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Não introduz processo, porta ou container novo no lado do backend/infra: o bot de música consome o mesmo LiveKit SFU já existente (via token emitido pelo backend, reaproveitando `backend/src/token/mod.rs::mint`, confirmado por leitura do código real), e o bot de conversa reaproveita o mesmo protocolo WS/sessão que um cliente humano (D5) — sem segunda superfície de API.
- **Achado menor:** `design.md:55` (D5) diz que a autenticação de bot reaproveita "`backend/src/token/`" — mas esse módulo (`backend/src/token/mod.rs`) é especificamente o serviço que emite JWT do LiveKit, não a máquina de sessão de conta. A sessão de conta real vive em `backend/src/api/auth/session.rs` + `backend/src/db/session.rs` (confirmado por leitura). É uma imprecisão de referência no ADR, não um problema de desenho — mas vale corrigir antes de alguém implementar tasks 3.2 usando o módulo errado como ponto de partida.
- Dados: mesmo SQLite/Postgres já existente, sem isolamento novo; impacto de backup inalterado.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Segurança — ponto central desta revisão.** O desenho preserva corretamente a garantia de que o backend nunca vê a `channel_key` em claro: o bot participa do handoff como qualquer conta, via `crypto_box_seal` para a sua própria `identity_pubkey` (specs `crypto/channel-keys` e `bots/integration`), e o raio de exposição de um token comprometido é escopado ao(s) canal(is) de instalação, não ao Servidor inteiro — é exatamente o problema que motivou a proposta (um bot num canal não deve herdar acesso a todo o Servidor), e o desenho resolve isso de forma consistente com o mecanismo de ACL (D3) e cascade (D6) já existentes.
- **Achado (Atenção — endereçar antes/durante a implementação):** instalar um bot cria, por desenho, um processo externo capaz de decifrar o conteúdo desse canal — e esse processo é controlado por quem o instalou (qualquer titular da capacidade de papel "Gerenciar bots", não necessariamente o operador da instância). Isto é uma extensão deliberada e aceitável da fronteira de confiança, mas a app já tem um precedente exato para esse tipo de decisão — o toggle de E2EE para Egress (`docs/arquitetura-tecnica.md` §6, migração 0006): aquele mecanismo exige **indicador visual permanente visível a todos os membros do canal** + entrada em `e2ee_audit_log`, "nunca é silenciosa". A proposta de bots não replica esse padrão: a visibilidade de que um bot tem acesso de decifragem a um canal fica restrita à página "Bots" da shell de definições, acessível só a quem tem "Gerenciar bots" ou é dono do Servidor (`specs/frontend-v2/server-management/spec.md:35`) — um membro comum desse canal, sem essa capacidade, não tem como saber que um bot (um ponto de decifragem fora do seu controlo) está instalado ali. Recomendação: antes de implementar, decidir explicitamente se a presença de um bot num canal deve ter um indicador visível aos membros desse canal (equivalente ao de Egress) e/ou uma entrada de auditoria equivalente a `e2ee_audit_log` — do contrário, a mudança introduz uma forma silenciosa de reduzir a confidencialidade de um canal, o que contradiz o princípio "nunca é silenciosa" já estabelecido para a única outra excepção consciente de E2EE que a app tem hoje.
- **Achado (Atenção):** nem `proposal.md` nem `design.md` fecham explicitamente a pergunta 2 do próprio TR que originou esta change (`docs/backlog/TR-item10-bots-chave-por-canal.md:161`: "processo do próprio operador da instância (confiável por definição) ou algo instalável por qualquer membro do servidor?"). O desenho resultante (D9: capacidade de papel "Gerenciar bots", atribuível a qualquer cargo, não restrita ao operador da instância) implicitamente responde "qualquer membro com a capacidade", mas isso nunca é declarado como decisão consciente nem acompanhado de um threat model explícito (o que pode e não pode ver um bot malicioso ou comprometido, e quem além do dono do bot herda esse risco). O "Risks/Trade-offs" de `design.md:86` cobre só o token comprometido — não cobre o caso "dono do bot é hostil por si só" (ex.: um membro com a capacidade instala um bot propositalmente malicioso num canal privado de outra pessoa a que já tenha ACL). Recomendação: adicionar ao `design.md` uma secção curta e explícita de threat model (mesmo que a conclusão seja "aceitamos esse risco porque é equivalente ao risco já aceite de qualquer titular de 'Gerenciar canal'/'Gerenciar cargos' hoje").
- **Achado (Atenção — performance/escala):** `docs/e2ee-gaps.md` já regista, na medição de 2026-10-08 do change `password-recovery`, que "o change dos bots, se aplicar envelopes por canal, multiplica estas linhas e estes eventos pelo número de canais" — e a spec `crypto/key-envelope-integrity` (`Requirement: O handoff escala para Servidores com 300 ou mais membros`) tem critérios quantitativos de p95 medidos por Servidor que passam a ser por Servidor×Canais depois desta migração. `tasks.md` (item 8.1) só pede a suite de regressão a passar — não há tarefa que repita a medição de escala com o novo multiplicador de canais, apesar de o próprio `design.md` (secção "Interacção com password-recovery", §98) reconhecer que "vale medir de novo... antes de assumir que os critérios... continuam a cumprir". Recomendação: adicionar uma tarefa explícita de remedição de `cargo test --test scale` com N canais representativo, documentando o resultado em `docs/` antes de arquivar — exatamente como a própria spec `key-envelope-integrity` já exige ("Resultado documentado").
- Manutenibilidade: OK — nenhuma tabela de permissão paralela é criada (D3), a conta de bot é satélite (D1) sem sobrecarregar `account`, e a revogação é cascade-only (D6); é um desenho simples de manter por uma pessoa só.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- `design.md` segue bem o estilo `Dx` já estabelecido no projeto (contexto, porquê, alternativa rejeitada) — nove decisões bem delimitadas, com riscos e plano de migração explícitos. É uma boa ADR na forma.
- Achados de conteúdo já cobertos acima (D8 com premissa Tauri desatualizada; D5 com referência de módulo incorreta) pertencem a esta dimensão tanto quanto à 1/2 — são imprecisões factuais dentro de decisões já registadas, não decisões em falta.
- Diagramas: a change não traz diagrama novo (mermaid) para o fluxo de handoff com bot nem para a troca de token→sessão→token LiveKit do bot de música; dado que esse fluxo tem 3 saltos (token de bot → sessão WS → token LiveKit) e é o ponto mais sensível de toda a change, um diagrama de sequência (no estilo dos já existentes em `docs/arquitetura-tecnica.md` §7) ajudaria a revisão de implementação — não é bloqueante, mas é uma lacuna real dado o nível de complexidade.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why"/"What Changes" de `proposal.md` (bloqueador de segurança real: instalar um bot num canal daria acesso de decifragem ao Servidor inteiro no modelo actual) traduz-se de forma directa e rastreável nas Decisions do `design.md` e nas specs delta (`crypto/channel-keys`, `bots/integration`).
- O MVP (música + conversa) está bem delimitado e o fora-de-escopo é explícito (transcrição, slash-commands, intents, marketplace) — evita o risco, identificado pelo próprio TR, de o âmbito crescer para replicar todas as camadas do modelo de bots do Discord de uma vez.
- Os dois casos de uso de RPG (bot de música para sessão, bot de conversa com conhecimento próprio) são sustentáveis na arquitetura escolhida: o bot de música usa o mesmo mecanismo LiveKit+frame-key que qualquer participante humano, o bot de conversa usa o mesmo protocolo WS+ACL que qualquer membro — nenhum dos dois fica como promessa vaga.

## Bloqueantes antes de implementar

- nenhum

(As ressalvas de visibilidade/threat-model e de remedição de escala, dimensão 3, são fortemente recomendadas antes de instalar o primeiro bot em produção, mas não impedem o início da implementação do schema/backend/frontend descrito nas tasks 1–5.)

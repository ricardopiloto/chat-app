# Review — Arquiteto de Soluções

**Change:** tune-speaking-indicator-latency
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A change respeita a fronteira de responsabilidade já estabelecida neste projeto: detecção de fala é explicitamente responsabilidade do LiveKit, não do hub/app (`docs/arquitetura-tecnica.md:94`, "O hub não carrega tráfego de mídia... isso é responsabilidade exclusiva do LiveKit"). Tunar `infra/livekit.yaml` em vez de construir detecção no cliente está alinhado com essa decisão já tomada, não a reabre.
- Sem novo componente; o pipeline evento→UI existente é mantido (D2).
- Escalabilidade: a change reconhece explicitamente o trade-off de aumentar a frequência de notificação do SFU (Risks) — proporcional, sem prometer um número de usuários concorrentes que o projeto não tem como validar nesta fase.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- **Achado (modelo de distribuição self-hosted):** `infra/livekit.yaml` no repositório é um *template*, não uma configuração viva de um único serviço gerido pela equipa. Confirmei em `docs/deploy-producao.md:125` ("Edite `infra/livekit.yaml`") e `:460,465` (instrução para o operador fazer backup do seu próprio `infra/livekit.yaml` já editado) que cada instância, incluindo a instância oficial (`parley.1nodado.com.br`, `docs/deploy-producao.md:4`), tem a sua própria cópia editada manualmente no servidor. Alterar o valor padrão no repositório **não propaga** para nenhuma instância já em produção — nem mesmo para a instância oficial que o próprio projeto opera. O `proposal.md` ("Impact") e o `design.md` não mencionam isso: listam apenas o ficheiro de template e a verificação de chaves contra a imagem fixada, sem nenhuma acção para (a) aplicar a mudança na instância oficial já implantada, ou (b) avisar operadores existentes de que precisam de editar o seu próprio `livekit.yaml` para obter a melhoria.
  - Recomendação: adicionar uma tarefa explícita para actualizar a instância oficial, e uma nota em `docs/deploy-producao.md`/`docs/operar-instancia.md` ou no `CHANGELOG.md` dizendo aos operadores existentes que valores novos de `audio.update_interval`/`audio.smooth_intervals` existem e como aplicá-los — seguindo o mesmo padrão já usado nesses documentos para outras instruções de LiveKit.
- Fora isso, a integração é mínima e correta: nenhuma porta, serviço ou variável de ambiente nova; `infra/docker-compose.yml` não precisa de alteração.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança: N/A, config de detecção de áudio não toca autenticação/criptografia.
- Performance: trade-off de frequência vs. estabilidade já reconhecido e colocado como tarefa de medição (tasks 2.1), não como suposição.
- Manutenibilidade: mudança de configuração pequena e reversível; adequada à capacidade operacional de um projeto self-host pequeno/médio.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1/D2 seguem o padrão de alternativa-rejeitada já usado neste projeto, com uma ressalva honesta e bem colocada: "the sample is current upstream; implementation should confirm these keys against the pinned v1.13.5 image before deployment" — trata uma incerteza real (chaves de config não verificadas contra a versão fixada) como tarefa (1.1), não como facto assumido.
- Sem diagrama — correto, é uma mudança de configuração de um único serviço já desenhado.
- Ligado ao achado da dimensão 2: a lacuna não é a ausência de ADR, é a ausência de uma acção de propagação/documentação operacional, que normalmente vive ao lado do ADR neste projeto (`docs/deploy-producao.md` já documenta outras edições de `livekit.yaml`).

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why" (indicador atrasado) é traduzido de forma honesta: a proposta não promete sincronização exacta ("avoid promise exact synchronization under network jitter", Non-Goals), apenas uma melhoria mensurável a validar em chamada real — ponte produto↔técnico bem calibrada, sem vender algo que a arquitetura (detecção no SFU, sujeita a rede) não pode garantir.

## Bloqueantes antes de implementar

- nenhum

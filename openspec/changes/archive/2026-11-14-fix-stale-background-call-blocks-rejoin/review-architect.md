# Review — Arquiteto de Soluções

**Change:** fix-stale-background-call-blocks-rejoin
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A change não introduz stack nova: trabalha dentro do renderer SolidJS existente (`frontend/src/voice/callSession.tsx`) e do processo principal Electron (`frontend/electron/main.ts`), coerente com o shell Electron já documentado em `docs/arquitetura-tecnica.md:76` (nota de reconciliação confirmando Electron, não Tauri/binário único).
- Responsabilidades ficam claras: renderer dono dos guardas de join/leave/epoch; processo principal dono do ciclo de vida da janela e do lock de instância única.
- Escalabilidade não se aplica — é uma correcção do caminho de recuperação de um único usuário/sessão, não um problema de carga.

## 2. Integração com a infraestrutura existente

Veredito: OK

- D4 usa `app.requestSingleInstanceLock()`, API nativa do Electron, sem novo processo, porta ou dependência — consistente com o critério de leveza do projeto (`docs/arquitetura-tecnica.md:16`).
- Confirmei em `backend/src/api/voice.rs:202-237` (`upsert_occupant`) que a reivindicação do D1 é real: trocar de canal com a mesma conta já chama `apply_leave` na ocupação antiga antes de inserir a nova — o backend já suporta substituir um assento obsoleto, a change não precisa (e não propõe) tocar na API.
- Nenhum impacto em banco, deploy ou LiveKit (`infra/livekit.yaml`, `infra/docker-compose.yml` não são tocados).

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- Segurança: sem impacto; lock de instância única e foco de janela não tocam autenticação nem IPC exposto a conteúdo não confiável.
- Performance/trade-off já documentado: D3 (`backgroundThrottling: false`) aumenta uso de recursos com a janela oculta — risco já assumido e limitado à janela principal (design.md linha 44). OK.
- **Achado:** D1 define "um deadline finito" para o cleanup (`disconnect(true)` + leave do servidor) sem indicar um valor concreto nem uma faixa. Esse número é, na prática, o tempo máximo que a pessoa espera entre pedir um rejoin e ver "conexão nova" ou "falha visível" (ver Scenario "Stalled disconnect before rejoin") — é um parâmetro com efeito directo em UX, não só um detalhe de implementação. Recomendo registar aqui um valor (ou faixa) por defeito e o motivo (ex.: alinhado a um timeout de ICE/LiveKit já existente), em vez de deixá-lo inteiramente para quem implementar decidir sem revisão.
- Manutenibilidade: o conceito de "epoch"/geração para invalidar trabalho antigo é um padrão conhecido e proporcional ao tamanho da equipa deste projeto; aceitável.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- D1-D3 seguem bem o padrão de alternativa-rejeitada já usado em `fix-popout-spotlight-layout` e `per-participant-volume-boost`. D4 também o segue e tem uma justificação explícita de por que entra nesta mesma change (design.md linha 37) — bom.
- **Achado (classificação de capacidade):** a nova Requirement "Desktop relaunch reopens the existing call-owning window" foi colocada em `specs/frontend-v2/voice-session/spec.md`, mas o lock de instância única e a restauração de janela são comportamento do shell Electron, não da capacidade de sessão de voz. O próprio projeto já estabeleceu o precedente contrário: a change já implementada `electron-system-tray-notifications` registou exactamente este tipo de requisito ("Fechar a janela esconde para a tray") em `specs/desktop/shell/spec.md`, não em `frontend-v2/*` (confirmado em `openspec/changes/electron-system-tray-notifications/specs/desktop/shell/spec.md:19`). A capacidade `frontend-v2/voice-session` já aceita (`openspec/specs/frontend-v2/voice-session/spec.md`) é sobre comportamento de chamada dentro do renderer (controlos, pré-entrada, indicadores) — um utilizador que nunca usou chamada de voz ainda assim é afectado por esta nova regra de instância única, o que é um sinal de que ela não pertence a essa capacidade. Recomendo mover essa Requirement (e a secção correspondente de `proposal.md`/Impact) para `specs/desktop/shell/spec.md`, mantendo as outras duas Requirements (recuperação de sessão obsoleta, reset de pagehide) em `frontend-v2/voice-session`, onde já estão correctamente.
- Nenhum diagrama — aceitável para esta change (fluxo de poucos passos, sem componentes novos); não exigir.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why"/"What Changes" traduz fielmente o relato do usuário (ciclo de vida da janela, instância duplicada) em decisões técnicas concretas e verificáveis (D1-D4), sem deixar nenhuma parte como promessa vaga.
- Boa prática já presente: o design.md já referencia cruzadamente a change paralela `fix-stale-background-call-blocks-rejoin` ↔ `close-button-behavior-preference` (que também edita `main.ts:98-103,716-720`) como risco de edição sobreposta — isso sustenta a ordem de implementação pedida pelo usuário (correcções antes de novas funcionalidades), já que `close-button-behavior-preference` constrói sobre o `showMainWindow()`/lock desta change.

## Bloqueantes antes de implementar

- nenhum

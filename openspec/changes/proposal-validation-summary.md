# Resumo de validação das propostas

| Change | `openspec validate <nome> --strict` |
| --- | --- |
| `improve-call-view-controls` | Passou |
| `voice-session-live-updates` | Passou (`skip_specs: true`) |
| `restrict-scene-edit-to-channel-creator` | Passou |
| `channel-webhooks` | Passou |
| `fix-call-popout-windows-join-error` | Passou (`skip_specs: true`) |

## Suposições e limites da investigação

- O canal já tem `created_by_account_id`. A migração 0006 atribuiu ao dono do servidor a autoria dos canais antigos; não há base para recuperar outro criador histórico.
- Na sincronização em tempo real, já existem listeners LiveKit e `voice.occupancy`; o ponto exacto da falha reportada ainda depende de reprodução com dois clientes. O plano cobre lista LiveKit, roster lateral e pré-entrada.
- No popout Windows, a corrida de inicialização da instância/sessão é hipótese, não causa comprovada. A primeira tarefa é instrumentar e reproduzir.
- Os canais são criados com E2EE activo. A proposta de webhooks pressupõe consentimento explícito para mensagens de integração em claro, mantendo cifradas as mensagens humanas.

## Actualização da proposta `channel-webhooks`

- `design.md`: D3 define uma conta de sistema dedicada por canal e tabela `channel_webhook` com unicidade por canal, revogação por `revoked_at` e preservação da conta/mensagens. D1/D4 e riscos cobrem gestão por permissão efectiva, estado activo por pedido, login recusado e contagem apenas de contas humanas nos dois caminhos de onboarding. A FK de `message` permanece intacta.
- `proposal.md`: Why, What Changes e Impact reflectem a conta por canal, a revogação sem apagar histórico e a migração aditiva.
- `tasks.md`: migração de `channel_webhook` e `is_system_account`, correcção explícita de `account::count`, revogação sem `DELETE` e trabalho de frontend/API/WS para identidade do webhook.
- `specs/frontend-v2/channel-webhooks/spec.md`: requisitos existentes agora exigem uma conta por canal, reactivação da mesma identidade, revogação com histórico preservado e apresentação independente do roster.
- **Escolha visual:** snapshot do nome/avatar em cada mensagem. Renomear o webhook depois não altera a identidade mostrada no histórico; `MessageRow` obtém-na da mensagem porque a conta não está em `membership`.
- **Validação:** `openspec validate channel-webhooks --strict` passou.

## Propostas de 2026-11-07: voz

| Change | `openspec validate <nome> --strict` |
| --- | --- |
| `enable-basic-noise-suppression` | Passou |
| `direct-join-call-entry` | Passou |

Suposições: a câmara começa **sempre desligada em cada novo join**, inclusive quando a preferência anterior indicava ligada; o microfone segue a preferência guardada e fica ligado por omissão. O modo «Testar vídeo» sintético deixa de estar disponível na entrada; o preview de câmara nas definições permanece. O popout só visualiza, portanto não precisa da constraint de áudio. O preview de microfone recebe a mesma constraint da chamada para manter coerência. A eficácia acústica da supressão nativa depende do navegador e será verificada manualmente de forma best-effort.

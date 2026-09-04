# Lacunas E2EE — Fase 1

A spec desta fase (FR-016, US5, Assumptions) define o *done* da proteção ponta-a-ponta **no cliente web**, nas famílias de navegador já exercitadas no spike Fase 0 nesta máquina (Chromium e Firefox/Gecko, incluindo Zen).

## O que está no done

- Texto: AES-256-GCM com `server_key` gerada no cliente; o backend só persiste ciphertext.
- Voz/vídeo: a mesma `server_key` é aplicada como frame key via `ExternalE2EEKeyProvider` do `livekit-client` (Insertable Streams / Encoded Transforms).
- Handoff da chave: `crypto_box_seal` entre membros; o servidor só armazena envelopes opacos.
- Não existe rota nem controlo de UI para desligar essa proteção (gravação no servidor fica para fase posterior).

## Gaps explícitos (não bloqueiam o done)

- **Safari / WebKit (macOS)** e webviews de estoque: Insertable Streams / Encoded Transforms podem faltar ou comportar-se de outro modo. Não é requisito de aceite da Fase 1.
- **Windows**: não foi a plataforma de validação desta fase. Um terceiro cliente Windows no mesmo canal é gap a registar, não falha do MVP Linux/web.
- **Tauri / WebKitGTK no Linux**: o spike Fase 0 mostrou `RTCPeerConnection` indefinido no RPM desta máquina. Cliente nativo fica para um port futuro.
- Handoff pendente se nenhum membro já sincronizado estiver online no momento do convite: a UI mostra “sincronizando chave” até alguém com a chave abrir o cliente.

## Como inspecionar (SC-006)

1. Mensagens: `sqlite3 backend/chat.db "select content_ciphertext from message limit 1;"` — o blob não é o texto original.
2. Envelopes: a coluna `key_envelope.sealed_key` não contém a `server_key` em claro.
3. LiveKit: o SFU encaminha frames; o operador da instância não obtém áudio/vídeo decodificável sem as chaves dos clientes.

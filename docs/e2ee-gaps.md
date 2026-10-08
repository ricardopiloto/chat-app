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

## Recuperação de senha

O servidor passa a guardar `account.recovery_vault`: a chave secreta de identidade embrulhada com uma chave derivada de um código que só o cliente conhece. O código e a chave secreta não são enviados. `GET /api/auth/me` expõe apenas `has_recovery_key`. O cofre sai em `POST /api/auth/recovery/key/start` depois de uma assinatura Ed25519 de um desafio de uso único. O reset com código do operador (`POST /api/auth/recovery/code/redeem`) cria uma identidade nova e apaga os envelopes dessa conta. A recuperação pela chave (`POST /api/auth/recovery/key/redeem`) troca a senha e o cofre da mesma identidade e não mexe nos envelopes. Formato em `docs/v2/contracts/crypto-formats.md` §9.

Medição de 2026-10-08 em `cargo test --test scale` (debug, Linux 7.2.8, Ryzen 9 3900X, SQLite 3.46.0), registada em `docs/backlog/TR-item18-recuperacao-de-senha.md` §12. Substituição de identidade numa conta em 20 Servidores de 300 membros: p95 27 ms e 5980 eventos. `DELETE` por conta usa `idx_key_envelope_account` (p95 0,17 ms; sem o índice, varrimento, p95 3,5 ms). Guarda do envelope próprio com 1001 envelopes: p95 0,91 ms. Manada de 300 respostas: exactamente 1 gravação e 299 recusas, média 0,83 ms. Replay de 50 pendentes: p95 9,6 ms e um evento por pendente. Todos os critérios cumprem, sem limitar o fan-out. O change dos bots, se aplicar envelopes por canal, multiplica estas linhas e estes eventos pelo número de canais.

## Como inspecionar (SC-006)

1. Mensagens: `sqlite3 backend/chat.db "select content_ciphertext from message limit 1;"` — o blob não é o texto original.
2. Envelopes: a coluna `key_envelope.sealed_key` não contém a `server_key` em claro.
3. LiveKit: o SFU encaminha frames; o operador da instância não obtém áudio/vídeo decodificável sem as chaves dos clientes.

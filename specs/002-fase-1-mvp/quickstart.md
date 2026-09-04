# Quickstart: validação da Fase 1 — MVP

Guia de validação fim-a-fim, no mesmo espírito manual do spike Fase 0 ([D8](./research.md#d8--testes-cargo-test-no-backend--validação-manual-multi-navegador)). Cobre as 5 User Stories da spec na ordem de prioridade. Rodar após `cargo test` verde no backend.

## Pré-requisitos

- Docker (grupo `docker` configurado, ou `sudo`) para `infra/docker-compose.yml` (LiveKit self-hosted + TURN embutido).
- Rust stable (backend), Node LTS (build do frontend).
- Duas janelas/perfis de navegador Chromium ou Firefox **distintos** (para simular duas contas sem compartilhar `localStorage`/IndexedDB) — família validada no spike para Insertable Streams.
- Porta de sinalização LiveKit (7880) e faixa de mídia UDP acessíveis entre as máquinas de teste (FR-017 — mesma checklist do procedimento de subida documentado).

## Setup

```bash
cd infra && docker compose up -d      # sobe LiveKit + TURN
cd ../backend && cargo run             # sobe a API na porta configurada (SQLite criado no primeiro boot)
cd ../frontend && npm install && npm run dev   # SPA em modo dev
```

Confirma: `curl http://127.0.0.1:7880` responde; a SPA carrega no navegador.

## US1 — Subir a instância e criar conta (P1)

1. Instância recém-criada (banco vazio): abra a SPA, cadastre a **primeira** conta (handle + senha). Confirme login automático. → SC-001 (tempo desde "seguir a doc" até "instância respondendo").
2. Em outro navegador/aba anônima, tente cadastrar uma segunda conta **só pelo endereço** (sem convite). Confirme recusa visível (403, mensagem na UI).
3. Tente cadastrar o mesmo `handle` da conta 1 (via convite — gerar um na etapa US2). Confirme recusa (409).
4. Logout na conta 1; confirme que a próxima ação exige login de novo (sessão revogada — `Session.revoked_at`).

**Done da US1**: passos 1–4 sem falha inesperada.

## US2 — Servidor, canal de texto e convite (P1)

1. Conta A (autenticada) cria um Servidor "Mesa de RPG" e um canal de texto "geral".
2. A gera um convite **sem** histórico (default) e outro **com** histórico, ambos com expiração padrão.
3. A envia 2 mensagens em "geral" **antes** de qualquer outra conta entrar.
4. Conta B (nova, sem conta prévia) aceita o convite **sem** histórico → cria conta nesse fluxo, vira membro. Confirme: B **não** vê as 2 mensagens anteriores; nova mensagem de A depois do join aparece para B em tempo real (evento `message.new`).
5. Conta C aceita o convite **com** histórico → confirme que C lê as 2 mensagens antigas.
6. Conta D (sem convite algum) tenta abrir a URL do Servidor: confirme que nem lista nem abre (FR-005/SC-007).
7. A revoga o convite sem histórico; confirme que uma nova tentativa de aceite falha (410).

**Done da US2**: 4–7 sem falha; cronometrar 1–6 para SC-002 (<10min).

**E2EE check (US5, adiantado aqui)**: inspecionar o arquivo SQLite da instância (`sqlite3 backend.db "select content_ciphertext from message limit 1"`) — confirmar que não é texto legível.

## US3 — Canal de voz/vídeo, grade automática (P1)

1. A cria um canal `voice_video` (grade nasce com 4 slots, `assigned_by = auto`).
2. B e C (já membros) entram no canal, publicam câmera+microfone em navegadores/perfis diferentes. Confirme: B ocupa slot 0, C ocupa slot 1 (primeiro-vazio, FR-011); slots 2–3 seguem vazios e visíveis, grade não compacta.
3. Confirme A/V bidirecional entre B e C (áudio e vídeo visíveis nos dois sentidos).
4. B sai da chamada e reentra: confirme que volta ao slot 0 (não "primeiro vazio" — se C estivesse fora, B não pegaria o slot de C).
5. Um dos participantes usa uma câmera em retrato (celular real ou `--use-fake-device-for-media-stream` com resolução vertical): confirme que o vídeo cabe no slot sem esticar/mudar o zoom da grade dos outros clientes (SC-005 — comparar geometria da grade antes/depois).
6. Mesma conta B abre um segundo dispositivo/aba e publica câmera: confirme que o slot 0 permanece de B, o segundo dispositivo passa a ser a fonte de A/V, e o primeiro dispositivo para de enviar (fica só "presente", sem publicar).

**Done da US3**: 2–6 sem falha; cronometrar 1–3 para SC-003 (<5min); repetir 4 em 100% das tentativas para SC-004.

## US4 — Dono define as posições da grade (P2)

1. A (dono) abre o painel de administração do canal de vídeo, define `slot_count = 2`, coloca B no slot 0 e C no slot 1 explicitamente (`assigned_by = owner`).
2. B e C saem e recarregam a SPA; confirme que as posições persistem (não voltam ao mapa automático).
3. B (sem permissão de admin) tenta mover C de slot via API/UI: confirme recusa e que o layout não muda para ninguém.

**Done da US4**: 1–3 sem falha.

## US5 — E2EE ligado por padrão (P2)

1. Com B e C em chamada (US3), no host do LiveKit inspecionar o tráfego de mídia encaminhado (ex.: `docker compose logs livekit` + qualquer captura permitida) — confirmar que não há indicação de decodificação em claro pelo SFU.
2. Repetir o check de mensagens do passo "E2EE check" da US2 para o canal do canal de vídeo (texto do mesmo canal).
3. Procurar na UI por qualquer controle de "desligar proteção para gravar": confirmar que **não existe** nesta fase (FR-015, Acceptance Scenario 3).

**Done da US5**: 1–3 sem falha → SC-006.

## Critério de aceite geral (spec "Definição de done")

Um operador publica a instância (Setup acima); pelo menos duas contas entram por convite, trocam texto e se veem/ouvem num canal de vídeo com slots fixos; nenhuma inspeção do lado do operador revela conteúdo em claro. Todas as seções US1–US5 acima passam.

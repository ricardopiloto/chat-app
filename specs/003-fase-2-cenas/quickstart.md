# Quickstart: validação da Fase 2 — cenas

Guia manual, no mesmo espírito da Fase 1 ([`specs/002-fase-1-mvp/quickstart.md`](../002-fase-1-mvp/quickstart.md)). Assume instância Fase 1 já a responder (contas, Servidor, canal de vídeo, A/V). Rodar após `cargo test` verde no backend (incluindo os contratos novos de cenas).

Pré-requisitos e setup: [docs/operar-instancia.md](../../docs/operar-instancia.md). Dois (idealmente três) perfis de navegador distintos.

Contratos: [contracts/scenes-api.yaml](./contracts/scenes-api.yaml), [contracts/ws-events.md](./contracts/ws-events.md). Modelo: [data-model.md](./data-model.md).

## US1 — Guardar e trocar cenas ao vivo (P1)

1. Conta A (dona do Servidor) e conta B, já membros, entram no canal de voz/vídeo e publicam câmara. Confirme A/V e a grade F1 (cena migrada **Cena padrão** visível na lista; é a activa).
2. A cria uma cena nova **como cópia do quadro visível**, nome `Foco no mestre`. Confirme: a lista tem duas cenas; o quadro ao vivo **não** muda (ainda Cena padrão); B vê a mesma grade.
3. A edita a cena `Foco no mestre` (ainda inactiva): um slot só com A, restantes vazios. Confirme: o quadro ao vivo continua Cena padrão.
4. A **activa** `Foco no mestre` durante a chamada. Confirme: A e B mostram a mesma ocupação em poucos segundos, **sem** sair da sala; áudio não cai de forma permanente (SC-002, SC-007).
5. A activa de novo Cena padrão. Confirme regresso ao mapa anterior.
6. A **duplica** Cena padrão da lista com nome `Mesa cópia`. Confirme: activa continua Cena padrão até A activar a duplicata.
7. B recarrega a SPA (ainda na chamada ou reentra). Confirme: vê a cena activa actual, não um mapa de primeiro-vazio diferente do de A (SC-003).
8. Com `Foco no mestre` activa (um slot), uma terceira conta C entra na chamada. Confirme: C ouve/vê a grade e **não** ganha slot extra; layout não compacta (FR-007).
9. B (membro, sem admin nem co-direção) tenta criar/activar/apagar via UI ou API. Confirme recusa; quadro inalterado.
10. A tenta apagar a cena **activa**. Confirme recusa. A activa outra e apaga a anterior. Confirme sucesso. A tenta apagar a última cena restante: recusa.

Cronometrar o passo 2+4 na primeira vez (SC-001, menos de 2 min).

**Done da US1**: 1–10 sem falha inesperada.

## US2 — Co-diretor (P2)

1. A (admin) marca B como co-diretor **neste** canal. Confirme que B passa a poder activar cenas já existentes.
2. B activa `Foco no mestre` (ou a segunda cena). Confirme que A e B (e C se na chamada) vêem a troca.
3. B tenta criar, duplicar, editar, apagar ou nomear outro co-diretor. Confirme recusa.
4. C (sem papel) tenta activar. Confirme recusa.
5. A revoga B. Confirme que a próxima activação de B falha.

**Done da US2**: 1–5 → SC-004.

## E2EE e fora de escopo (SC-005, SC-006)

1. Procurar na UI e na API por desligar protecção ou gravar/exportar no servidor. Confirme que **não existe**.
2. Inspeccionar SQLite: corpos de mensagem continuam ciphertext; não há tabela de captura.

## Critério de aceite geral

Canal F1 já funcional; A cria pelo menos duas cenas, troca ao vivo, todos vêem o mesmo quadro; B como co-diretor também troca; protecção ponta-a-ponta intacta. Definição de done da spec.

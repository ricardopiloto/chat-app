# Quickstart: 030-voice-roster-avatars

Validação E2E do ícone na lista de jogadores e nos grupos de texto. Requer 028 (ocupação) e 029 (foto de perfil) já na instância.

## Prerequisites

- Backend + frontend + LiveKit (README / [operar-instancia](../../docs/operar-instancia.md)).
- Duas contas no mesmo servidor (A com foto de perfil, B pode sem).
- Reiniciar `cargo run` se a ocupação/avatares ainda não estiverem no processo.

## Automated

```bash
cd backend && cargo test --test contract
cd frontend && npx tsc --noEmit
```

Contratos: [voice-occupancy-avatars.md](./contracts/voice-occupancy-avatars.md). Esperado: ocupante com avatar → `has_avatar: true` no snapshot.

## Manual — User Story 1 (lista de voz)

1. A (com foto) junta-se à mesa com mic ou câmara ligados.
2. B, num canal de **texto**, vê A aninhado sob o canal de voz **com a foto de A** à esquerda do handle (&lt;3 s).
3. A desliga mic e câmara → a linha some; o cronómetro continua (028).
4. Conta sem foto a transmitir → iniciais no círculo, mesmo tamanho.

## Manual — User Story 4 (canal de texto)

1. A (com foto) envia uma mensagem em `#geral`.
2. B vê o grupo com a **foto de A** à esquerda do nome, um ícone por grupo (não por linha).
3. Autor sem foto → iniciais; layout do bloco intacto.
4. B na mesma vista: lista de voz (se A transmitir) e mensagem mostram a mesma regra foto/iniciais.

## Manual — Clarificação B (sem push)

1. A já visível na lista (ou com mensagens no ecrã de B).
2. A altera ou remove a foto.
3. B **sem** reabrir a vista pode continuar a ver o ícone antigo.
4. B reabre membros / muda de canal e volta → ícone actualizado (foto nova ou iniciais).

## Fora deste quickstart

Distintivo Anfitriã, a falar, ocupação de canais de texto, alterar quem entra na lista de voz.

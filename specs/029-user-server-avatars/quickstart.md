# Quickstart: 029-user-server-avatars

Validação E2E de avatar de utilizador e imagem de servidor. Requer shell autenticada e pelo menos um servidor (dono + segundo membro opcional para SC-004).

## Prerequisites

- Backend + frontend a correr (ver [README](../../README.md) / [operar-instancia](../../docs/operar-instancia.md)).
- Conta A = dono do servidor; Conta B = membro (para testes de permissão).
- Ficheiros de teste: JPEG/PNG/WebP ≤1 MiB; um ficheiro >1 MiB; opcionalmente um `.gif`.

## Automated

```bash
cd backend && cargo test
cd frontend && npx tsc --noEmit
```

Contratos esperados: ver [contracts/avatars-api.md](./contracts/avatars-api.md).

## Manual — User Story 1 (avatar)

1. Login como A → abrir menu da conta → abrir definições de avatar.
2. Escolher imagem válida ≤1 MiB → gravar.
3. **Esperado**: chip da topbar mostra a imagem (não só iniciais) sem reload completo da app.
4. Substituir por outra imagem → chip actualiza.
5. Remover avatar → fallback de iniciais.
6. Ficheiro >1 MiB ou tipo inválido → erro claro; avatar anterior (se houver) mantém-se.

## Manual — User Story 2 (imagem do servidor)

1. Como dono A: no menu/gestão do servidor (junto a convite/apagar), definir imagem válida.
2. **Esperado**: rail mostra a imagem desse servidor.
3. Remover → fallback de iniciais do nome.
4. Login como B (membro, não dono): **não** há controlo de alterar imagem; tentativa API → 403.

## Manual — User Story 3 (exibição)

Com avatares definidos:

| Sítio | Esperado |
|-------|----------|
| Chip topbar | Avatar de A |
| Lista de membros | Avatar de A (e outros com avatar) |
| Mensagens de texto de A | Avatar junto ao grupo |
| Rail | Imagem do servidor |
| Conta sem avatar | Iniciais, layout intacto |

## Refetch (FR-009)

1. A define avatar; B já tem a vista de membros aberta.
2. B muda de canal / reabre membros / refresca lista → passa a ver o avatar de A.
3. Sem exigir evento WS em tempo real.

## Ops check

- `AVATARS_DIR` (default `./data/avatars`) existe após boot; ficheiros aparecem após upload.
- Variável documentada em `docs/operar-instancia.md`.

# Quickstart: 006 — Fidelidade + E2EE/gravar + rail/delete

Pré-requisitos: LiveKit + backend + SPA (`docs/operar-instancia.md`). Duas contas; dono com ≥2 Servidores se possível. Após migração, **recriar** canais de voz para Gravar (legado sem `channel_key`).

## Regressão automática

```bash
cd backend && cargo test
cd frontend && npx tsc --noEmit
```

## US1 — Rail + shell

1. Login; confirmar rail com ícones/iniciais + lista de canais.
2. Com 2 Servidores, clicar outro ícone → canais mudam; header mostra nome **sem** menu de troca.
3. Tema claro/escuro; palco continua escuro.
4. Modo palco → rail+canais somem; Mostrar canais → voltam.
5. Viewport estreita: gaveta + palco com vídeo visível.

## US1b — Delete

1. Como dono: context menu num canal → Apagar → confirmar → canal some para membros.
2. Como membro não-dono/não-criador: sem Apagar efectivo (403).
3. Único canal do Servidor: Apagar bloqueado (409 / UI).
4. Apagar Servidor (dono) → some do rail; membros perdem acesso.
5. Apagar canal de voz com gente dentro → chamada cai.

## US2 / fidelidade

1. Lado a lado com protótipo: texto + voz (excepto rail).
2. Preencher [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md).

## US3 — Continuidade após Salvar

1. 2 contas em voz com vídeo.
2. Dono Editar → mudar layout/slots → Salvar **3×**.
3. Esperado: ninguém sai; vídeo nos slots certos ≤2s.

## US4 — Cover

1. Layout Mestre e Faixa: vídeos preenchem tiles, centrados, sem letterbox dominante.

## US2b — Gravar / E2EE / custódia

1. **Criar** canal voz: ver chave, checkbox, Criar desabilitado até marcar.
2. Com egress OK: Gravar → faixa E2EE off para todos → Parar → Religar com chave → faixa some.
3. Com egress off/misconfig: Gravar → erro claro; **sem** faixa falsa.
4. Canal legado (sem key): Gravar/Religar desabilitados.

## Referências

- [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/](./contracts/) · [docs/backlog-prototype-v2-gaps.md](../../docs/backlog-prototype-v2-gaps.md)

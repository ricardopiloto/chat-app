# Quickstart: validação da Fase 3 — Redesign Mesa / Nocturne

Guia manual. Assume Fases 1–2 validadas (contas, Servidor, canais, cenas, E2EE on).

Pré-requisitos: [docs/operar-instancia.md](../../docs/operar-instancia.md). Abrir o protótipo lado a lado: `docs/design-ref/Mesa - Protótipo v2.dc.html`.

Contratos: [contracts/ui-shell.md](./contracts/ui-shell.md), [contracts/ui-preferences.md](./contracts/ui-preferences.md), [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md). Modelo UI: [data-model.md](./data-model.md).

## Antes do manual

```bash
cd backend && cargo test
cd ../frontend && npx tsc --noEmit
# backend + frontend + LiveKit como em operar-instancia.md
```

## US1 — Shell e tema (P1)

1. Abrir `https://127.0.0.1:1420` (ou IP LAN). Confirme auth Nocturne (marca Mesa, tokens). Entre / desbloqueie chaves.
2. Confirme barra: Mesa, `instância ·` + hostname, tema, utilizador. Sidebar única com Texto / Voz e vídeo — **sem** rail.
3. Com dois Servidores, troque pelo cabeçalho. Lista muda; isolamento mantém-se.
4. Tema claro ↔ escuro: chrome muda; palco (ao abrir voz) continua escuro; recarregar mantém tema.
5. Em canal de voz, Modo palco: sidebar some; “Mostrar canais” restaura. Chamada não cai.
6. Reduza a janela (&lt;~768–900px) ou use telemóvel: gaveta sobreposta; modo palco fecha-a.

**Done US1**: 1–6 + SC-001/003/005.

## US2 — Texto, voz, Composição/Grade (P1)

1. Canal de texto: mensagens agrupadas, E2EE activa, composer. Sem aspect de dashboard genérico.
2. Duas contas em voz; cena com slots e alguém no banco (ou force um sem slot).
3. Composição: só slots da cena. Grade: todos na chamada. Alternar e descrever a diferença.
4. Recarregar / outro canal de voz: mesma preferência Composição|Grade.
5. Confirme **ausência** de Gravar cena / E2EE desligada.

**Done US2**: 1–5 + SC-004/008.

## US3 — Editor de cenas (P2)

1. Dono: editar cena, mover do banco → slot, **Descartar** → mapa persistido intacto.
2. Editar de novo, **Salvar** cena inactiva → quadro ao vivo inalterado; activar → todos vêem.
3. Editar cena **activa**, Salvar → todos actualizam sem sair da room.
4. Sair do editor com mudanças: diálogo guardar/descartar/cancelar.
5. Só teclado: atribuir pessoa a slot (percurso documentado na UI ou neste guia após implement).
6. Co-diretor: só activar; membro: sem CRUD.

**Done US3**: 1–6 + SC-007; regressão F2 ok.

## US4 — Auth, convite, diálogos (P2)

1. Logout / janela anónima: login e registo Nocturne.
2. Fluxo convite: ecrã alinhado; ingresso ok.
3. Criar Servidor / canal / copiar convite: diálogos Nocturne + feedback “Copiado”.

**Done US4**: 1–3.

## Fidelidade (SC-006)

Preencher [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md) (≥90%).

## Critério de aceite geral

Protótipo v2 reconhecível na app; F1+F2 sem regressão funcional; E2EE sempre on na UI; preferências locais conforme contrato.

# Fidelity Checklist — 006 vs Protótipo v2

Comparar com `docs/design-ref/Mesa - Protótipo v2.dc.html`. Meta ≥90% **aplicáveis**. Rail = desvio aceite (N/A ou ✅ documentado).

**Date**: 2026-09-04  **Reviewer**: implement (006)

| # | Item | ✅/❌/N/A | Nota |
|---|------|----------|------|
| 1 | Top bar 48px, marca, instância, tema, chip user | ✅ | Nocturne existente |
| 2 | Rail ícones + coluna canais (~238px) Nocturne | ✅ | desvio rail OK (Discord-like) |
| 3 | Header canais: nome só (sem switcher) | ✅ | switcher removido |
| 4 | Secções Texto / Voz e vídeo | ✅ | |
| 5 | Canal texto: header, 74ch, composer 44px | ✅ | chrome existente alinhado |
| 6 | Canal voz: header, Comp/Grade, palco, controlos | ✅ | + Gravar |
| 7 | Gravar + diálogo + faixa E2EE off | ✅ | egress best-effort |
| 8 | Editor: layouts + banco + Salvar/Descartar | ✅ | polish leve |
| 9 | Diálogos criar servidor/canal (campos no âmbito) | ✅ | + custody voz |
| 10 | Palco escuro em tema claro | ✅ | tokens existentes |
| 11 | Modo palco esconde rail+canais | ✅ | |
| 12 | Cover/center nos tiles com vídeo | ✅ | object-fit: cover |
| 13 | Sem chat / co-diretor no voz | ✅ | |
| 14 | Continuidade vídeo após Salvar cena | ✅ | layoutMedia reattach+play |
| 15 | Delete context menu (auth correcta) | ✅ | |

**Score**: 15 / 15 aplicáveis (pass ≥90%)

**Desvios aceites**: rail de servidores (não no HTML v2 literal); sem badges inventados (G9); sem diretório público / canal privado / canvas / roles (G3/G4/G7/G8).

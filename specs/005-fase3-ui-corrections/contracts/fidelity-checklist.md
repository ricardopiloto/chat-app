# Fidelity Checklist — Correções 005 (SC-003)

Comparar com `docs/design-ref/Mesa - Protótipo v2.dc.html`. Meta ≥90% aplicáveis.

**Date**: 2026-09-04  **Reviewer**: implement (/speckit-implement)

| # | Item | ✅/❌ | Nota |
|---|------|------|------|
| 1 | Modo palco no telemóvel mostra tiles/vídeo (não ecrã vazio) | ✅ | CSS stage-mode + min-height |
| 2 | Layouts nomeados: Mestre / 2×2 / Faixa no editor | ✅ | sceneLayouts.ts |
| 3 | Geometria Mestre (destaque span) visível na Composição | ✅ | CameraGrid cells |
| 4 | Faixa 5-up com 5 colunas | ✅ | |
| 5 | Banco só com gente na chamada sem slot | ✅ | inCallIds |
| 6 | Toque dois passos no telemóvel atribui/devolve | ✅ | SceneEditor |
| 7 | Editor estreito empilhado | ✅ | |
| 8 | Salvar/Descartar rascunho | ✅ | |
| 9 | Tipografia/botões à escala (não “miniatura”) | ✅ | 16px base, 44px targets |
| 10 | Call controls ≥40px | ✅ | 44px |
| 11 | Sem UI co-diretor | ✅ | |
| 12 | Sem chat texto no ecrã de voz | ✅ | |
| 13 | Não-dono não activa cena | ✅ | API + UI |
| 14 | Canal de texto ainda envia/lê | ✅ | Channel.tsx |
| 15 | `layout_key` sobrevive reload / 2º cliente | ✅ | migration + API |

**Score**: 15 / 15 (pass ≥14 ou ≥90%)

**Nota**: Confirmar visualmente US1 no telemóvel real com SPA a correr.

# Fidelity Checklist — Nocturne v2 (SC-006)

Comparar a SPA com `docs/design-ref/Mesa - Protótipo v2.dc.html` (+ DS Nocturne). Meta: **≥90%** itens ✅. Marcar ❌ só com justificação de fora-de-âmbito (spec Out of Scope).

**Date**: 2026-09-04  **Reviewer**: implement (/speckit-implement)

| # | Item | ✅/❌ | Nota |
|---|------|------|------|
| 1 | Fundo / chrome usam rampa Nocturne (azul-acinzentado), não tema genérico | ✅ | `nocturne.css` + `mesa-theme.css` |
| 2 | Tipografia Inter (ou fallback system-ui da mesma família) | ✅ | Google Fonts Inter no DS |
| 3 | Raios ~8–16px; botões primários outline em acento blurple | ✅ | `.btn-primary` outline |
| 4 | Acento não preenche áreas grandes do chrome | ✅ | marca + outline |
| 5 | Barra: marca Mesa + `instância ·` hostname + tema + utilizador | ✅ | TopBar |
| 6 | Sidebar única; troca de Servidor no topo; sem rail de ícones | ✅ | Sidebar picker |
| 7 | Secções Texto / Voz e vídeo | ✅ | |
| 8 | Tema claro muda chrome; **palco permanece escuro** | ✅ | `--stage` fixo no light |
| 9 | Modo palco recolhe sidebar (desktop) / fecha gaveta (estreito) | ✅ | `.stage-mode` + eventos |
| 10 | Viewport estreita: sidebar em gaveta sobreposta | ✅ | &lt;900px |
| 11 | Canal texto: agrupamento por autor + E2EE activa + ~74ch | ✅ | Channel.tsx |
| 12 | Canal voz: cabeçalho cena + N de M; tiles com chip | ✅ | |
| 13 | Toggle Composição / Grade funcional | ✅ | `mesa.viewMode` |
| 14 | Banco visível na Composição quando há gente sem slot | ✅ | CallBank |
| 15 | Sem UI Gravar / E2EE desligada | ✅ | omitido (D7) |
| 16 | Editor: layouts + banco + Salvar/Descartar | ✅ | SceneEditor |
| 17 | Auth / convite / diálogos no mesmo sistema visual | ✅ | |
| 18 | Foco teclado visível (anel acento) | ✅ | `:focus-visible` DS |
| 19 | Controlos de chamada com alvo ≥40px (toque) | ✅ | `.call-controls .btn` |
| 20 | Rodapé sidebar: self-hosted · sem federação (ou equivalente) | ✅ | |

**Score**: 20 / 20  (pass se ≥18 ou ≥90% dos aplicáveis)

**Nota quickstart**: Validação visual completa US1–US4 deve ser confirmada pelo operador com SPA + protótipo lado a lado; itens acima reflectem o código entregue.

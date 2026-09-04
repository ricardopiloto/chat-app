# Backlog — lacunas do Protótipo Mesa v2 vs produto actual

**Fonte**: `docs/design-ref/Mesa - Protótipo v2.dc.html`, `docs/design-ref/design-prd.md`  
**Actualizado**: 2026-09-04 (006 entregue G1/G2/G5; 007 adia UI de cenas → G10)

**Nota de leitura do protótipo**: O v2 **não** inclui co-diretor nem chat de texto no ecrã de voz/vídeo. A etiqueta “(+ texto do canal)” no diálogo *criar canal* descreve o tipo no PRD histórico; o ecrã de vídeo do protótipo não tem composer.

**Como usar**: Actualizar a coluna **Estado** quando uma fatia for especificada ou entregue.

| ID | Capacidade no protótipo | Lacuna de produto | Prioridade sugerida | Estado |
|----|-------------------------|-------------------|---------------------|--------|
| G1 | **Gravar cena…** + diálogo Egress | Sem pipeline de gravação | Alta (cunha PRD) | **Entregue na 006** (UX+E2EE; artefacto se egress OK) |
| G2 | Faixa **E2EE desligada** + **Religar E2EE** + log de auditoria | Sem desligar E2EE nem auditoria de privacidade | Alta (acoplada a G1) | **Entregue na 006** |
| G3 | Opt-in **diretório público** ao criar servidor | Sem modelo de diretório na instância | Média | Diferido |
| G4 | Canal **privado** (só convidados do canal) | Sem permissões por canal | Média | Diferido |
| G5 | Custódia da **chave de E2EE do canal** + checkbox “Salvei a chave…” | Modelo de chave actual ≠ fluxo do protótipo | Alta (apoia religar) | **Entregue na 006** |
| G6 | Composer / chat no ecrã de voz | N/A no protótipo v2 | — | **N/A** (não é lacuna) |
| G7 | Metáfora **posição livre / canvas** | PRD descartou no MVP; só exploração no protótipo | Fora do MVP | Diferido (provável nunca) |
| G8 | **Papéis / roles** nos chips dos tiles (ex. “Mestre”) | Sem entidade de papel de mesa | Baixa | Diferido — na 006 omitir (sem mock) |
| G9 | Contagens / badges na lista de canais e rodapé | Dados parciais ou ausentes; protótipo usa mock | Baixa | Diferido — na 006 só dados reais |
| G10 | **Múltiplas cenas** no canal de voz (criar, listar, activar, duplicar, apagar, trocar) | Na **007** a UI passa a «uma cena só» + **Editar cena** na activa; multi-cena diferida | Média | **Diferido** — repor depois da 007 |

## Notas

- Feature **006**: fidelidade visual + continuidade após Salvar + enquadramento cover/centrado + **G1/G2/G5** entregues.
- Feature **007**: shell «+» + mínimo texto/voz; voz com **uma cena** editável (sem multi-cena) → multi-cena = **G10**.
- Não colocar UI morta para itens ainda Diferidos.
- G1+G2+G5 formam o pacote “gravar ⇄ E2EE” com custódia (implementado).
- Canais de voz pré-G5: sem migração de chave — Gravar/Religar desabilitados até recriar.
- G3+G4 formam visibilidade/descoberta; G7–G10 permanecem diferidos (G10 = multi-cena).

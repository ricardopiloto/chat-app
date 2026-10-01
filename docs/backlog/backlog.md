# Backlog — funcionalidades futuras (fora do novo design system)

**Contexto**: gerado em 2026-09-30 como parte da preparação do [prompt de design system para o Google Stitch](../design-system/stitch-prompt.md). Este ficheiro reúne tudo o que é **funcionalidade futura, diferida ou não implementada** no frontend actual — portanto, **não deve ser incluído** no prompt de criação do novo design system. O prompt cobre apenas o que já está em produção hoje.

Fontes cruzadas: `README.md`, `docs/product-brief.md`, `docs/backlog-prototype-v2-gaps.md`, `CHANGELOG.md` e inspecção directa de `frontend/src/` (ficheiros de componentes existentes mas não importados/usados = "código morto", tratados como não implementados).

> Nota de higiene: alguns itens abaixo já estavam listados como diferidos em `docs/backlog-prototype-v2-gaps.md` (IDs G1, G3, G7–G10). Esse ficheiro continua a ser a fonte de detalhe técnico para esses; aqui ficam resumidos e unificados com os restantes itens diferidos encontrados no README e no product-brief.

---

## 1. Gravação de cena / Egress (G1)

Botão/diálogo "Gravar cena" com aviso de desligar E2EE, indicador permanente e religar após gravar. A API (`startEgress`/`stopEgress`) existe no cliente, mas **nenhuma UI chama estas funções** — foi suspensa na spec 049 e nunca reposta.

**Porquê ainda não**: decisão consciente de simplificar o palco de voz depois da 049; gravação exige fluxo de custódia de chave + auditoria já parcialmente desenhado.

## 2. Múltiplas cenas por canal de voz (G10)

Criar, listar, duplicar, activar e apagar **várias** cenas nomeadas por canal (em vez de uma única cena editável). O componente `SceneList.tsx` já existe e está funcionalmente pronto, mas não está montado em nenhuma página — só `SceneEditor.tsx` (cena única) está em uso.

**Porquê ainda não**: diferido desde a spec 007, que reduziu o fluxo a "uma cena, editável". É o item mais "pronto a ligar" do backlog — UI já existe, falta integrá-la.

## 3. Co-diretor

Papel de "co-diretor" com permissão para operar a composição de câmeras em conjunto com o dono do canal. Existe um ficheiro `CoDirectorPanel.tsx`, mas não está importado em lado nenhum — não é uma funcionalidade real hoje.

## 4. Templates de cena partilháveis

Guardar/exportar/importar layouts de cena entre canais ou servidores. Não existe qualquer código relacionado.

## 5. Diretório público de servidores (G3)

Listagem pública/opt-in de servidores hospedados numa instância, para descoberta sem convite directo. Sem modelo de dados nem UI.

## 6. Metáfora de posição livre / canvas (G7)

Alternativa ao grid de slots nomeados (Mestre em destaque / Painel / Faixa): posicionamento livre de câmeras num canvas. Descartado no MVP; backlog original marca como "diferido, provável nunca".

## 7. Papéis nos chips dos tiles de câmera (G8)

Mostrar um papel de mesa (ex.: "Mestre") no chip de nome sobre cada câmera, além do handle. Não existe entidade de "papel de mesa" (distinto de papéis/permissões de servidor) no modelo actual.

## 8. Contagens/badges numéricos na lista de canais (G9)

Badges com contagem (ex.: mensagens não lidas por canal) na lista de canais/rodapé. Hoje só existem indicadores binários (ponto de não-lido, ponto de voz activa) — sem números.

## 9. Federação entre instâncias

Comunicação entre instâncias de hospedagem distintas (ao estilo Matrix). Decisão de produto explícita de **não** fazer — isolamento total é intencional — mas mantido aqui para registo, caso a decisão seja revisitada.

## 10. Sistema de plugins / API pública

Superfície de extensão para terceiros (plugins, webhooks, bots). Sem qualquer código ou contrato hoje.

## 11. Importador de estrutura do Discord

Fluxo de importação de servidores/canais/cargos a partir de uma exportação do Discord. Sem qualquer código hoje.

## 12. Painel de estatísticas sociais

Dashboard de métricas de uso/engajamento por servidor. Sem qualquer código hoje.

## 13. Migração de identidade entre instâncias

Mover a identidade criptográfica de um utilizador de uma instância de hospedagem para outra. Sem qualquer código hoje; permanece em aberto no product-brief.

## 14. Empacotamento desktop único (Tauri)

Distribuição como binário único cliente+servidor via Tauri, para Windows/Mac/Linux nativos. Hoje a aplicação é uma SPA web separada do backend Rust/Axum — não há qualquer integração Tauri no repositório.

## 15. Preferências de notificação configuráveis

Ecrã de definições para controlar o comportamento de notificações (menções, respostas, canais com novidades). Hoje o comportamento é automático e global, sem nenhuma tela de configuração.

## 16. Convites permanentes / TTL configurável via UI

O diálogo de convite actual não expõe nenhum controlo de validade — o backend fixa 5 minutos / 10 usos por omissão. Uma eventual opção de "convite permanente" ou TTL customizável ainda não tem UI (nem se sabe se o backend aceita).

---

## Itens a decidir (não são bem "backlog", mas ficam registados para não se perderem)

- **Copy de E2EE ainda menciona "gravação"** (ex.: aviso de custódia de chave: "sem ela não é possível religar a E2EE depois de gravar") apesar de não haver botão de gravar. Quando o item 1 (Gravação/Egress) for reposto, rever esta copy; até lá, o novo design system não deve desenhar um botão de "Gravar" — só o fluxo de ligar/desligar E2EE e religar que já existe.
- **`GridAdmin.tsx`** é um painel administrativo antigo (atribuir conta a slot numerado via `<select>`), substituído pelo `SceneEditor.tsx` actual e não usado em lado nenhum — candidato a remoção de código morto, não a redesenho.

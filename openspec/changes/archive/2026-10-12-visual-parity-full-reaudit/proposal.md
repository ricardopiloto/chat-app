# Proposal

## Why

O utilizador corrigiu o escopo desta change: não se trata só de tokens (raio de borda, espaçamento) — é preciso validar de novo **toda a aplicação** contra `docs/v2`, porque já há derivas em várias categorias, não só uma. Confirmados por leitura directa do código, além dos dois exemplos de raio já diagnosticados:

- **Cor do nome do utilizador** (painel fixo no fundo da sidebar de canais, `frontend/src/shell/UserPanel.tsx:22`, `<strong class="truncate text-body-md">{name()}</strong>`) — sem classe de cor explícita (herda `--on-surface` do body). O utilizador reporta uma cor diferente da proposta; não consegui confirmar qual mockup/estado exacto mostra a cor esperada só por leitura de código — fica para a Tarefa 2 (comparação lado a lado), não assumido aqui sem confirmação visual.
- **Ícone em falta no indicador "No banco"** (modo de composição de câmaras, `frontend/src/voice/CompositionView.tsx:31-32`): `<footer class="call-bench" aria-label={t("call.bench")}><span class="mono-label">{t("call.bench")}</span>`, sem ícone. O mockup (`docs/v2/mesa_palco_de_voz_v_deo_composi_o_de_c_meras/code.html:145-147`) mostra `<span class="material-symbols-outlined text-[16px] text-outline">airline_seat_recline_extra</span>` antes do rótulo "No Banco:" — confirmado como elemento em falta, não como ambiguidade.

Isto confirma que a auditoria anterior (`docs/v2/AUDIT-fidelity.md` §9, "26 telas em escopo, todas Fiel") já não reflecte o estado actual da aplicação — não necessariamente porque a auditoria estava errada em 2026-10-02, mas porque a aplicação continuou a mudar depois disso sem voltar a ser comparada. Esta change reaplica o processo completo (`docs/v2/fidelity-protocol.md`), não um subconjunto por categoria de token.

## What Changes

- Reaplica `docs/v2/fidelity-protocol.md` (captura lado a lado, tabela `Elemento|Mockup|v2|Observação`, classificação Fiel/Parcial/Genérica) a **todas** as telas já mapeadas em `docs/v2/AUDIT-fidelity.md` (as mesmas ~26-31 entradas da auditoria anterior), não só a um subconjunto de alto tráfego visual — tokens (raio, espaçamento, cor, tipografia), ícones presentes/ausentes, e estrutura/hierarquia, tudo dentro do mesmo passo.
- Corrige cada deriva encontrada directamente no código da superfície afectada, usando os tokens/ícones já existentes (nunca um valor `px`/`rem` ad-hoc nem uma dependência nova de ícone fora do já decidido em `frontend-icons-lucide-svg`).
- Os quatro exemplos já conhecidos (pesquisa, alternador de tema, cor do nome de utilizador, ícone "No banco") são o ponto de partida obrigatório — não o limite do que se procura.
- Regista o resultado em `docs/v2/fidelity/visual-parity-full-reaudit/`, mesmo formato de `docs/v2/AUDIT-fidelity.md` §9, substituindo-a como o registo de fidelidade mais recente (a anterior fica como histórico, não é apagada).

## Capabilities

(sem deltas de capability — `skip_specs: true`. O requisito "Fidelidade visual aos mockups como critério de aceite" em `openspec/specs/frontend-v2/visual-fidelity/spec.md` já existe e já cobre este caso; esta change aplica-o de novo, não o altera.)

## Impact

- **Frontend**: qualquer ficheiro de qualquer superfície com deriva encontrada — não limitado a uma lista fechada à partida (ver Non-Goals em `design.md` para o que fica fora mesmo assim).
- **Sem impacto**: backend, API, qualquer requisito funcional.

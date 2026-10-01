# Protocolo de comparação de fidelidade visual

Aplica a capability `visual-fidelity`: uma tela só fecha quando comparada lado a lado com o `screen.png` do mockup e classificada **Fiel**. Este documento define como comparar e como registar. Escala e critérios em `docs/v2/AUDIT-fidelity.md` §2.

## 1. Preparar a comparação

1. **Estado**: reproduzir na v2 o mesmo estado que o mockup mostra (mesmo servidor/canal/ocupantes/diálogo aberto, mesmos dados de exemplo equivalentes). Estados do mockup que exigem muitos dados usam as rotas de teste da app (`/__foundation`) ou dados semeados num backend descartável.
2. **Tema**: escuro (o único que os mockups desenham). Modo claro e mobile são verificados à parte (`frontend-v2-polish-cutover`) sem perder elementos obrigatórios.
3. **Largura**: a largura do `screen.png` (ver `file docs/v2/<mockup>/screen.png`); janela do navegador com essa largura e zoom 100%.
4. **Idioma**: pt-BR (os mockups estão em português).
5. **Referência**: abrir o `screen.png` do mockup e a captura da v2 lado a lado. Quando a página do mockup (`code.html`) ajuda a medir espaçamentos ou cores, consultar o HTML apenas como medida visual, nunca copiando markup para a v2.

## 2. Capturar

- Captura da v2 com a mesma janela. Guardar em `docs/v2/fidelity/<change>/<tela>.png` (comitada com a verificação).
- Uma captura por estado exigido pela checklist (ex.: login e registo; desbloqueio nos três estados).
- Num backend descartável: `DATABASE_URL=sqlite://…` com `MESA_RATE_LIMIT_DISABLED=1`, e contas de teste geradas para a ocasião (credenciais fora do repositório).

## 3. Preencher a tabela

Uma tabela por tela em `verification.md` do change:

| Elemento (da checklist do `design.md`) | Mockup | v2 | Observação |
|---|---|---|---|
| Painel esquerdo com marca e proposta de valor | presente | presente | |
| Prefixo `@` no handle | presente | ausente | falta o ícone |

- **Elemento**: cada item da checklist de elementos obrigatórios do `design.md` do change. Não se acrescentam elementos que não estejam na checklist.
- **Mockup / v2**: `presente`, `ausente` ou `parcial`.
- **Observação**: o que difere (posição, hierarquia, estado, proporção, cor de token).
- **Elementos excluídos** (AUDIT §6 e lista de exclusões do change): confirmar a ausência numa linha final "Excluídos ausentes: sim/não". Não contam como falta.

## 4. Classificar

| Classificação | Critério |
|---|---|
| **Fiel** | Todos os elementos obrigatórios `presente`; hierarquia, agrupamento e posição iguais ao mockup; cores e tipografia vêm dos tokens; nenhum elemento excluído presente. |
| **Parcial** | Estrutura principal presente, mas falta pelo menos um elemento obrigatório ou há divergência de hierarquia. |
| **Genérica** | Cumpre a função com componentes básicos; faltam camadas visuais (cartões, chips, cabeçalhos) do mockup. |

Só **Fiel** fecha a tarefa. Parcial e Genérica obrigam a corrigir e repetir.

## 5. Registo final

No fim do `verification.md` do change, tabela-resumo:

| Tela | Mockup | Captura | Classificação | Data |
|---|---|---|---|---|

O `frontend-v2-polish-cutover` reavalia todas as telas com este protocolo antes do corte.

## 6. Independência

A comparação visual não autoriza copiar código de `frontend/` nem markup dos `code.html`. `npm run check:v1-overlap` corre no fecho de cada fase.

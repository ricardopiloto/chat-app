# Review — Arquiteto de Soluções

**Change:** parley-public-home-and-login
**Data:** 2026-11-04 (segunda validação, sobre os artefatos já ajustados após a primeira)
**Veredito geral:** Aprovado com ressalvas

Contexto relido do disco: `proposal.md`, `design.md` (D1–D12), `tasks.md`, as 5 specs em `specs/frontend-v2/`, `frontend/src/index.tsx` (`Gate`), `frontend/src/pages/Auth.tsx` (consulta `instance.status()` no `onMount`), `frontend/electron/main.ts` (`openOutside`, `setWindowOpenHandler`, `will-navigate`), `backend/src/rate_limit.rs` (`INSTANCE_STATUS_LIMIT = 60`), `frontend/package.json` (scripts `verify:*`), `docs/deploy-producao.md`.

## Itens da primeira revisão: situação

| Item anterior | Situação |
|---|---|
| Cenário `/invite/<código>` errado | Corrigido: spec e tarefa 1.3 agora dizem que abre `Invite`; `/?invite=` abre `Auth`. |
| D3 bloqueava a página no pedido de estado | Corrigido: página imediata, consulta em segundo plano, 429/falha/tempo limite = instância configurada. |
| Desktop ignora `pathname` | Corrigido: D1, spec e tarefa 1.2/1.3 citam `/index.html`. |
| `lazy`/`Suspense` e `noindex` | Corrigido: D12, tarefas 4.2 e 5.3, requisito na spec da página. |
| Diagrama/tabela de decisão da ordem das regras | Parcial: a tabela de casos existe na tarefa 1.3, mas o `design.md` ainda não traz a tabela de precedência (ver §4). |
| Registrar que `entry-control` sai se a base ganhar escala de altura | Não registrado (ver §3). |

## 1. Definição da arquitetura técnica
Veredito: OK

- Só frontend, mesma stack (SolidJS, router já usado, tokens existentes), sem dependência nova. Coerente com `docs/arquitetura-tecnica.md`.
- D1 (função pura `entryScreen`, sem imports de SolidJS/`api/instance`) e D4 (sinal `nativeEntry` em módulo separado) dão fronteiras claras e testáveis com `node --experimental-strip-types`, como os demais `verify:*`.
- Carga: página estática, sem estado novo; a única chamada nova por visitante é o `instance.status()` já existente, agora disparado a partir de `/`.

## 2. Integração com a infraestrutura existente
Veredito: Atenção

- **Limite compartilhado do `instance/status` (residual).** D3 mitiga bem (página imediata, 429 = configurada, resultado reaproveitado por `Auth`). O que sobra: atrás do Nginx sem `TRUSTED_PROXY=true`, os 60 pedidos/min contam a instância inteira, e agora todo visitante de `/` consome uma unidade. O pior caso é um administrador de instância *nova* receber 429 e ver a página pública em vez do cadastro inicial; a «Entrar» → login → `Auth` repete a consulta, então ele ainda chega ao cadastro se o limite já tiver aliviado. Aceitável, mas vale uma linha em `design.md`/riscos dizendo que a recomendação operacional continua sendo `TRUSTED_PROXY=true` (já documentada em `deploy-producao.md`) e que a página não deve repetir a consulta (um pedido por visita, que a tarefa 3.4 já exige).
- **Compartilhamento do resultado.** D3 pede que o mecanismo não reaproveite resultado desconhecido ou expirado, mas não diz onde ele vive (módulo de `api/instance`? sinal no `Gate`?). Hoje a consulta está dentro de `Auth.tsx` (`onMount`, `cancelled`), então o compartilhamento exige mover o pedido para fora de `Auth`. Recomendo fixar o dono do resultado na tarefa 4.2 (um módulo pequeno com a promessa em andamento e o resultado, válido só na mesma visita). Sem isso, o risco é cada tela refazer a chamada.
- `/login` não exige infraestrutura nova: o Nginx documentado serve `try_files $uri /index.html` (D12 registra). Sem portas, contêineres, banco ou backup afetados.
- Electron: reaproveita `openOutside`, `setWindowOpenHandler` e `will-navigate` existentes; sem mudança de preload nem de janela. O tratamento de `mesa://app/index.html` está coberto em D1.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção

- **Segurança:** página pública sem pedido autenticado e sem dado da instância; link externo com `rel="noopener noreferrer"`; token de e-mail excluído da página pública e consumido só em `Auth`. Sem regressão do que `auth` já garante.
- **`noindex` por meta inserida em JS:** funciona para buscadores que executam JavaScript; rastreadores que não executam veem o `index.html` sem a diretiva. Como o objetivo é só evitar indexação acidental de instâncias privadas, é aceitável; registrar em D12 que a garantia é "melhor esforço" e que quem precisar de garantia forte usa `X-Robots-Tag` no Nginx (fora do escopo).
- **`entry-control` como segunda fonte de altura** (`entry.css` 3 rem vs. `py-2` do `ui.css` e `py-3` do `AuthField`): solução local aceitável diante da proibição de tocar a base. Ainda falta a nota de remoção: se `components/ui` ganhar uma escala de altura, `entry.css` deve ser eliminado. A medição de 1 px em `measure-controls.mjs` cobre a divergência hoje, mas só quando alguém a executa; a tarefa 4.5/7.2 a coloca no fechamento, o que basta.
- **Sinal `nativeEntry`:** reinicia em recarga, logout e troca de instância (D4, spec). Escolha simples e coerente com a ausência de rotas no desktop. A alternativa de rotas por hash foi descartada com justificativa.
- **Ordem de implementação com `rebrand-parley`:** tarefas 2.1 e 3.1 dependem de integrar o rebrand antes; D-riscos cobre o conflito. Falta dizer o que acontece se `rebrand-parley` não estiver integrada quando 1.x terminar (grupos 1 e 4–5 não dependem dela; só 2.1/3.1 esperam). Uma frase em `tasks.md` bastaria.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção

- `design.md` segue o padrão do projeto (contexto, premissas, decisões numeradas com alternativas descartadas, riscos, migração, perguntas abertas). Qualidade boa; as premissas estão explícitas e revisáveis.
- **Falta a tabela de precedência da escolha de tela** no `design.md`. A ordem das regras (foundation → desktop sem instância → loading → invite → recover → auth → pop-out → unlock → app, com a página pública pesando só em `/` da web) hoje está espalhada entre D1, D2, D3 e a spec. Para uma função cuja ordem *é* o requisito, uma tabela única ordenada em D1 evita divergência entre spec, função e `verify:entry-screens`. Recomendado, não bloqueante.
- **Diferença entre `Gate` atual e a função proposta:** hoje o pop-out só vale com sessão `locked/ready`, e `/invite/*` vale em `anonymous` e `ready`; D1 diz que preserva isso. Confirmar na tabela de casos de 1.3 que os dois já estão cobertos (estão listados: pop-out, convite, sessão existente).
- A afirmação do `proposal.md` "Sem impacto em backend, contratos" é verdadeira: nada novo é chamado além de `instance.status()`, `registrationConfig()`, `verifyEmail()` e `GET /health`, todos existentes.

## 5. Ponte entre produto e técnico
Veredito: OK

- Os pedidos de produto (duas páginas, login alinhado, controles coesos, cadastro e login intactos, sistema de design intocado) viram requisitos testáveis nas 5 specs e tarefas com verificação objetiva (diff dos arquivos protegidos, medição de ±1 px, `verify:entry-screens`).
- Desvios dos protótipos (pílula × 9 px, creme × tokens, `<select>` × alternadores, barra própria × decoração nativa, handle × e-mail, recuperação visível × «Não consigo desbloquear») estão decididos e justificados, com relatório de fidelidade na tarefa 7.1.
- A conferência das afirmações de privacidade contra `docs/e2ee-gaps.md` (2.2) fecha o risco de prometer mais do que o produto entrega.

## Bloqueantes antes de implementar
Nenhum.

## Ajustes recomendados (não bloqueantes)
1. Definir em `design.md` D3/tarefa 4.2 quem guarda o resultado compartilhado de `instance.status()` (módulo/promessa por visita) e que ele sai de `Auth.tsx`.
2. Acrescentar a tabela de precedência ordenada em D1.
3. Registrar que `noindex` por meta é melhor esforço, e a nota de remoção de `entry-control`.
4. Dizer em `tasks.md` que os grupos 1, 4, 5 e 6 podem andar antes do rebrand, enquanto 2.1 e 3.1 esperam.

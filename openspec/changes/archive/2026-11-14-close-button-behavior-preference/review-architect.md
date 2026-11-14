# Review — Arquiteto de Soluções

**Change:** close-button-behavior-preference
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Stack coerente: Electron `dialog`/`BrowserWindow`/IPC já em uso, sem dependência nova.
- Boa decisão de nomenclatura (não assinalada como decisão explícita, mas vale registar como positiva): `mesa-app-settings.json` é um nome genérico, não `close-behavior.json` — abre espaço natural para futuras preferências só-de-app sem reabrir a decisão de onde elas vivem, sem construir antecipadamente nenhuma abstração de "sistema de configurações" que a change não precisa agora. Proporcional.
- Escalabilidade: N/A correctamente, é estado local por instalação.

## 2. Integração com a infraestrutura existente

Veredito: N/A

- Nenhuma infraestrutura/backend tocada; confirmado pelo próprio `Impact` do `proposal.md`.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança: ficheiro local sem dado sensível (um enum), padrão de escrita validada igual ao já usado em `readInstance`/`writeInstance`.
- Verifiquei a sequência de arranque entre esta change e a change paralela `fix-stale-background-call-blocks-rejoin`: o lock de instância única desta última precisa de correr **antes** de `app.whenReady()`; o carregamento de `mesa-app-settings.json` desta change precisa de correr **dentro** de `whenReady()`, antes de `attachMainWindowLifecycle`. São pontos diferentes da sequência de arranque — não há condição de corrida entre as duas, mesmo editando o mesmo ficheiro.
- Manutenibilidade: o D1 (ficheiro de configurações separado, não misturado em `mesa-instance.json`) já evita o problema real de `clear-instance` apagar uma preferência não relacionada — bem fundamentado.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- D1-D3 seguem o padrão de alternativa-rejeitada com motivo técnico concreto (ex.: `clear-instance` apagaria o campo se estivesse em `mesa-instance.json`; um modal SolidJS precisaria de um round-trip main→renderer que pode falhar durante um `close` do SO). Boa fundamentação, ao nível das melhores desta leva.
- **Achado:** o D2 diz "Prevent the close event while undetermined; show `dialog.showMessageBox`..." sem registar explicitamente a garantia de ordenação que torna este mecanismo correcto: `event.preventDefault()` tem de ser chamado de forma síncrona, incondicionalmente, assim que o handler `close` dispara enquanto o estado está indeterminado — antes de o diálogo (que é assíncrono) resolver. Sem essa garantia escrita, um implementador poderia tentar decidir "prevenir ou não" só depois de ver a resposta do diálogo, o que é impossível dado que o evento `close` do Electron é síncrono. Esta não é uma decisão de arquitectura nova a tomar, é a única frase que falta para que D2 seja auto-suficiente como ADR — recomendo adicioná-la explicitamente, já que é precisamente o detalhe que decide se a funcionalidade funciona ou não.
- Sem diagrama — aceitável; a máquina de estados (indeterminado → diálogo → hide/quit; determinado → aplica direto) é simples o suficiente para prosa.

## 5. Ponte entre produto e técnico

Veredito: OK

- O contrato pedido pelo usuário ("pergunta uma única vez, depois só muda por configurações") está traduzido com fidelidade total nos cenários do spec delta ("Once a choice is saved, the first-close prompt SHALL NOT reappear; subsequent changes SHALL be made through Settings") — sem perda nem adição de comportamento não pedido.

## Bloqueantes antes de implementar

- nenhum

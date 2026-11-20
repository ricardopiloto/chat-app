# Review — Arquiteto de Soluções

**Change:** fix-account-settings-call-controls-overlap
**Data:** 2026-11-20
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A change não introduz stack, componente ou canal de dados novo — é um gate reativo (`<Show when={props.showCallControls}>`) sobre um componente SolidJS já existente (`CallControls`), controlado por uma nova prop booleana derivada de `shell.route().page !== "account"` (`frontend/src/shell/AppShell.tsx:66`). Coerente com o padrão reativo já usado no resto do `AppShell` (ex.: o `<Show>` que já esconde `Sidebar`/`SettingsSidebar` na mesma rota, `AppShell.tsx:60-64`).
- Responsabilidades permanecem claras: `AppShell` decide *quando* esconder (política de layout), `UserPanel` decide *o quê* esconder (apresentação). Não haveria necessidade de mexer em `CallControls` ou em `FloatingPlayer` para este escopo.
- Não há requisito de carga/escala aqui (é puramente um ajuste de apresentação condicional); N/A para throughput/concorrência.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Não toca backend, banco, protocolo de voz (LiveKit) nem build/deploy. Confirmei que o mecanismo de reserva de espaço (`--user-card-height`, setado via `ResizeObserver` em `AppShell.tsx:27` e consumido em `frontend/src/voice.css:11` por `.server-rail`) já é dinâmico desde a change anterior (`fix-sidebar-header-alignment-and-user-card`), então remover `CallControls` do fluxo encolhe a altura medida e o padding do rail acompanha automaticamente — nenhuma infraestrutura de layout nova precisou ser criada para isto funcionar corretamente.
- N/A para estratégia de dados — não há banco envolvido.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- Segurança: N/A, sem mudança de autenticação/criptografia/ACL.
- Performance: nenhum gargalo previsível; é um `<Show>` a mais em uma árvore já pequena.
- Manutenibilidade: a solução escolhida (ocultar os controles embutidos e confiar inteiramente no `FloatingPlayer` enquanto fora do canal da chamada) é a mais simples das alternativas razoáveis, e evita duplicar lógica de controle de chamada em dois lugares — bom trade-off. Porém o próprio `proposal.md:21` já identifica uma lacuna conhecida e não resolvida: o `FloatingPlayer` lembra o canto `bl` (`mesa.pip.corner` em sessionStorage) e, se o usuário o arrastou para lá anteriormente, ele **ainda pode cobrir o rail/user-card** mesmo depois desta correção — ou seja, o cenário de sobreposição visual original pode se repetir por uma via diferente (PiP sobre o rail, em vez de `CallControls` espremido no rail). Isso é descrito como "follow-up separado" no proposal, o que é aceitável para este escopo, mas deveria também constar explicitamente no `tasks.md` ou em um item de backlog referenciado, não apenas em uma frase de impacto — hoje fica fácil de esquecer.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- Este change **não tem `design.md`**, mas todos os outros changes do projeto que inspecionei (incluindo dois de escopo comparável: `fix-sidebar-header-alignment-and-user-card` e `close-button-behavior-preference`) incluem um. Há pelo menos duas decisões reais aqui que mereciam registro formal de alternativas rejeitadas:
  1. Por que suprimir totalmente os controles embutidos (em vez de, por exemplo, colapsá-los para um layout vertical/compacto que coubesse na largura do rail)?
  2. Por que classificar isso como capability `frontend-v2/app-shell` e não `frontend-v2/voice-session` (que já é dono de boa parte do comportamento de `CallControls`/`FloatingPlayer` na change `fix-call-controls-regressions-and-cleanup`)?
- Recomendo adicionar um `design.md` curto cobrindo essas duas decisões antes de arquivar a change, para manter a consistência do histórico de ADRs do projeto. Não é bloqueante para o código em si (a implementação está correta), mas é uma lacuna de processo real.
- Não há fluxo de dados novo nem complexidade que justifique diagrama.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why"/"What Changes" do `proposal.md` descreve corretamente o sintoma (controles espremidos no rail + duplicação com o floating player) e a solução traduz isso de forma direta e verificável nos cenários do spec delta (`specs/frontend-v2/app-shell/spec.md`). Os três cenários (chamada ativa em `/account`, retorno à sidebar completa, sem chamada ativa) cobrem o essencial do comportamento esperado sem prometer nada vago.

## Bloqueantes antes de implementar

- nenhum (implementação já concluída e correta); ressalvas acima são de documentação/processo e de um risco residual já conhecido pelo próprio autor da change, não de correção funcional.

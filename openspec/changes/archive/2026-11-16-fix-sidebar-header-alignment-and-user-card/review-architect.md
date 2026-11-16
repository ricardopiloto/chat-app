# Review — Arquiteto de Soluções

**Change:** fix-sidebar-header-alignment-and-user-card
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Continua uma mudança puramente de apresentação/layout (CSS + `ResizeObserver`, ambas APIs nativas do browser), sem dependência nova, coerente com a stack (SolidJS + Tailwind). Responsabilidades claras na D3 revista: `AppShell.tsx` passa a possuir a composição (rail + sidebar + card), `ServerRail.tsx`/`Sidebar.tsx` continuam donos das suas próprias áreas roláveis, o componente do card continua dono só da sua superfície.
- Escalabilidade: N/A, sem carga de servidor nem fan-out.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Reaproveita o wrapper já existente em `AppShell.tsx:50-61` que já agrupa `ServerRail`+`Sidebar`/`SettingsSidebar` (incluindo o comportamento de drawer móvel `mobile:fixed mobile:bottom-0 mobile:left-0 mobile:top-14`) em vez de criar uma estrutura nova — boa reutilização.
- O padrão de `ResizeObserver` não é novo neste código: `design.md` cita correctamente `ChannelPage.tsx:275-280` e `GridView.tsx:29-42` como precedentes já existentes para observar-e-desconectar; confirmei que ambos existem. Não introduz um padrão de observação diferente do que a equipa já usa.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- Segurança: N/A.
- Performance: verifiquei um risco que a `design.md` não cobre e que não é o mesmo já identificado (o "frame de atraso" ao iniciar/terminar uma chamada). O menu de blur da câmara em `CallControls.tsx` usa `.call-menu{position:absolute;...}` — confirmei que isto está correcto e **não** afecta a altura do cartão medida pelo `ResizeObserver` (um descendente `position:absolute` não contribui para a altura do fluxo normal do seu ancestral). Isto é positivo: a preocupação óbvia de "o menu de blur vai disparar o observer a cada abertura" está resolvida pela própria estrutura actual, não precisa de tratamento extra.
- Risco real não coberto: a **primeira montagem**. Antes do primeiro callback do `ResizeObserver` disparar (que ocorre de forma assíncrona depois do layout), `--user-card-height` não tem valor medido ainda. Se a app não semear um valor inicial razoável, há uma janela — ainda que curta — em que as listas não reservam espaço nenhum e o último servidor/canal pode aparecer atrás do cartão no primeiro render, antes de o observer corrigir. `design.md`'s secção de riscos só cobre a transição idle→chamada, não o mount inicial. Recomendação concreta: semear `--user-card-height` com um valor CSS por omissão (a altura conhecida do estado idle, algo como 56-64px) antes do primeiro `ResizeObserver` entry chegar, em vez de partir de zero/indefinido.
- Manutenibilidade: a decisão de mover o cartão para `AppShell.tsx` em vez de o manter dentro de `Sidebar.tsx` é a escolha certa dado que agora atravessa duas colunas que só `AppShell.tsx` conhece simultaneamente — não cria uma dependência circular nem obriga `Sidebar.tsx`/`ServerRail.tsx` a conhecerem um ao outro.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D3 mantém o padrão de "Alternative rejected" com motivo (manter o cartão só na coluna da Sidebar, rejeitado porque o dono do produto quer uma superfície que pertença a toda a navegação). D1/D2 ficam correctamente intocados.
- A secção de riscos já regista o risco de sincronização do `ResizeObserver` na transição de estado — a única lacuna é a do mount inicial, apontada acima; não é motivo para bloquear, é um ajuste pontual antes ou durante a implementação.
- Sem diagrama — aceitável, a topologia (um wrapper, três filhos, um observer) é simples o suficiente para prosa.

## 5. Ponte entre produto e técnico

Veredito: OK

- Traduz fielmente o briefing do dono do produto (referência ao Discord, cartão unificado) para a arquitectura real do projecto, sem inventar tokens novos e respeitando a confirmação já obtida de que o estado idle mantém só o botão de definições.

## Bloqueantes antes de implementar

- nenhum

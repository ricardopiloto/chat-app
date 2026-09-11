# PRD — Renovação Visual "Mesa à Vela"

**Baseado em:** o protótipo `mesa-ui-prototype.html` (âmbar/jade, Fraunces+Manrope, modo claro/escuro).
**Este PRD não repete o protótipo — di-lo em termos do sistema de tokens real do repositório**, porque o protótipo foi CSS solto, escrito do zero, e o Mesa já tem um sistema de design (`Nocturne`) com convenções próprias que este trabalho tem de respeitar, não substituir.

---

## 0. Descoberta importante antes de implementar

`frontend/src/styles/nocturne.css` **não é um ficheiro de estilos qualquer** — é um design system documentado, com rampas tonais derivadas em OKLCH, `color-mix()` em vez de `rgba()` hardcoded, fontes self-hosted via `@font-face`, e comentários de histórico de decisão (ex.: *"review round 7 (Barron): the accent moves to the product's blurple..."*). Isto muda a forma como esta feature deve ser implementada:

- **Não portar o CSS do protótipo tal e qual.** O protótipo foi escrito num vácuo, sem conhecer `nocturne.css`. Os valores de cor daqui são o *seed* a recalcular dentro do sistema de rampas existente — não um `find-and-replace`.
- **`mesa-theme.css` é a camada de skin em cima do Nocturne** (`.app { --panel: ...; --tile: ...; }`), não o sistema base. A troca de identidade visual acontece nas duas camadas: tokens genéricos do Nocturne (`--color-accent`, a rampa `--color-accent-*`) e os tokens específicos do Mesa (`--panel`, `--tile`, `--stage`, etc.).
- **Fontes têm de ser self-hosted.** O protótipo carrega Fraunces/Manrope via Google Fonts CDN — isso **contradiz uma decisão de segurança já tomada** (`024-security-hardening`: *"Nocturne fonts use system-ui, sans-serif (no Google Fonts CDN)"*, e o `Inter` atual já é servido de `/fonts/*.woff2`). Este PRD exige o mesmo tratamento para as fontes novas.

---

## 1. Objetivo

Substituir a identidade visual atual (blurple/lavanda, tipografia só Inter) pela identidade "Mesa à Vela" (âmbar + jade, Fraunces + Manrope, com modo claro/escuro), **sem alterar a arquitetura de informação** (a sidebar, o rail, o cabeçalho de voz mantêm a estrutura já existente — isto é um reskin, não um redesenho de fluxo). Onde o protótipo já simplificava o cabeçalho de voz (Editar cena + blur para um menu `⋯`), essa simplificação faz parte do escopo, porque estava no protótipo aprovado.

## 2. Fora de escopo

- Qualquer mudança estrutural de componentes (divisão do `Sidebar.tsx`, modularização do `mesa-theme.css` em ficheiros menores) — isso pertence à proposta de refactor de UI anterior e é independente desta.
- Ecrãs de definições, gestão de membros/roles, diálogos de convite — o protótipo não os cobriu; entram numa fase de aplicação de tokens à parte (§8.5), sem redesenho dedicado.
- Alterar a rampa `--color-accent-2` sem antes auditar onde é usada (ver §4.3).

## 3. Fundamentos de design (o "seed" a formalizar)

| Papel | Hex seed (protótipo) | Nota |
|---|---|---|
| Fundo mais profundo (dark) | `#14121A` | Substitui o papel do `--color-bg`/`--stage` atuais |
| Painel (dark) | `#1C1926` | |
| Texto principal (dark) | `#EDE6DC` | Quente, não branco puro — mantém o "pergaminho à luz de vela" |
| Âmbar (acento primário) | `#D98A3D` / forte `#F0A452` | Substitui o blurple `--color-accent` |
| Jade (estado de segurança/E2EE) | `#5CB394` | Papel semântico novo — ver §4.3 |
| Fundo mais claro (light) | `#F8F2E6` | Pergaminho claro, não branco puro |
| Texto principal (light) | `#241C14` | |
| Âmbar (light) | `#B9661F` / forte `#A8570F` | Aprofundado para manter contraste AA em fundo claro |
| Jade (light) | `#2C8A69` | |
| Cinco tons de assento (câmara) | ember/plum/slate/wine/umber — ver protótipo | Só usados nos tiles de câmara; não entram na rampa semântica geral |

**Tipografia:** Fraunces (display — nomes de canais de voz, título da marca, títulos de secção) + Manrope (UI — tudo o resto). Pesos necessários com base no uso do protótipo: Fraunces 400/500/600; Manrope 400/500/600/700/800.

**Efeito único:** anel âmbar pulsante em quem está a falar (substitui a aura atual — reaproveita o mecanismo de `033-voice-speaking-indicator`/`036-mic-ctrl-speaking-aura`, só troca a cor e a curva de animação).

## 4. Mapeamento para o sistema de tokens real

### 4.1 `nocturne.css` — tokens genéricos

| Token atual | Ação |
|---|---|
| `--color-accent` (`#9184d9`) e rampa `--color-accent-100..900` | Recalcular a rampa em OKLCH com o mesmo método já documentado no ficheiro (mesma lightness scale, hue do âmbar `#D98A3D` como seed em vez do blurple). **Não inventar os 9 degraus à mão** — gerar com a mesma ferramenta/processo que produziu a rampa atual (o comentário do "round 7" sugere que isto já foi feito uma vez; repetir o processo, não os números). |
| `--color-bg`, `--color-surface`, `--color-text`, `--color-divider` | Recalcular para os tons de tinta/pergaminho do §3, mantendo o padrão `color-mix()` já usado para variantes com transparência. |
| `@font-face "Inter"` (bloco existente) | Manter — Inter não sai do sistema, só deixa de ser a única família. |
| Novo: `@font-face "Fraunces"` / `@font-face "Manrope"` | Adicionar seguindo exatamente o padrão do bloco do Inter (`woff2`, `font-display: swap`, pesos listados acima), servidos de `/fonts/`. Ambas são OFL (licença livre para self-host). |
| `--font-heading` | Passa a `"Fraunces", ...` nos contextos "de lugar" (ver §5); `--font-body` passa a `"Manrope", ...`. **Atenção**: `--font-heading` hoje é usado por `h1`–`h6` genericamente — trocar aqui afeta título de diálogos, `.dialog-title`, `.card-title`, etc. Confirmar se isso é desejado globalmente ou só nos títulos "de lugar" (ver §5, pode precisar de uma variável nova `--font-place` em vez de reaproveitar `--font-heading`). |
| `--radius-sm/md/lg` (8/14/22px) | Manter. O protótipo usa 16px para cartões (mapeia para `--radius-md` 14px, diferença pequena, harmonizar para 14px em vez de introduzir um valor novo) e 20px para os *seats* de câmara — esse é um valor genuinamente novo; propor `--radius-token: 20px` como adição ao sistema, não substituição, e sinalizar em revisão de design (é uma nova categoria — "moldura de token de personagem" — não um card genérico). |

### 4.2 `mesa-theme.css` — skin específico do Mesa

Dentro do bloco `.app { ... }` (dark) e `.app[data-theme="light"] { ... }` (light), recalcular: `--panel`, `--elev`, `--muted`, `--stage`, `--tile`, `--tile-line`, `--hover`, `--press`, `--chip`, `--on-stage`, `--input-bg`, `--sel-bg`, `--sel-fg`, `--sel-muted` para a paleta do §3. `--color-danger*` fica **inalterado** (não faz parte desta identidade, continua vermelho de alerta).

**Os tiles de câmara (`--tile`, `--stage`) não mudam de tom entre claro/escuro** — isto já é o comportamento atual (confirmado no bloco `.app[data-theme="light"]` existente, onde `--stage`/`--tile` continuam escuros) e o protótipo respeita a mesma regra.

### 4.3 Token novo: papel semântico "segurança" (jade)

O Nocturne já tem `--color-accent-2` (`#a7a1db`, uma segunda lavanda). Antes de implementar, auditar (`grep -rn "color-accent-2"` no `frontend/src`) se este token já está em uso visível em produção:

- **Se não estiver em uso relevante** → repropor `--color-accent-2` (e a sua rampa) para o jade; é o encaixe mais limpo, reaproveita infraestrutura existente.
- **Se já estiver em uso** (e mudar quebraria outra coisa) → introduzir `--color-security` como token novo, com a sua própria rampa curta (só os degraus realmente usados pelo chip E2EE: base, wash, texto), em vez de reaproveitar.

Esta decisão fica para o início da implementação, não deve ser assumida às cegas.

## 5. Tipografia "de lugar" vs "de utilidade" — decisão de implementação

O protótipo usa Fraunces especificamente em: nome do canal de voz no cabeçalho (`A Taverna do Corvo`), nome do servidor na sidebar, marca "Mesa" no ecrã de entrada. **Não** em nomes de canais de texto (`#geral` fica em Manrope). Isto é uma distinção de **papel** (lugar vs. utilidade), não de nível de heading — pelo que a implementação correta é uma classe/token novo (ex. `--font-place`) aplicado pontualmente nesses três contextos, e não uma troca global de `--font-heading`, que arrastaria títulos de diálogo, definições e cartões para Fraunces sem essa intenção.

## 6. Componentes a alterar — por ficheiro real

| Ficheiro | Mudança |
|---|---|
| `styles/nocturne.css` | Rampas + `@font-face` novos (§4.1) |
| `styles/mesa-theme.css` | Tokens do `.app`/`.app[data-theme=light]` (§4.2); estilo de `.server-rail-btn` (indicador ativo, `has-voice`/`has-unread`), `.chan-row`, secções da sidebar (rótulo com ícone em vez de caixa alta — ver nota abaixo), roster aninhado, `.sidebar-user` |
| `shell/ServerRail.tsx` | Sem mudança estrutural — só classes/CSS |
| `shell/Sidebar.tsx` | Rótulos de secção («Texto» / «Voz e vídeo») deixam de estar em caixa alta rastreada — passam a peso 700 + ícone, conforme protótipo. É uma mudança de *classe CSS*, não de marcação — confirmar que os rótulos já não vêm de CSS `text-transform: uppercase` genérico partilhado com outro componente antes de o remover globalmente. |
| `pages/VoiceChannel.tsx` | Cabeçalho: mover **Editar cena** e o select de blur para um botão `⋯` (menu de overflow) — este é o único ponto onde este PRD toca em marcação/comportamento, não só estilo, porque estava assim no protótipo aprovado. Chip E2EE, segmented Composição/Grade e ícone de Membros continuam sempre visíveis. |
| `components/CameraGrid.tsx` / CSS de assento | Gradiente por assento (5 tons), nameplate com gradiente inferior, anel de "a falar" reaproveitando o estado já calculado por `033`/`036` — só a camada visual muda. |
| `components/MembersPanel.tsx` | Restilo de tokens, sem mudança de estrutura. |
| `pages/Channel.tsx` (mensagens + composer) | Restilo: avatar token, separador de dia, composer em pílula com botão de enviar circular. |
| `pages/Auth.tsx` | Já segue o layout de duas colunas (`027-auth-login-screen`) — este PRD só troca tokens/tipografia, mantém a estrutura. |
| `components/Dialog.tsx`, `.btn`/`.input`/`.tag`/`.card` (Nocturne) | Herdam a nova paleta automaticamente por usarem os tokens — validar visualmente, não deve exigir código novo. |

## 7. Modo claro/escuro

Mecanismo: continuar a usar exatamente o padrão já existente (`.app[data-theme="light"]`, alternado pelo botão já implementado no `TopBar.tsx`/tema atual) — **não introduzir um mecanismo novo**. O trabalho aqui é só recalcular os valores dentro desse padrão já existente para a paleta do §3. Nenhuma mudança de código de alternância é necessária, só de tokens.

## 8. Qualidade mínima (não estava garantido no protótipo)

O protótipo foi feito para inspiração, não para produção — estes pontos **não foram tratados nele** e têm de ser resolvidos na implementação:

1. **`prefers-reduced-motion`**: o pulso âmbar de "a falar" precisa de uma variante estática (mudança de cor da borda em vez de animação) sob essa media query — o protótipo não tem isto.
2. **Contraste AA**: os hexadecimais do §3 foram escolhidos visualmente, não verificados com uma ferramenta de contraste. Validar sobretudo: texto `--parchment-dim`/`--parchment-faint` sobre fundo, e âmbar/jade como texto pequeno (ícones) sobre fundo claro.
3. **Foco de teclado**: o Nocturne já define `:focus-visible` com `--color-accent` — isto herda a cor nova automaticamente, mas confirmar visualmente que o anel de foco continua legível sobre âmbar em botões que já são âmbar (`.btn-primary`).
4. **Ecrãs não cobertos pelo protótipo** (definições, gestão de membros/roles, diálogos de convite, toasts): não têm mockup dedicado — devem herdar corretamente só por usarem os tokens do Nocturne (§6, última linha). Reservar uma ronda de QA visual dedicada a estes ecrãs antes de considerar a feature completa.

## 9. Critérios de aceitação

1. Alternar claro/escuro em qualquer ecrã produz a paleta do §3 (não a antiga blurple/cinza), sem flash da paleta antiga.
2. Nome de canal de voz, nome de servidor e a marca no ecrã de entrada usam Fraunces; nada mais usa Fraunces por acidente (títulos de diálogo, definições continuam em Manrope/Inter conforme decisão do §5).
3. O cabeçalho do canal de voz mostra, por omissão, só: título/ocupação, segmented Composição/Grade, ícone Membros, `⋯`, chip E2EE — Editar cena e o select de blur só aparecem dentro do `⋯`.
4. O participante a falar mostra o anel âmbar; com `prefers-reduced-motion: reduce` ativo, mostra o mesmo estado sem animação.
5. Todos os textos de UI cumprem contraste AA (4.5:1 para texto normal, 3:1 para texto grande/ícones) nos dois temas.
6. Ecrãs de definições, membros e diálogos continuam legíveis e consistentes (mesmo sem redesenho dedicado) por herdarem os tokens do Nocturne.

## 10. Riscos

- **Superfície grande de regressão visual**: a troca de `--color-accent` no Nocturne propaga para todos os componentes de `.btn-primary`, `.tag-accent`, `.radio`, `.seg-opt`, `.input:focus`, etc. — construídos ao longo de ~80 specs. Recomenda-se uma ronda de QA visual tela-a-tela, não só nos ecrãs cobertos pelo protótipo.
- **`--color-accent-2` (§4.3)** é a única decisão deste PRD que depende de uma auditoria ainda não feita — não iniciar essa parte sem antes correr o `grep`.
- **Geração da rampa OKLCH**: se não houver a mesma ferramenta/processo usado no "round 7" disponível, os 9 degraus terão de ser recriados manualmente com cuidado para preservar a lightness scale — risco de inconsistência se feito à pressa.

## 11. Faseamento sugerido

Numeração a partir da próxima disponível (`082` em diante — nota: a proposta de refactor estrutural anterior também reserva esta gama; alinhar a ordem real das duas antes de abrir specs):

1. **Tokens base** — rampas Nocturne (âmbar) + `@font-face` Fraunces/Manrope self-hosted + tokens `mesa-theme.css` (§4.1, §4.2). Sem mudança visível em componente nenhum ainda (é só o alicerce).
2. **Shell** — rail, sidebar, topo (§6, primeiras linhas) + modo claro/escuro recalculado (§7).
3. **Canal de voz** — cabeçalho reagrupado (§6, `VoiceChannel.tsx`), assentos de câmara, anel de "a falar" com `prefers-reduced-motion` (§8.1).
4. **Canal de texto + entrada** — mensagens, composer, ecrã de login.
5. **QA de cobertura** — definições, membros, diálogos, toasts (§8.4) + verificação de contraste (§8.2) em todos os ecrãs, claro e escuro.
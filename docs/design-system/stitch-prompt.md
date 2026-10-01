# Prompt — novo Design System "Mesa" para o Google Stitch

**Como usar:** copie tudo a partir da linha `# MESA — DESIGN SYSTEM DO ZERO` até ao fim do ficheiro e cole no Google Stitch. O texto acima dessa linha é só contexto para ti, não faz parte do prompt.

**Gerado em:** 2026-09-30, a partir de uma auditoria completa do frontend actual (`frontend/src/pages`, `shell`, `components`), do `CHANGELOG.md` (até à versão 0.8.1) e da documentação de produto (`README.md`, `docs/product-brief.md`, `docs/backlog-prototype-v2-gaps.md`). Cobre **exactamente** o que está implementado e em uso hoje — código morto/não referenciado (ex.: `CoDirectorPanel.tsx`, `GridAdmin.tsx`, `SceneList.tsx`) e funcionalidades diferidas foram **excluídos** e movidos para [`docs/backlog/backlog.md`](../backlog/backlog.md).

---

# MESA — DESIGN SYSTEM DO ZERO

## 0. Mandato deste exercício

Vou usar este prompt para desenhar, **do zero**, um novo design system completo para a "Mesa" — uma aplicação já existente e em produção. Regras importantes:

1. **Ignora completamente o visual actual da aplicação.** Não reaproveites paleta, tipografia, nomes de tema ("Nocturne", "Mesa à Vela") nem decisões estéticas anteriores. Propõe uma identidade visual nova, coerente e própria, a partir das directrizes de marca e público abaixo.
2. **Cobre 100% das funcionalidades e ecrãs descritos abaixo.** Esta lista é exaustiva e reflecte tudo o que a aplicação já faz hoje — não é um MVP nem um recorte.
3. **Não acrescentes funcionalidades novas.** Não proponhas ecrãs, fluxos ou controlos que não estejam listados aqui, mesmo que pareçam "óbvios" ou "em falta" — decisões sobre o que vem a seguir já foram tomadas e estão registadas separadamente. Se notares uma lacuna, resolve-a dentro do escopo existente (ex.: um estado vazio, um estado de erro), não inventando um novo recurso.
4. O resultado deve ser um **design system utilizável**: tokens (cor, tipografia, espaçamento, raio, sombra, ícones) + biblioteca de componentes + mockups dos ecrãs/fluxos principais, todos consistentes entre si.

---

## 1. O produto

**Mesa** é uma aplicação de **chat e vídeo self-hosted**, no espírito do Discord (servidores, canais, cargos, convites), mas com duas diferenças centrais:

- **Composição nativa de câmeras**: em canais de voz/vídeo, o dono/admin pode organizar os participantes numa grelha de câmeras fixas por layout nomeado (não é uma grelha automática genérica) — pensado para mesas de RPG que streamam ou gravam sessões e hoje precisam costurar um chat/chamada com um software de produção de vídeo à parte.
- **Criptografia ponta-a-ponta (E2EE) por omissão**, em texto e voz/vídeo. O servidor e o admin da instância não conseguem ler o conteúdo das conversas em condições normais.

É **self-hosted por padrão**: cada instância é isolada (sem federação), pode alojar vários servidores (multi-tenancy), e o utilizador final entra sempre por convite. Não há rede social global nem directório obrigatório.

**Público principal**: mestres e grupos de RPG que streamam/gravam sessões.
**Público secundário**: qualquer grupo pequeno (amigos, comunidades, podcasts) que valorize um "Discord auto-hospedado".

**Tom de marca sugerido** (para orientar a nova identidade visual, não é prescritivo): confiável e privado sem ser frio/corporativo; acolhedor como uma mesa de jogo; competente tecnicamente sem intimidar quem não é técnico. Evita o tom "gamer agressivo" e evita parecer uma ferramenta puramente empresarial/enterprise.

---

## 2. Arquitectura de informação (visão geral do shell)

A aplicação é uma SPA (desktop-first, com um modo estreito/mobile — ver secção 8) organizada em quatro zonas persistentes:

1. **Rail de servidores** (coluna mais à esquerda): um botão por servidor (imagem ou iniciais), estado activo, indicador de não-lido, indicador de "há voz activa", e um botão "+" no fim para criar servidor.
2. **Sidebar** (coluna seguinte): cabeçalho com nome do servidor + botão de definições (engrenagem) + botão de convite; lista de canais dividida em duas secções — **Texto** e **Voz/vídeo** — cada uma com o seu próprio "+"; painel do utilizador fixo no fundo.
3. **Área de conteúdo principal**: o canal de texto ou de voz/vídeo seleccionado, ou um ecrã de definições do servidor, ou um estado vazio/idle.
4. **Painel de membros** (opcional, lateral direito, aberto/fechado por um botão no cabeçalho do canal): lista de membros do servidor.

Sobrepostos a este shell: uma **topbar** fixa no topo (logo, pesquisa, notificações, alternador de tema), uma **PiP flutuante de chamada** (quando há uma chamada activa noutro canal que não o actual) e **diálogos/menus de contexto** modais.

---

## 3. Inventário completo de ecrãs e fluxos

### 3.1 Autenticação e onboarding

**Ecrã de login/registo** — layout de duas colunas: painel de marca à esquerda (logótipo, tagline, aviso de que é self-hosted, versão no rodapé) e painel de formulário à direita.
- Separador Login / Registo (só visível sem sessão activa).
- Campo "handle" (com ícone "@"), campo de password (ícone de cadeado, alternância mostrar/ocultar, mínimo 8 caracteres).
- Botão de submissão primário cujo rótulo muda consoante o modo: "Entrar" / "Registar" / "Desbloquear".
- No modo login, um separador "OU" e um botão secundário "Registar".
- **Fluxo de desbloqueio de conta**: quando existe sessão no servidor mas falta o cofre de identidade local (dispositivo novo) — ecrã pede a password para desbloquear, com acção secundária "Recuperar identidade" e um botão "Trocar de conta" (limpa a sessão).
- Mensagens de erro inline (credenciais inválidas, sessão expirada, cofre em falta).

**Ecrã de convite** — mesmo layout de marca; mostra uma pré-visualização do convite (nome do servidor, indicação de "com/sem histórico") sem exigir sessão; se o visitante não tiver conta, os campos de handle/password de registo aparecem inline antes do botão único "Aceitar". Estados de erro específicos para convite inválido/expirado/já usado.

### 3.2 Servidores

**Criar servidor** (diálogo a partir do "+" do rail): campo de nome + bloco de chave gerada automaticamente, apresentada como código copiável, com uma checkbox obrigatória "Guardei a chave" que desbloqueia o botão Criar. Cria o servidor já com um canal de texto "geral" e um canal de voz por omissão.

**Definições do servidor** (`/servers/:id/settings/*`), substituindo a lista de canais por uma navegação de definições agrupada:
- **Grupo Pessoas → Membros**: campo de pesquisa por handle; lista de membros com avatar, handle, selector de cargo (bloqueado/rótulo "Dono" na linha do dono) e botão "Remover" (oculto para o dono).
- **Grupo Papéis → Cargos**: linha para criar cargo (campo de nome + botão Criar); lista de cartões de cargo com nome, botões de reordenar (↑/↓, desactivados para cargos de sistema), botão "Permissões" e botão "Apagar" (oculto para cargos de sistema).
- **Permissões do cargo** (`/settings/roles/:id/permissions`): interruptores agrupados em três secções — **Geral** (ver canais, gerir canais, gerir cargos, criar convites, remover membros, silenciar membros), **Texto** (enviar mensagens, apagar mensagens, anexar ficheiros), **Voz** (ligar, falar). Para cargos de sistema, os interruptores ficam desactivados com uma faixa "só leitura". Botões Guardar/Cancelar activados apenas quando há alterações.
- **Grupo Servidor** (só dono): **Imagem** (pré-visualização + botão "Alterar imagem" abrindo o diálogo de upload; JPEG/PNG/WebP, até 1 MiB, sem recorte, opção Remover); **Mensagem de boas-vindas** (selector do canal de texto de boas-vindas + textarea de template + Guardar, com confirmação via toast); **Apagar servidor** (texto de confirmação + botão vermelho "Apagar servidor", com confirmação adicional).
- Ecrã de definições "vazio"/landing quando nenhuma sub-secção está seleccionada (título + texto).

**Convidar** (dois diálogos encadeados): se o servidor ainda não tem um canal de boas-vindas definido, primeiro pede para escolher o canal; depois mostra o convite criado com o URL copiável e feedback visual "Copiado".

**Estado vazio do servidor**: quando um servidor não tem nenhum canal, um painel central com texto de placeholder.
**Estado idle**: quando nenhum canal está seleccionado, um painel central "Escolha um canal".

### 3.3 Canais

**Criar canal** (diálogo, "+" de cada secção da sidebar): campo de nome com botão de emoji inline, radio de visibilidade **Público**/**Privado**, checkbox "Visível para novos membros" (só público); para canais de voz, mostra também o bloco de custódia da chave do canal (igual ao de criar servidor, com checkbox obrigatória).

**Renomear canal**: inline, ao duplo-clique/duplo-toque no nome; normaliza espaços para hífens, limite de 32 caracteres, permite emoji via picker inline.

**Apagar canal**: diálogo de confirmação partilhado; bloqueado com mensagem de erro se for o último canal desse tipo no servidor.

**Permissões do canal (ACL)** — diálogo completo aberto pelo menu de contexto do canal:
- Radio de visibilidade + checkbox "visível para novos membros".
- Construtor de regras: tipo de sujeito (Membro / Cargo / Todos os membros) → selector do sujeito → efeito (Permitir/Negar) → nível (leitura/escrita para texto, ouvir/falar para voz) → botão "Adicionar".
- Lista das regras existentes, cada uma removível.
- Sub-painel **"Inspecionar acesso"**: escolher um membro e ver o resultado resolvido (Ver canal: Sim/Não, nível efectivo, explicação factor-a-factor de como chegou a esse resultado).

**Silenciar membro num canal** (a partir do painel de membros): duração predefinida (5/10/15/30 min) ou minutos customizados, rótulo de tempo restante, botão "Dessilenciar".

**Lista de canais na sidebar**: cada linha de canal de texto mostra "#" + nome + ícone de cadeado se privado; cada linha de canal de voz mostra ícone de headset + nome + ponto indicador de partilha de ecrã activa + duração da chamada em curso (se houver) + ícone de cadeado se privado, **mais uma lista (roster) inline dos ocupantes actuais da voz** com avatar, handle, ícone de microfone ligado/desligado, ícone de "a ouvir" e destaque visual de quem está a falar.

### 3.4 Chat de texto

**Cabeçalho do canal**: "#nome-do-canal", subtítulo "texto visível", botão de alternar painel de membros, chip fixo "E2EE ligada" (com ícone de cadeado — em canais de texto a E2EE não pode ser desligada).

**Faixa de estado de ligação**: aviso não-modal quando o WebSocket está a reconectar/sincronizar histórico.

**Lista de mensagens**:
- Separadores de dia (traço + "Hoje"/"Ontem"/data completa), com um separador fixo ("sticky") no topo ao fazer scroll dentro de um dia.
- Agrupamento por remetente consecutivo (avatar mostrado uma vez por grupo; hora na primeira linha de cada mensagem).
- Linhas de sistema centradas (ex.: anúncio de boas-vindas a um novo membro).
- Por mensagem: botão de responder (visível em hover/foco) que define um alvo de resposta mostrado acima do composer com botão de cancelar; botão de apagar (visível conforme permissão — autor, criador do canal, dono do servidor, ou permissão "apagar mensagens"); linha de citação da mensagem respondida (autor + trecho truncado) quando aplicável; renderização de menções `@handle` como chips estilizados e clicáveis (só quando resolvem para um membro real do roster); anexos de imagem decifrados no cliente, mostrados como miniaturas clicáveis que abrem um **lightbox** (zoom in/out, download, avançar/recuar entre anexos da mesma mensagem, fechar por Escape/backdrop/X, arrastar quando ampliado); pré-visualizações de link auto-geradas (até 5 por mensagem, miniatura + nome do site + título + etiqueta "Vídeo" quando aplicável).

**Composer**:
- Botão de anexar (clip/mais) para imagens, multi-selecção, tira de miniaturas com remoção individual, limite máximo de anexos; suporte para colar imagem directamente.
- Campo de texto com autocompletar de **menções** `@` (popup navegável por teclado) e autocompletar de **emoji** por `:shortcode:` (popup de sugestões).
- Botão dedicado de picker de emoji (grelha pesquisável).
- Botão de enviar (circular, ícone de avião de papel).
- Estados alternativos: aviso "somente leitura" substitui o composer em canais sem permissão de escrita; faixa "silenciado até HH:MM" quando o utilizador está em timeout no canal.

**Saltar para o presente**: pill flutuante que aparece ao fazer scroll para cima com novas mensagens entretanto chegadas, mostrando a contagem.

**Notificações**: secção "Menções/Respostas" (persiste até a mensagem-alvo ser vista) e secção "Canais com novidades" (efémera, da sessão actual) no dropdown de notificações da topbar (ver 3.6); cada linha leva directamente à mensagem em causa.

**Pesquisa** (expande a partir da topbar): texto livre ou sintaxe `#canal termo` para restringir a um canal; resultados agrupados por "servidor · #canal" com excerto; estados vazios diferenciados (canal não encontrado / canal é de voz, não de texto / sem resultados); atalho de teclado global pré-preenche com o canal actual.

### 3.5 Chamadas de voz/vídeo

**Ecrã de pré-entrada**: botão "Entrar", botão secundário "Testar vídeo" (entra com uma faixa de vídeo sintética/padrão de teste em vez da câmara real) e, para utilizadores só com permissão de ouvir, "Entrar (ouvir)". A escolha de câmara ligada/desligada segue a preferência guardada no painel do utilizador, não é perguntada a cada entrada.

**Cabeçalho da chamada**: nome do canal, contagem de ocupantes + duração da chamada em curso, um controlo segmentado **Composição / Grade** (com ponto indicador de partilha de ecrã activa na aba Grade), botão de alternar painel de membros, menu "⋯" (Editar cena — só admin, quando não já a editar; selector de efeito de blur de câmara: nenhum/leve/forte, só durante a chamada), e um chip **E2EE** (cadeado verde quando ligada; ícone de aviso "E2EE desligada" quando desligada).

**Faixa "E2EE desligada"**: barra de aviso de largura total, permanente enquanto a E2EE estiver desligada, mostrando quem desligou e quando; para admins com a chave do canal, botão **"Religar E2EE"** que abre um diálogo pedindo a chave do canal (ou indicando que a chave já está neste dispositivo).

**Vista "Composição"**: grelha fixa de câmaras segundo um layout nomeado — **Mestre em destaque**, **Painel** (quadrado) ou **Faixa** — de 2 a 8 posições; cada posição mostra um chip com o nome + o vídeo/áudio da pessoa atribuída; ocupantes sem posição atribuída aparecem numa faixa lateral "No banco".

**Vista "Grade"**: grelha unificada com todas as câmaras e todas as partilhas de ecrã (câmaras primeiro, depois ecrãs); cada câmara tem uma cor de "assento" estável e um anel/glow quando a pessoa está a falar; cada partilha de ecrã mostra ícone, handle, etiqueta "Tela" e um alternador de destaque (★/☆) que promove essa partilha a um palco principal grande com filmstrip das restantes.

**Editor de cena** (só admin, substitui a vista de grelha enquanto activo): arrastar-e-largar (ou toque-para-atribuir) de uma lista lateral "No banco" para posições numeradas; clicar numa posição ocupada devolve a pessoa ao banco; selector de número de posições (2–8), com um passo de confirmação extra ao reduzir (escolher quais remover); selector do layout nomeado, com miniaturas ao vivo; acções Descartar/Guardar; diálogo de confirmação (Cancelar/Descartar/Guardar) se houver alterações por guardar ao tentar fechar.

**Controlos de chamada** — vivem exclusivamente no painel do utilizador (secção 3.6), nunca sobre o palco de vídeo em si: alternar microfone (desactivado com explicação para quem só tem permissão de ouvir), alternar surdo/ouvir, alternar câmara, alternar partilha de ecrã (só disponível na vista Grade e durante a chamada), terminar chamada (vermelho).

**Menu de blur de câmara**: Sem blur / Blur leve / Blur forte, aplicado em tempo real à câmara local; mensagem de erro inline se o ambiente não suportar.

**Indicadores de fala**: anel/glow por participante, accionado pela detecção de nível de áudio, visível simultaneamente na vista Composição, na vista Grade e no roster de voz da sidebar.

### 3.6 Shell persistente

**Rail de servidores**: ver 2.

**Topbar** (fixa): botão de hambúrguer (só em ecrã estreito), logótipo + nome + versão da instância; à direita: ícone de pesquisa (expande para o painel de pesquisa), sino de notificações (com badge quando há novidades não vistas; dropdown com botão "Limpar" e as duas secções descritas em 3.4), alternador de tema de três estados — **Sistema → Claro → Escuro** — com ícone próprio para cada estado. Em modo definições, um botão extra "X" fecha as definições e volta ao canal.

**Painel do utilizador** (fundo da sidebar, ocupa toda a largura): linha de controlos de chamada (só visíveis durante uma chamada activa — sair, microfone, surdo/ouvir, câmara, partilha de ecrã quando aplicável) e, sempre visível, a linha de identidade: avatar (com indicador online), handle, estado "Online", nome do canal de voz actual (se em chamada), e um botão de engrenagem que abre o **menu de conta**.

**Menu de conta** (popover): "Ligado como" + handle (só leitura); campo **Nome a mostrar** (editável, com limite de caracteres, botão Guardar, erro inline); botão **Foto de perfil** (abre o diálogo de upload de imagem); grupo de idioma **Português (BR) / English** (radio com confirmação visual do activo); botão **Sair**, com diálogo de confirmação.

**PiP flutuante de chamada**: aparece quando há uma chamada activa mas o utilizador navegou para outro ecrã; cabeçalho com nome do canal + duração, arrastável e com encaixe nos 4 cantos (posição memorizada); até 4 posições de câmara (local + remotas) ou um estado "Em chamada" quando não há vídeo; acções "Voltar ao palco" e terminar chamada.

**Painel de membros** (lateral direito, alternável a partir do cabeçalho de qualquer canal): lista de membros do servidor, agrupada.

**Menus de contexto**: um padrão único para clique-direito (desktop) e toque-longo (~500 ms, mobile/tablet), usado nos canais (renomear/apagar/permissões), no rail de servidores, etc.; suporta uma variante "perigosa" (acção destrutiva) visualmente distinta.

---

## 4. Estados e comportamentos transversais (aplicam-se a todos os ecrãs acima)

- **Responsivo**: abaixo de ~900px de largura, o rail + sidebar colapsam numa gaveta ("drawer") com fundo/backdrop, aberta por um botão de hambúrguer na topbar.
- **Tema**: três modos — Sistema, Claro, Escuro — alternáveis a qualquer momento pela topbar, com persistência entre sessões. O design system deve incluir tokens completos para os dois temas (claro e escuro), não só um.
- **Idioma**: interface disponível em **Português (Brasil)** e **Inglês**, alternável no menu de conta; nomes de cargos de sistema traduzem-se, conteúdo escrito por utilizadores (mensagens, nomes de canal/servidor) não.
- **Diálogos**: padrão único (título + corpo + acções), fecham por Escape ou clique fora; uma variante específica para "há alterações por guardar" com três acções (Cancelar/Descartar/Guardar).
- **Toasts**: confirmação breve e discreta para acções assíncronas bem-sucedidas (ex.: "Boas-vindas guardadas").
- **Feedback de cópia**: botões de copiar (URL de convite, chave de canal/servidor) mostram confirmação temporária "Copiado".
- **Estados vazios e de erro**: cada lista (membros, mensagens, resultados de pesquisa, canais) precisa de um estado vazio próprio e, quando aplicável, de um estado de erro/indisponível (ex.: convite inválido, canal não encontrado).
- **Avatares/identidade**: iniciais como fallback quando não há foto, tanto para utilizadores como para servidores.

---

## 5. Chaves e custódia (E2EE) — impacto apenas na UI, não na criptografia em si

Estes fluxos já existem e precisam de tratamento visual claro e tranquilizador (não assustador), porque envolvem uma chave que, se perdida, tem consequências reais:

- **Criar servidor** e **criar canal de voz** mostram a chave gerada como um bloco de código copiável, com uma checkbox obrigatória ("Guardei a chave") antes de o botão de confirmação ficar activo.
- **Religar E2EE** de um canal de voz pede a chave do canal (ou confirma que já está neste dispositivo).
- O **cofre de identidade** (recuperação por password) tem um fluxo de "desbloquear" e "recuperar identidade" no ecrã de autenticação (3.1).

---

## 6. O que o Google Stitch deve entregar

1. **Tokens de design**: paleta de cor completa (light + dark), incluindo cores de estado (sucesso, aviso, erro, informação) e cores semânticas para os indicadores já descritos (online, não-lido, voz activa, a falar, E2EE ligada/desligada, privado); escala tipográfica (incluindo pelo menos um peso/estilo de destaque para nomes de canais de voz e título de marca, conforme usado hoje); escala de espaçamento; raios de borda (a aplicação actual usa botões em pill e cartões arredondados — o novo sistema pode reinterpretar isto livremente, mas deve definir uma escala consistente); sombras/elevação (para popovers, diálogos, menus de contexto, PiP flutuante).
2. **Biblioteca de componentes**: botões (primário/secundário/perigoso/ícone), campos de formulário (texto, password com toggle, radio, checkbox, switch/interruptor, select), abas e controlo segmentado, chips/badges (incluindo chip de menção e chip de estado E2EE), avatares (com indicador de estado), tooltips, diálogos/modais, menus de contexto, toasts, cartões de membro/cargo, tiles de câmara (estado normal, a falar, partilha de ecrã), composer de mensagem, bolha/linha de mensagem, separador de dia.
3. **Conjunto de ícones** coerente com o novo estilo, cobrindo pelo menos: pesquisa, notificação/sino, tema (sol/lua/sistema), microfone ligado/desligado, câmara ligada/desligada, surdo/ouvir, partilha de ecrã, terminar chamada, cadeado (E2EE), utilizador/membros, convite, definições/engrenagem, responder, apagar, anexar, emoji, enviar, menu (hambúrguer), fechar, seta/chevron, headset (canal de voz), canal de texto ("#").
4. **Mockups dos ecrãs e fluxos da secção 3**, em ambos os temas (claro/escuro) onde fizer sentido, mostrando os principais estados descritos (vazio, com dados, a carregar quando aplicável, erro).

---

## 7. Fora de escopo — não desenhar

Não incluir, nesta ronda, nada do ficheiro [`docs/backlog/backlog.md`](../backlog/backlog.md) — em resumo: gravação/egress de chamada, múltiplas cenas nomeadas por canal, papel de "co-diretor", templates de cena partilháveis, diretório público de servidores, posicionamento livre de câmara (canvas), papéis/etiquetas de mesa nos tiles, badges numéricos de não-lidos, federação entre instâncias, sistema de plugins/API pública, importador de estrutura do Discord, painel de estatísticas sociais, migração de identidade entre instâncias, empacotamento desktop Tauri, ecrã de preferências de notificação, e controlo de validade/permanência de convites. Nenhum destes itens deve aparecer nos mockups nem nos componentes entregues.

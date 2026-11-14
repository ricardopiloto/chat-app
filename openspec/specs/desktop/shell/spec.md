# shell Specification

## Purpose

Embrulha o `frontend/dist` já existente numa janela nativa por plataforma (Windows/Mac/Linux), com a identidade visual oficial da Mesa como ícone da aplicação e com a rede configurada para que um cliente nativo se ligue a qualquer instância Mesa escolhida em runtime.

## Requirements

### Requirement: O ícone da aplicação é a marca oficial, em todas as plataformas

O sistema SHALL usar a marca oficial da Mesa (a mesma fonte de `openspec/specs/frontend-v2/brand-identity/spec.md`) como ícone da aplicação em Windows, macOS e Linux, gerado numa resolução adequada a cada formato nativo (`.ico`, `.icns`, conjunto de PNGs), e SHALL NOT apresentar um ícone genérico ou de placeholder em nenhuma plataforma.

#### Scenario: Ícone correcto no instalador e na barra de tarefas

- **WHEN** a aplicação é instalada ou executada em qualquer uma das três plataformas
- **THEN** o ícone mostrado (barra de tarefas/dock, janela, atalho) é a marca oficial da Mesa, na mesma forma usada no favicon e na topbar do build web

### Requirement: A janela usa decoração nativa, sem chrome personalizado

O sistema SHALL apresentar a janela principal da aplicação com uma barra de título desenhada pela própria aplicação (área de arraste e controlos próprios de minimizar/maximizar/fechar), em vez da barra de título padrão do sistema operativo. As restantes janelas abertas pelo shell (o diálogo de partilha de ecrã e o popout de chamada) SHALL continuar a usar a decoração nativa do sistema operativo, sem chrome personalizado. O conteúdo da janela principal abaixo da sua barra de título personalizada SHALL continuar a ser o `frontend/dist` já servido no build web; a divergência introduzida por esta mudança fica limitada à própria barra de título, não ao resto do conteúdo.

#### Scenario: Janela principal com chrome personalizado

- **WHEN** a aplicação é aberta em qualquer uma das três plataformas
- **THEN** a janela principal mostra uma barra de título desenhada pela aplicação, com área de arraste e controlos de minimizar/maximizar/fechar próprios, em vez da barra de título nativa do sistema operativo

#### Scenario: Janela com decoração do SO

- **WHEN** o diálogo de partilha de ecrã ou a janela de popout de chamada são abertos
- **THEN** cada um mostra a barra de título nativa desse sistema operativo, sem chrome personalizado, exactamente como antes desta change

#### Scenario: Redimensionar, maximizar e encaixar continuam a funcionar sem decoração nativa

- **WHEN** o utilizador arrasta os limites da janela principal, faz duplo-clique na barra de título personalizada, ou usa os gestos de encaixe de janela do sistema operativo (por exemplo, arrastar para a margem do ecrã no Windows)
- **THEN** a janela principal redimensiona, maximiza/restaura e encaixa como uma janela nativa equivalente faria, apesar de já não ter a decoração nativa do sistema operativo

### Requirement: A rede do shell permite ligar a qualquer instância configurada pelo utilizador

O sistema SHALL permitir que o tráfego de rede do cliente nativo (pedidos REST, ligação de tempo real, carregamento de imagens) alcance qualquer endereço que o utilizador configure como instância Mesa em runtime (ver `frontend-v2/instance-connect`), SHALL NOT restringir essas ligações a uma lista fixa de domínios conhecidos em build-time, e SHALL manter a configuração de segurança da janela sem abrir excepções além das necessárias para esse tráfego — em particular, SHALL NOT permitir que a janela carregue ou execute conteúdo de uma origem que não seja o próprio pacote da aplicação (`frontend/dist`) ou a instância configurada pelo utilizador.

#### Scenario: Ligação a uma instância qualquer

- **WHEN** o utilizador configura uma instância num endereço só conhecido em runtime (ex.: um IP de LAN ou um domínio próprio)
- **THEN** os pedidos REST, a ligação de tempo real, e o carregamento de imagens (avatares, anexos) alcançam esse endereço sem serem bloqueados pela configuração de rede do shell

#### Scenario: A janela nunca navega para conteúdo de terceiros

- **WHEN** a configuração de segurança da janela é inspeccionada
- **THEN** a única origem que a janela carrega como documento principal é o pacote da própria aplicação; pedidos de rede a partir desse documento para a instância configurada são permitidos, mas a janela não navega nem executa scripts de nenhuma outra origem

#### Scenario: CSP não abre excepções desnecessárias

- **WHEN** a configuração de rede/segurança do shell é inspeccionada (título mantido do requisito original; o mecanismo deixou de ser CSP do Tauri e passou a ser o âmbito da injecção de header do Electron — ver `design.md` Decisão 1)
- **THEN** a única excepção presente é a injecção do token de sessão nos pedidos dirigidos à origem da instância configurada — nenhuma outra origem recebe esse header, e nenhuma outra protecção de rede é relaxada além do necessário para esse tráfego

### Requirement: Câmara, microfone e colar imagem funcionam de forma fiável

O sistema SHALL suportar captura de câmara e microfone (`getUserMedia`, usada para entrar em canais de voz/vídeo) e colar uma imagem da área de transferência (usada para anexar imagens no compositor de mensagens) com o mesmo nível de fiabilidade que o build web num browser comum, em todas as três plataformas — SHALL NOT depender de contornos específicos de hardware/driver para funcionar.

#### Scenario: Entrar numa chamada com câmara

- **WHEN** um utilizador com câmara disponível aprova o pedido de permissão e entra num canal de voz/vídeo
- **THEN** a chamada estabelece-se e a câmara é capturada, sem erro `NotAllowedError`/`SecurityError` nem falha de negociação de capacidades do dispositivo

#### Scenario: Colar imagem no compositor

- **WHEN** um utilizador cola (Ctrl+V) uma imagem copiada da área de transferência no campo de mensagem
- **THEN** a imagem é reconhecida como anexo, tal como já acontece no build web

### Requirement: Borda visível da janela principal no desktop

No cliente desktop (Electron), a janela principal SHALL apresentar uma borda fina e contínua à volta do conteúdo da aplicação, com contraste suficiente para permanecer distinguível face a um fundo do sistema operativo escuro e face aos temas claros e escuros da própria aplicação. O build web SHALL NOT desenhar esta borda. Janelas secundárias do shell (popout de chamada, picker de ecrã) SHALL NOT receber esta borda por esta change.

Quando a janela principal estiver maximizada, o sistema SHALL ocultar essa borda (sem faixa residual nas bordas do ecrã).

#### Scenario: Borda visível com tema escuro do SO

- **WHEN** a aplicação desktop corre com a janela principal restaurada (não maximizada) sobre um ambiente de SO com tema escuro
- **THEN** o contorno da janela permanece perceptível em relação ao fundo

#### Scenario: Sem borda no build web

- **WHEN** a mesma UI corre no browser
- **THEN** não há borda de janela acrescentada por este mecanismo

#### Scenario: Maximizado sem borda

- **WHEN** o utilizador maximiza a janela principal no desktop
- **THEN** a borda deixa de ser desenhada até a janela voltar ao estado restaurado

### Requirement: System tray com Abrir e Fechar

No cliente desktop (Electron), o sistema SHALL mostrar um ícone na bandeja do sistema operativo (system tray / menu bar) com a marca oficial da Mesa, e SHALL expor um menu com exactamente duas acções de produto: **Abrir** (mostrar a janela principal e dar-lhe foco) e **Fechar** (terminar a aplicação). O build web SHALL NOT mostrar tray.

#### Scenario: Abrir dá foco

- **WHEN** a janela principal está escondida ou sem foco e o utilizador escolhe Abrir na tray (ou activa o ícone da tray de forma equivalente na plataforma)
- **THEN** a janela principal fica visível e recebe o foco do sistema operativo

#### Scenario: Fechar na tray encerra a app

- **WHEN** o utilizador escolhe Fechar na tray
- **THEN** o processo da aplicação termina (não fica só escondido)

### Requirement: Fechar a janela esconde para a tray

No cliente desktop, o sistema SHALL interpretar o fecho da janela principal (botão X da decoração, ou o controlo de fechar da app, incluindo `mesa:close` quando existir) como **esconder** a janela e manter o processo vivo com o ícone na tray. O sistema SHALL NOT terminar a aplicação nesse gesto. A saída definitiva SHALL ser só via Fechar na tray (ou mecanismo explícito equivalente de quit).

#### Scenario: X esconde, processo continua

- **WHEN** o utilizador fecha a janela principal pelo controlo de fechar
- **THEN** a janela deixa de ser visível, o ícone da tray permanece, e a sessão/realtime pode continuar

#### Scenario: Reabrir depois de esconder

- **WHEN** a janela foi escondida para a tray e o utilizador escolhe Abrir
- **THEN** a mesma sessão de aplicação reaparece com foco, sem exigir novo login só por causa do esconder

### Requirement: Desktop main-window close behavior is a remembered choice

On the desktop client, closing the main window through X or the app close control SHALL use a per-install choice of hide to tray or quit. With no saved choice, the system SHALL ask on the first close attempt, apply an explicit selection to that attempt, and save it. Later close attempts SHALL follow the saved choice silently. Dismissing the prompt without choosing SHALL hide to tray for that attempt and SHALL NOT save a choice, so the next close asks again. Hiding SHALL keep the app and active call running; quitting SHALL use normal application shutdown.

#### Scenario: First close selects hide

- **WHEN** no choice is saved and the person selects hide to tray
- **THEN** the window hides, the app stays running, and later closes hide without a prompt

#### Scenario: First close selects quit

- **WHEN** no choice is saved and the person selects quit
- **THEN** the app quits normally and later closes after relaunch quit without a prompt

#### Scenario: Prompt dismissed

- **WHEN** no choice is saved and the person dismisses the prompt without choosing
- **THEN** the window hides to tray, no choice is saved, and the next close presents the prompt again

#### Scenario: Saved quit choice

- **WHEN** quit is saved and the person closes the main window
- **THEN** the app quits normally without showing the choice prompt

### Requirement: Desktop Settings can change the close choice

The desktop Settings screen SHALL show the current close behavior and SHALL allow a person to change it between hide to tray and quit at any time. An explicit saved change SHALL take effect on the next close without restart. The browser build SHALL NOT show this setting. Once a choice is saved, the first-close prompt SHALL NOT reappear; subsequent changes SHALL be made through Settings.

#### Scenario: Change from tray to quit

- **WHEN** a person changes the Settings choice from hide to tray to quit
- **THEN** the next close quits normally, without prompt or restart

#### Scenario: Change from quit to tray

- **WHEN** a person changes the Settings choice from quit to hide to tray
- **THEN** the next close hides to tray, without prompt or restart

#### Scenario: Browser Settings

- **WHEN** a person opens Settings in a browser
- **THEN** no close-behavior control is shown

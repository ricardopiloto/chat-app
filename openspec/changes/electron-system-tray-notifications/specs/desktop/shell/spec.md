# Spec Delta

## ADDED Requirements

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

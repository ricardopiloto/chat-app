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

O sistema SHALL apresentar a aplicação numa janela com a barra de título padrão do sistema operativo (minimizar/maximizar/fechar nativos), e SHALL NOT substituir essa decoração por um chrome desenhado pela aplicação. O conteúdo dentro da janela SHALL ser exactamente o `frontend/dist` já servido no build web, sem elemento visual acrescentado pelo shell.

#### Scenario: Janela com decoração do SO

- **WHEN** a aplicação é aberta em qualquer das três plataformas
- **THEN** a janela mostra a barra de título nativa desse sistema operativo, e o conteúdo abaixo dela é idêntico ao que o build web mostra na mesma resolução

### Requirement: A rede do shell permite ligar a qualquer instância configurada pelo utilizador

O sistema SHALL permitir que os plugins de rede usados pelo cliente nativo (HTTP, WebSocket, armazenamento local) alcancem qualquer endereço que o utilizador configure como instância Mesa em runtime (ver `frontend-v2/instance-connect`), SHALL NOT restringir essas ligações a uma lista fixa de domínios conhecidos em build-time, e SHALL manter a política de conteúdo (CSP) da janela sem abrir excepções além do necessário para esse tráfego de rede.

#### Scenario: Ligação a uma instância qualquer

- **WHEN** o utilizador configura uma instância num endereço só conhecido em runtime (ex.: um IP de LAN ou um domínio próprio)
- **THEN** os pedidos REST e a ligação de tempo real alcançam esse endereço sem serem bloqueados pela configuração de rede do shell

#### Scenario: CSP não abre excepções desnecessárias

- **WHEN** a política de conteúdo da janela é inspeccionada
- **THEN** as únicas excepções presentes são as necessárias para o tráfego de rede do cliente nativo, sem relaxar protecções não relacionadas (ex.: execução de scripts inline não usados pela aplicação)

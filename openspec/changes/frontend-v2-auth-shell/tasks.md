# Tasks

## 1. Criptografia de identidade

- [x] 1.1 Portar `frontend/src/crypto/identity.ts` para `frontend-v2/src/crypto/identity.ts` (geração de par de chaves NaCl, derivação Argon2id, cifra AES-GCM, persistência IndexedDB, `IdentityUnlockError`) e verificar com `tsc --noEmit` que compila sem alterações de assinatura
- [x] 1.2 Escrever um teste manual de round-trip: gerar identidade → cifrar com password → decifrar com a mesma password → confirmar que a chave secreta resultante é idêntica à original; verificar também que uma password errada produz `IdentityUnlockError("bad_password")`
- [ ] 1.3 Confirmar compatibilidade de formato: um `IdentityVault` persistido pela v1 (`frontend/`) consegue ser lido e desbloqueado pelo código portado em `frontend-v2/` (mesmo formato de campos `v/publicKey/salt/iv/wrapped`); verificar manualmente usando uma conta de teste criada na v1

## 2. Ecrã de autenticação

- [ ] 2.1 Construir o ecrã de login/registo seguindo `mesa_autentica_o_e_registo_login_criar_conta` (separador Login/Registo, campo handle, campo password com toggle de visibilidade, submissão) consumindo `POST /api/auth/login` e `POST /api/auth/register` via o cliente da Fase 0; verificar fluxo completo de registo e de login contra o backend a correr localmente
- [ ] 2.2 Implementar o fluxo de desbloqueio de conta (dispositivo novo) seguindo `mesa_desbloqueio_de_conta_recupera_o_de_identidade`, incluindo os 3 estados de 1.2/spec (cofre remoto existe, nenhum cofre existe, password incorrecta) e a acção "Trocar de conta"; verificar cada um dos 3 estados manualmente
- [x] 2.3 Implementar a acção "Recuperar identidade" sempre acessível a partir do ecrã de desbloqueio (não condicionada a falha prévia); verificar que está visível em qualquer visita ao ecrã de desbloqueio
- [x] 2.4 Verificar que nenhum ecrã desta fase apresenta UI de dispositivos/sessões autorizadas, cofre MLS ou Passkeys (conferir contra a lista de mockups excluídos em `docs/v2/TR-frontend-v2.md` §7)

## 3. Rail de servidores e sidebar

- [ ] 3.1 Implementar o rail de servidores lendo `GET /api/servers`, com estado activo derivado da rota e indicadores de não-lido/voz-activa a partir dos eventos WS `message.new`/`voice.occupancy`; verificar navegação entre pelo menos 2 servidores de teste
- [ ] 3.2 Implementar o cabeçalho da sidebar (nome do servidor + afordances de definições/convite, sem os diálogos em si) e a lista de canais em duas secções (Texto/Voz-vídeo) lendo `GET /api/servers/{id}/channels`; verificar que clicar num canal muda a rota e o estado de selecção
- [ ] 3.3 Implementar o indicador de cadeado para canais privados e o estado vazio quando o servidor não tem canais; verificar ambos com dados de teste

## 4. Topbar e tema

- [ ] 4.1 Implementar a topbar (logótipo, rótulo de instância, ponto de entrada de pesquisa, ponto de entrada de notificações com indicador de novidade, alternador de tema); verificar que os pontos de entrada de pesquisa/notificações são clicáveis mesmo sem conteúdo aberto ainda (essa é a Fase 3)
- [ ] 4.2 Implementar o alternador de tema de 3 estados (Sistema/Claro/Escuro) com persistência em `localStorage` e reacção a mudanças de `prefers-color-scheme` do sistema operativo quando em modo Sistema; verificar os 3 estados e a persistência entre recarregamentos
- [ ] 4.3 Revisão visual manual do shell completo em modo claro (D3 do design.md — sem mockup de referência) e corrigir quaisquer problemas de contraste encontrados; documentar a revisão como concluída

## 5. Painel do utilizador e menu de conta

- [x] 5.1 Implementar o painel do utilizador fixo (avatar, indicador online, handle, botão de definições) seguindo o padrão visual comum aos mockups de shell
- [ ] 5.2 Implementar o menu de conta (popover) seguindo `mesa_menu_de_conta_popover_modal_de_sair`: edição de nome a mostrar (`PUT` ao endpoint correspondente), upload de avatar, selector de idioma pt-BR/en (integrado com o motor de i18n da Fase 0), e logout com modal de confirmação explícita; verificar cada acção manualmente
- [x] 5.3 Verificar que alternar o idioma no menu de conta troca os textos já traduzidos desta fase (login, shell, menu de conta) sem recarregar a página

## 6. Responsividade do shell

- [ ] 6.1 Implementar o colapso do rail+sidebar numa gaveta com backdrop abaixo de 768px, seguindo o padrão comportamental da v1 (`AppShell.tsx`); verificar em viewport emulado <768px que a gaveta abre/fecha correctamente por hambúrguer e por toque no backdrop
- [ ] 6.2 Verificar que redimensionar a janela de <768px para ≥768px (e vice-versa) alterna correctamente entre o layout mobile (gaveta) e o layout desktop (rail+sidebar fixos) sem exigir recarregar a página

## 7. Verificação de fase completa

- [ ] 7.1 Percorrer o fluxo completo: registar conta nova → ver o shell vazio (sem servidores) → criar sessão noutra aba/dispositivo simulando "dispositivo novo" → desbloquear com a mesma password → confirmar que o shell carrega os mesmos dados; verificar que não houve nenhuma chamada de rede com a chave secreta em claro (inspeccionar via devtools de rede)
- [x] 7.2 Confirmar que nenhuma alteração foi feita a `frontend/` durante esta fase (`git status frontend/` sem alterações)

## Estado de execução

Implementação e verificações sem navegador registradas em [verification.md](verification.md). Por instrução do utilizador, verificações com navegador ficam a seu cargo; tarefas que as incluem permanecem abertas até confirmação. Suporte a convite autorizado e implementado.

## 8. Complemento autorizado: convite no cadastro

- [x] 8.1 Incluir código editável no cadastro, ler `/invite/:code` e `?invite=<code>`, enviar `invite_code` e apresentar erro traduzido para convite inválido/ausente.
- [ ] 8.2 Utilizador: validar cadastro por convite contra backend local.

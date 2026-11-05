# Tasks

## 1. Lógica pura do host

- [ ] 1.1 Criar `frontend/electron/host-config.ts` com funções puras: variáveis de ambiente do servidor, argumentos, porta padrão e validação de portas, formato e leitura do convite (`parley://host:porta/?fp=`), e incluí-lo no `include` de `electron/tsconfig.json`; verificar com `npm run verify:host` (script novo) cobrindo convite válido/inválido, impressão digital malformada e portas fora de faixa
- [ ] 1.2 Estender `InstanceState` com `pinnedFingerprint` mantendo a leitura de arquivos antigos; verificar que um `mesa-instance.json` sem o campo carrega como antes

## 2. Verificação do certificado fixado

- [ ] 2.1 Implementar `setCertificateVerifyProc` em produção (D7): aceita só o host:porta com impressão digital fixada e coincidente, e delega ao verificador padrão nos demais; verificar contra um servidor HTTPS local de teste com certificado autoassinado: certificado correto conecta, certificado diferente no mesmo endereço é recusado, outro host autoassinado é recusado
- [ ] 2.2 Ajustar `InstanceConnect` para aceitar o convite (cola `parley://…`), validar `GET /health` com a impressão digital e guardar a instância fixada; manter `http://` recusado; verificar manualmente os cenários do spec (convite válido, divergente, `http://`, autoassinado sem convite) e `verify:instance`/`verify:instance-setup`
- [ ] 2.3 Adicionar as mensagens de erro de convite e certificado em `pt-BR.ts` e `en.ts` e verificar `npm run verify:i18n-keys`

## 3. Host-manager

- [ ] 3.1 Criar `frontend/electron/host-manager.ts` (máquina de estados, `--data-dir`, variáveis fixas (incluindo `SERVE_FRONTEND=off`) e `PARLEY_SETUP_TOKEN`, execução do servidor, espera pelo `/health`, logs, PID) e verificar com um servidor falso (script de teste) os estados `off → starting → on`, falha por porta ocupada e `stopping → off` sem processo restante
- [ ] 3.2 Encerramento ordenado: `before-quit`/`will-quit` e limpeza de processo órfão por PID no arranque; verificar encerrando o app à força e reabrindo sem processo duplicado
- [ ] 3.3 Garantir que a hospedagem desligada não escuta em porta alguma (verificar com `ss -ltnup` ou equivalente) e que o app novo, sem ligar a hospedagem, não executa nem baixa nada
- [ ] 3.4 Expor a ponte mínima em `preload.ts` e tipar em `frontend/src/env.d.ts` (D10); verificar `npx tsc -p electron/tsconfig.preload.json` e que nada além dos sete métodos (incluindo `hostSetupToken`) é exposto

- [ ] 3.5 Implementar a entrega do token (D12): gerar o token, guardá-lo só em memória, registrar a instância local do dono com a impressão digital e responder `hostSetupToken()` apenas enquanto a instância está em configuração; verificar que o cadastro guiado do administrador abre com o token já preenchido, que depois da criação da conta o método devolve vazio e que o token não aparece em disco nem no convite

## 4. Interface de hospedagem

- [ ] 4.1 Criar a rota «Hospedar» (estado, ligar/desligar, portas, aviso de exposição, aviso e confirmação do download do componente de mídia) em `frontend/src` com catálogos `pt-BR` e `en`; verificar no navegador com a ponte simulada e `verify:i18n-keys`
- [ ] 4.1b Na área «Hospedar», acrescentar o acesso a «Configurações da instância» (a tela da `instance-settings`) e indicar quais campos aparecem travados por serem fixados pelo app; verificar que a tela abre com o administrador local e mostra esses campos travados
- [ ] 4.2 Convite: botão «Copiar», exibição de endereço/porta/impressão digital e escolha do endereço (público detectado ou digitado); verificar que o convite copiado não contém segredos e é aceito pelo `InstanceConnect`
- [ ] 4.3 Bandeja e fechamento da janela com host ligado (D9): diálogo «Manter na bandeja»/«Encerrar», «Sair» na bandeja e lembrar escolha; verificar manualmente nos três cenários do spec

## 5. Diagnóstico de alcance

- [ ] 5.1 Implementar a detecção de endereço local/público e a verificação de TCP de fora (D8), com a mudança correspondente no backend da instância oficial (endpoint de sondagem que conecta só ao IP de quem pediu, portas permitidas e limite de pedidos); verificar com testes do backend: destino arbitrário recusado, porta não permitida recusada, limite de pedidos
- [ ] 5.2 Interface do diagnóstico com o aviso sobre a UDP de mídia e o «teste de chamada com outra pessoa»; verificar manualmente com uma porta aberta e uma fechada

## 6. Empacotamento e release

- [ ] 6.1 Adicionar `extraResources` por plataforma/arquitetura em `electron-builder.yml` e ajustar `.github/workflows/desktop-release.yml` para compilar e posicionar o `chat-backend` de cada plataforma; verificar com `workflow_dispatch` listando o instalador gerado (o servidor presente, o `livekit-server` ausente) e que a contagem de seis instaladores e o `SHA256SUMS` não mudam
- [ ] 6.2 Verificar a versão do servidor embutido contra a do app na inicialização e bloquear a hospedagem em caso de divergência; testar com um servidor de versão diferente
- [ ] 6.3 Integração com `desktop-self-update`: `restartForUpdate` encerra o host de forma ordenada antes de `quitAndInstall`; verificar com uma atualização local simulada com a hospedagem ligada

## 7. Documentação e validação final

- [ ] 7.1 Escrever o guia «Hospedar uma instância pelo app» (portas, encaminhamento no roteador, CGNAT, convite, dados em `userData/host/`) em `docs/` e atualizar README e CHANGELOG; verificar executando os passos documentados em uma máquina limpa
- [ ] 7.2 Rodar `openspec validate desktop-local-host --strict`, `npm run build`, `npm run verify:host` e as verificações de i18n e confirmar que passam
- [ ] 7.3 Teste ponta a ponta: dois computadores, um hospedando e outro entrando pelo convite; criar conta, trocar mensagens e fazer uma chamada de voz e vídeo; repetir após fechar a janela com «Manter na bandeja»

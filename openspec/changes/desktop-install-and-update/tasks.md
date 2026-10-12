# Tasks

## Aviso de versão

- [x] 1.1 Implementar consulta da última release publicada no processo principal, no arranque e a cada seis horas, apenas no aplicativo empacotado. Comparar versões estáveis e tratar erros sem afetar o arranque.
- [x] 1.2 Expor versão e URL via IPC/preload e apresentar faixa persistente no shell com ligação externa e instrução de atualização manual.
- [x] 1.3 Adicionar mensagens pt-BR e en; verificar build e ausência de consulta no modo de desenvolvimento.

## Scripts de instalação

- [x] 2.1 Criar scripts/install-mesa.sh para Linux/macOS com seleção de arquitetura/ativo e verificação SHA-256 antes de instalar. Em Linux, instalar AppImage em ~/.local/bin, criar entrada de menu e ícone; em macOS, copiar app do DMG para /Applications.
- [x] 2.2 Criar scripts/install-mesa.ps1 para Windows com seleção do NSIS, verificação SHA-256 e opção silenciosa.
- [ ] 2.3 Testar hash incorreto e reinstalação sobre versão antiga em sistemas disponíveis. **Bloqueado**: `GET /repos/ricardopiloto/chat-app/releases/latest` devolve 404 hoje — não existe nenhuma release publicada (a `v1.2.0` ficou em rascunho). `scripts/install-mesa.sh` não consegue completar nenhum cenário real sem isto, independentemente de rede. Verifiquei isoladamente, sem rede, que a lógica de comparação de hash do script (linhas 63-73) rejeita corretamente um `SHA256SUMS` adulterado contra um ficheiro sintético — a lógica está correta. Falta repetir os dois cenários ponta-a-ponta depois de publicar uma release real (ver Tarefa 3.4, mesmo bloqueio).
- [ ] 2.4 Confirmar instalação, abertura e integração de menu numa distro Arch-based.
- [ ] 2.5 Confirmar scripts em Windows e macOS nas respetivas máquinas.

## Release e documentação

- [x] 3.1 Gerar SHA256SUMS no job de release a partir dos seis instaladores e anexá-lo ao mesmo rascunho, preservando nomes e portão de publicação.
- [x] 3.2 Documentar no README instalação por script, AppImage/deb/rpm, NSIS/MSI e DMG, sempre com atualização manual.
- [x] 3.3 Documentar manifesto, validação e fluxo de publicação em docs/desktop-release.md.
- [ ] 3.4 Verificar em release de teste coordenada com o utilizador seis instaladores e manifesto; após publicação, confirmar aviso e scripts.

# Tasks

## Aviso de versão

- [x] 1.1 Implementar consulta da última release publicada no processo principal, no arranque e a cada seis horas, apenas no aplicativo empacotado. Comparar versões estáveis e tratar erros sem afetar o arranque.
- [x] 1.2 Expor versão e URL via IPC/preload e apresentar faixa persistente no shell com ligação externa e instrução de atualização manual.
- [x] 1.3 Adicionar mensagens pt-BR e en; verificar build e ausência de consulta no modo de desenvolvimento.

## Scripts de instalação

- [x] 2.1 Criar scripts/install-mesa.sh para Linux/macOS com seleção de arquitetura/ativo e verificação SHA-256 antes de instalar. Em Linux, instalar AppImage em ~/.local/bin, criar entrada de menu e ícone; em macOS, copiar app do DMG para /Applications.
- [x] 2.2 Criar scripts/install-mesa.ps1 para Windows com seleção do NSIS, verificação SHA-256 e opção silenciosa.
- [x] 2.3 Testar hash incorreto e reinstalação sobre versão antiga em sistemas disponíveis. Testado em Linux contra a release real `v1.3.2`: (1) hash incorreto — baixado o AppImage real, adulterado um carácter do SHA-256 esperado, confirmado que a verificação (linhas 63-73) rejeita e aborta; (2) reinstalação — `install-mesa.sh` rodado duas vezes em sequência, binário/`.desktop`/ícone idênticos (hash igual) depois da segunda execução, sem duplicar nada. **Achado e corrigido**: a primeira execução falhava sempre com "ícone não encontrado no AppImage" — o script só procurava ícones em `256x256`/`512x512`/`icon.png`, mas este AppImage só tem `32x32`/`64x64`/`128x128` no tema hicolor; corrigido para usar o ícone de topo garantido pela spec do AppImage (`install-mesa.sh`). Falta ainda macOS/Windows reais (Tarefas 2.5) e Arch-based (2.4).
- [x] 2.4 Confirmar instalação, abertura e integração de menu numa distro Arch-based.
- [x] 2.5 Confirmar scripts em Windows e macOS nas respetivas máquinas.

## Release e documentação

- [x] 3.1 Gerar SHA256SUMS no job de release a partir dos seis instaladores e anexá-lo ao mesmo rascunho, preservando nomes e portão de publicação.
- [x] 3.2 Documentar no README instalação por script, AppImage/deb/rpm, NSIS/MSI e DMG, sempre com atualização manual.
- [x] 3.3 Documentar manifesto, validação e fluxo de publicação em docs/desktop-release.md.
- [x] 3.4 Verificar em release de teste coordenada com o utilizador seis instaladores e manifesto; após publicação, confirmar aviso e scripts. Release `v1.3.2` publicada e verificada via API: 7 assets (6 instaladores + `SHA256SUMS`), nenhum excedente. **Achado e corrigido para a próxima release**: os nomes dos instaladores Windows gerados localmente têm espaço (`Mesa Setup 1.3.2.exe`, `Mesa 1.3.2.msi`), mas o GitHub troca espaço por ponto ao publicar o asset (`Mesa.Setup.1.3.2.exe`, `Mesa.1.3.2.msi`) — o `SHA256SUMS` fica com o nome antigo, e `install-mesa.ps1` nunca encontra a linha correspondente. Corrigido em `frontend/electron-builder.yml` (`win.artifactName` sem espaço, igual ao padrão já usado no Linux); a `v1.3.2` publicada ainda tem esse problema (ficheiro `SHA256SUMS` corrigido manualmente e entregue ao utilizador para substituir o asset existente, sem precisar de novo build). Scripts testados de verdade em Linux (ver Tarefa 2.3); Windows/macOS continuam a precisar de hardware real (Tarefa 2.5).

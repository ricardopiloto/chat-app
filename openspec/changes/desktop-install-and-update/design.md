# Design

## Context

Esta change complementa desktop-packaging-ci. O workflow gera seis instaladores e publica uma GitHub Release em rascunho. A decisão atual é avisar sobre novas versões e deixar a instalação ao utilizador em todas as plataformas.

## Decisions

### 1. Verificação de versão sem electron-updater

O processo principal consulta https://api.github.com/repos/ricardopiloto/chat-app/releases/latest após criar a janela e a cada seis horas, apenas fora do modo de desenvolvimento. Compara tag_name à versão instalada, aceitando tags estáveis vMAJOR.MINOR.PATCH. Releases inválidas ou falhas de rede não apresentam aviso. IPC envia apenas versão e URL; preload expõe evento limitado ao renderer. Faixa do shell fica visível durante a sessão. O link abre no navegador externo. Nenhum download ou execução ocorre nesse caminho.

### 2. Scripts idempotentes e hashes publicados

Scripts selecionam um ativo pela extensão, arquitetura e nome. Consultam SHA256SUMS anexado à mesma release, validam hash e só então instalam. Arquitetura ou ativo ausente gera erro. Workflow calcula SHA256SUMS a partir dos seis instaladores reunidos no job de release e anexa ao rascunho. Reexecutar o script obtém a versão publicada mais recente. AppImage fica em ~/.local/bin, com entrada ~/.local/share/applications/mesa.desktop e ícone extraído do AppImage. macOS copia app do DMG para /Applications; Windows executa NSIS, com opção silenciosa explícita.

### 3. Revisão humana permanece

draft: true e --publish never não mudam. Aviso e scripts usam apenas releases publicadas.

## Risks

- API indisponível: verificação não bloqueia o arranque e é repetida seis horas depois.
- Scripts só instalam releases com SHA256SUMS; releases antigas sem manifesto exigem instalação manual direta. Hash detecta corrupção, não substitui assinatura.
- Confirmar AppImage e menu numa distro Arch-based.
- Windows e macOS exigem validação nas respetivas máquinas; tarefas ficam abertas até execução.

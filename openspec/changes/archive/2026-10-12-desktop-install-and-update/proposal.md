# Proposal

## Why

O cliente desktop precisa de instalação por linha de comando e aviso quando existe versão publicada mais recente. O utilizador decidiu aplicar atualizações manualmente em todas as plataformas. Esta decisão substitui o plano anterior desta change para descarregar e aplicar atualizações automaticamente.

## What Changes

- Scripts Linux/macOS e Windows consultam a última GitHub Release publicada, verificam SHA-256 do instalador e instalam ou reinstalam a versão obtida. Linux usa AppImage e cria entrada de menu; macOS usa DMG; Windows usa NSIS.
- A aplicação empacotada consulta a release no arranque e a cada seis horas. Se for mais recente, apresenta faixa persistente com ligação e instrução para atualizar manualmente. Não descarrega nem executa instaladores em segundo plano.
- O workflow de release anexa manifesto SHA256SUMS para os seis instaladores, mantendo a release em rascunho até publicação manual.
- README e documentação explicam todas as vias de instalação e que a atualização é manual em todas elas.

## Capabilities

### New Capabilities
- desktop/updates: instalação por script e aviso persistente de nova versão, com atualização manual.

## Impact

Processo principal e preload do Electron, shell e catálogos pt-BR/en, scripts, workflow e documentação. Não exige electron-updater, feeds latest*.yml, assinatura, notarização nem serviço adicional.

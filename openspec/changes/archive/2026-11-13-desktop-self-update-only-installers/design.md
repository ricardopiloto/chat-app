# Design

## Context

See `proposal.md` — Why. Hoje `frontend/electron-builder.yml` declara targets Linux `AppImage|deb|rpm`, Windows `nsis|msi`, macOS `dmg`. O workflow `.github/workflows/desktop-release.yml` empacota esses seis formatos e o job `release` exige exactamente 6 ficheiros no `SHA256SUMS`. O runtime já distingue auto vs notify em `frontend/electron/updateMode.ts` (NSIS = `Uninstall Parley.exe`; AppImage gravável via `APPIMAGE`; resto = notify, incluindo macOS). Scripts `scripts/install-mesa.sh` / `install-mesa.ps1` já escolhem só AppImage e NSIS.

## Goals / Non-Goals

**Goals:**
- Publicar só AppImage, NSIS e DMG.
- Manter feeds `latest.yml` / `latest-linux.yml` e o comportamento de updateMode sem regressão para NSIS/AppImage/macOS.
- Documentar a migração a partir de deb/rpm/MSI.

**Non-Goals:**
- Assinar/notizar macOS ou activar auto-update no DMG.
- Remover lógica de cleanup legado Mesa (`.deb`/`.rpm` antigos `mesa-chat-app`).
- Alterar o marketing home além de texto que ainda cite deb/rpm/msi.
- Mudar a API do backend ou a lógica de toast/update no renderer.

## Decisions

### D1 — Remover targets no electron-builder e no CLI do workflow

Alterar `linux.target` para só `AppImage`, `win.target` para só `nsis`, manter `mac.target: dmg`. Remover blocos `deb:` / `rpm:` se ficarem órfãos. No workflow: `--linux AppImage`, `--win nsis`; artefactos sem `*.deb`/`*.rpm`/`*.msi`; drop do `apt-get install rpm` no job Linux.

Alternativa rejeitada: continuar a construir deb/rpm/msi mas não os anexar — desperdiça CI e ainda gera confusão se alguém baixar dos artifacts do `workflow_dispatch`.

### D2 — SHA256SUMS passa a 3 instaladores

No job `release`, o `find` deixa de incluir deb/rpm/msi; a asserção muda de 6 para 3. Mensagens de erro actualizadas.

### D3 — Runtime updateMode: sem mudança funcional obrigatória

`resolveUpdateMode` já trata MSI como notify (ausência de `Uninstall Parley.exe`). Deb/rpm já caem em notify. Manter cenários de instalação legada documentados no spec; não é necessário código novo salvo testes/docs se algum teste assumir artefacto MSI.

### D4 — Documentação e README

Actualizar `docs/desktop-release.md`, tabela de plataformas no `README.md`, e menções em `docs/arquitetura-tecnica.md` se citarem seis instaladores / deb / rpm / MSI. Marketing: links genéricos à página de releases — só corrigir copy se nomear formatos removidos.

### D5 — Migração de utilizadores

Não há desinstalador automático forçado. Docs/README dizem: Linux → AppImage (preferir o script); Windows MSI → reinstalar com NSIS; remoção manual do pacote antigo fica a cargo do utilizador.

## Risks / Trade-offs

- **Utilizadores MSI/deb/rpm** deixam de receber pacotes no formato antigo; mitigação: aviso na release notes / changelog e README.
- **Empresas que preferiam MSI silencioso** perdem esse canal; trade-off aceite (self-update > silent MSI sem updater).
- **Contagem SHA256SUMS** errada se alguém reintroduzir targets sem actualizar o job — o assert de 3 falha cedo.

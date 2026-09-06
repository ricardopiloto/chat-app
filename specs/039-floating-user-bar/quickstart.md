# Quickstart: 039-floating-user-bar

## Prerequisites

- App local (`npm run dev` + backend).
- Conta autenticada; servidor com canal de texto + voz.
- Opcional: segunda conta para validar áudio/deafen.

## 1. Painel de identidade (US1)

1. Em qualquer ecrã autenticado, ver painel no **fundo da sidebar**: avatar, online, handle.
2. Clicar avatar/nome → menu de conta (foto / sair da sessão).
3. Confirmar que o **TopBar já não** tem o chip/menu de conta duplicado.
4. Mudar de servidor/canal: painel permanece sem «piscar» de remount óbvio.

## 2. Fora de chamada (disabled)

1. Sem estar em voz: controlos mic/deafen/câmara/sair **visíveis e desabilitados**; clique sem efeito.

## 3. Chamada no palco (US2/US3)

1. Entrar na mesa de voz.
2. Barra de utilizador: **sem** grupo de controlos de chamada (só identidade/definições).
3. Palco: mic (com aura 036 se aplicável), câmara+blur, **deafen**, Sair — todos funcionais.

## 4. Chamada fora do palco (US2/US3)

1. Sem Sair, abrir um canal de texto.
2. Barra: controlos **activos**; palco não está visível como sítio dos botões.
3. Mutar mic na barra → estado reflectido (roster / voltar ao palco).
4. Activar deafen → deixa de ouvir; mic muta; desmutar mic → deafen off.
5. Câmara + blur na barra; Sair na barra → chamada termina; controlos voltam a disabled.
6. PiP / connected-bar: conforme 038/040 em vigor — não bloquear este quickstart; hangup canónico off-stage = barra.

## 5. Ida e volta palco ↔ texto (SC-007)

Repetir 5×: palco → texto → palco. Em cada passo, controlos activos só num sítio.

## Automated

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Contratos: [contracts/](./contracts/). Modelo: [data-model.md](./data-model.md).

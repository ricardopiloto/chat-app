# Quickstart: 020-call-control-icons

Validação manual da barra de chamada. Ver [contracts/call-control-chrome.md](./contracts/call-control-chrome.md).

## Pré-requisitos

- App a correr (`npm run dev` + backend).
- Conta com canal de voz; entrar na chamada (câmara/microfone disponíveis se possível).
- Alternar tema claro/escuro no topbar.

## §1 Microfone icon-only + tooltip

1. Na barra, confirmar: **sem** texto «Microfone»; só ícone.
2. Pairar ~1 s: tooltip «Microfone ligado» ou «… desligado».
3. Clicar: ícone e tooltip actualizam; áudio liga/desliga como antes.

## §2 Câmara icon-only + split Discord

1. Bloco câmara: **um** contentor arredondado, ícone | linha | seta; **sem** «Câmara».
2. Pairar no ícone: tooltip ligada/desligada.
3. Clique no ícone: toggle câmara; clique na seta: menu blur (Sem / Leve / Forte) sem toggle.
4. Com blur activo, indicador na seta (forma) permanece.

## §3 Sair vermelho

1. Botão mostra hangup + «Sair» com **fundo vermelho** (não acento primary).
2. Verificar em tema claro e escuro (contraste).
3. Clicar: sai da chamada.

## §4 Regressão rápida

- Gravar (se admin) e linha E2EE inalterados.
- Microfone e Sair **sem** chevron/split.

## Automação

```bash
cd frontend && npx tsc --noEmit
```

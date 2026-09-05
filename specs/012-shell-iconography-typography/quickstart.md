# Quickstart: 012-shell-iconography-typography

Validação manual do sistema de ícones, tipografia e das novas funções da topbar. Sem migração DB, sem mudanças de backend — basta correr o frontend contra um backend já a funcionar (ver README).

## Pré-requisitos

- Backend + frontend a correr (ver `README.md`).
- Conta autenticada, membro de ≥2 servidores (para validar o âmbito da pesquisa), cada um com ≥1 canal de texto e ≥1 de voz.
- Um segundo utilizador/sessão para gerar mensagens num canal que não está aberto (testar notificações).

## 1. Ícones de navegação (Sidebar)

1. Abrir um servidor com canais de texto e de voz.
2. **Esperado**: canais de voz mostram `IconVoiceChannel` no lugar do antigo `▸`; canais de texto continuam com `#`.
3. Como dono do servidor, olhar os botões de criar canal.
4. **Esperado**: `IconPlus` nítido, mesmo tamanho/alinhamento em tema claro e escuro (alternar em Definições — passo 5).
5. Reduzir a janela para <900px e abrir o menu de navegação.
6. **Esperado**: `IconMenu` no lugar de `☰`.

## 2. Controlos de chamada ativa

1. Entrar num canal de voz.
2. Alternar o microfone várias vezes.
3. **Esperado**: o botão mantém a mesma largura e o mesmo rótulo de texto (num só idioma) em ambos os estados; só o ícone (`IconMicOn`/`IconMicOff`) muda de forma.
4. Repetir para a câmara (`IconCameraOn`/`IconCameraOff`).
5. Verificar o botão "Sair" — `IconPhoneHangup` visível junto ao rótulo.
6. Com um leitor de ecrã (ou inspecionando `aria-label` no DevTools), confirmar que o nome acessível do botão muda entre "Microfone ligado"/"Microfone desligado" mesmo com o rótulo visível fixo.

## 3. Indicador de E2EE

1. No canal de texto, observar o chip de E2EE no cabeçalho.
2. **Esperado**: `IconLockClosed` visível junto ao texto "E2EE activa".
3. No canal de voz, com E2EE ativa, confirmar o mesmo ícone no chip do cabeçalho.
4. Iniciar "Gravar cena" (desliga E2EE temporariamente) e observar o banner de aviso.
5. **Esperado**: `IconLockWarning` (forma distinta do cadeado fechado) no banner.

## 4. Pesquisa (topbar)

1. Clicar o ícone de pesquisa (`IconSearch`) na topbar.
2. Escrever uma palavra presente numa mensagem de um servidor onde o utilizador é membro.
3. **Esperado**: resultado aparece, com navegação para o canal/mensagem ao clicar.
4. Escrever uma palavra que só existe numa mensagem de um servidor ao qual este utilizador **não** pertence (usar o segundo utilizador para o confirmar previamente).
5. **Esperado**: zero resultados desse servidor — a pesquisa nunca sai da visibilidade do utilizador (FR-014).

## 5. Notificações (topbar)

1. Com o Utilizador A num canal de texto X, ter o Utilizador B enviar uma mensagem num canal Y diferente do mesmo servidor.
2. **Esperado**: `IconBell` do Utilizador A mostra um indicador de atividade nova.
3. Utilizador A abre o canal Y.
4. **Esperado**: indicador desaparece (canal Y removido do conjunto de "não vistos").
5. Recarregar a página (F5) sem nova atividade.
6. **Esperado**: indicador não reaparece — o estado é só da sessão anterior, não persiste (comportamento documentado, não é um bug).

## 6. Definições (topbar)

1. Clicar o ícone de definições (`IconSettings`).
2. **Esperado**: painel com o seletor de tema (Escuro/Claro) e a opção de terminar sessão — nada disto solto na topbar.
3. Clicar no chip de utilizador (fora do painel).
4. **Esperado**: já não termina sessão só com um clique — abre o mesmo painel de definições.
5. Trocar de tema dentro do painel.
6. **Esperado**: aplica-se instantaneamente, como hoje.

## 7. Tipografia monoespaçada

1. Criar um canal de voz (ou servidor novo) e observar a chave de mídia mostrada para backup.
2. **Esperado**: tipo de letra monoespaçado; comparar visualmente `0` vs `O` e `1` vs `l` vs `I` — devem ser distinguíveis.
3. Abrir o painel de membros e observar os handles.
4. **Esperado**: mesmo tipo de letra monoespaçado.
5. Gerar um convite e observar o código/URL apresentado.
6. **Esperado**: mesmo tratamento tipográfico.

## 8. Hierarquia de headings

1. Abrir qualquer diálogo com título (ex.: "Criar servidor") e comparar visualmente o peso do título do diálogo com um heading de secção menor.
2. **Esperado**: diferença de peso perceptível entre níveis, não apenas diferença de tamanho.

## 9. Checks rápidos

```bash
cd frontend && npx tsc --noEmit
# Alternar tema claro/escuro no painel de Definições e percorrer os passos 1–3 outra vez:
# todos os ícones devem manter contraste e legibilidade em ambos os temas.
```

Ver contratos: [icon-system.md](./contracts/icon-system.md), [topbar-functions.md](./contracts/topbar-functions.md), [typography-tokens.md](./contracts/typography-tokens.md).

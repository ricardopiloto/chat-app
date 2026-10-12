# Tasks

## 1. Cobertura e ambiente de comparação

- [x] 1.1 Criar em `docs/v2/fidelity/complete-visual-parity-reaudit-evidence/verification.md` a matriz das 31 entradas de `AUDIT-fidelity.md` §4, marcando 17 e 18 fora de escopo e listando os estados exigidos de cada entrada em escopo a partir das checklists das fases arquivadas. Verificar que cada entrada tem mockup, estados, critério de exclusão aplicável e espaço para capturas/tabela/classificação.
- [x] 1.2 Preparar frontend, backend descartável e dados de teste equivalentes aos mockups; configurar tema escuro, pt-BR e zoom 100%. Registrar commit/estado do código e dimensões reais das capturas no `verification.md`; verificar que uma captura inicial tem a largura do `screen.png` correspondente.
- [ ] 1.3 Preparar uma chamada de teste com duas contas e mídia de teste usando LiveKit, incluindo partilha de tela e mini-player. Verificar que é possível alternar composição/grade, abrir editor e capturar uma chamada em curso antes de iniciar a classificação das entradas 22–29.

## 2. Autenticação, shell e chat

- [ ] 2.1 Comparar e capturar as entradas 1–7 nos estados da matriz, incluindo login/registo, os três estados de desbloqueio, convite, shell/chat, pesquisa/notificações, lightbox e menu de conta/modal de saída. Preencher uma tabela `Elemento | Mockup | v2 | Observação` por estado; verificar que cada classificação liga às capturas corretas e ao `screen.png`.
- [ ] 2.2 Para qualquer deriva nas entradas 1–7, corrigir somente com tokens/ícones existentes e recapturar o estado afetado. Verificar na tabela a diferença antes/depois e que nenhuma entrada é **Fiel** enquanto houver elemento obrigatório ausente.
- [x] 2.3 Comparar a faixa fixa de identidade nos estados de shell em repouso e menu de conta aberto, incluindo nome e identificador, com o mockup correspondente. Guardar evidência lado a lado, token medido e tabela no registo; verificar o código atual após `user-panel-identity-parity` e não reutilizar a cor do menu para o shell sem comparação.

## 3. Administração, conta e fundação

- [ ] 3.1 Comparar e capturar as entradas 8–16, 19–21, 30 e 31, incluindo cada diálogo/estado próprio e a tela de Áudio e Vídeo separadamente da pré-entrada. Preencher tabelas por estado; verificar links de captura, largura de referência e classificações contra as checklists e exclusões existentes.
- [ ] 3.2 Corrigir e recapturar derivas comprovadas nas entradas do grupo 3 usando tokens/ícones existentes. Verificar que o registo aponta para a captura após a correção e que capturas partilhadas entre entradas só são usadas com equivalência demonstrada nas respectivas tabelas.

## 4. Voz em chamada e variantes

- [ ] 4.1 Capturar e comparar as entradas 22–29 numa chamada em curso: composição com o ícone “No banco”, dois layouts de editor, duas grades, duas variantes de partilha e mini-player. Preencher uma tabela por tela/estado; verificar cada referência ao mockup, captura na largura correta e classificação, sem usar a pré-entrada como substituto.
- [ ] 4.2 Corrigir e recapturar derivas comprovadas nas entradas 22–29 usando tokens/ícones existentes. Verificar o resultado visual após cada correção e registrar explicitamente qualquer estado impossível de reproduzir como **Não verificada**, com causa e pendência.
- [ ] 4.3 Percorrer manualmente pesquisa, alternador de tema, painel de utilizador e modo de composição durante a chamada após as correções. Registrar o resultado de cada interação no `verification.md`; verificar que continuam a abrir, alternar e operar como antes.

## 5. Fecho da reauditoria

- [ ] 5.1 Conferir a matriz contra os arquivos de captura e as tabelas de todas as entradas em escopo, e escrever a tabela final `Tela | Mockup | Captura | Classificação | Data`. Verificar que não há **Fiel** sem todos os estados e comparações exigidos, que bloqueios ficam como **Não verificada** e que o relatório de 2026-10-12 permanece intacto como histórico.
- [ ] 5.2 Executar `openspec validate complete-visual-parity-reaudit-evidence --strict` e as verificações de frontend pertinentes às correções feitas. Registrar os resultados no `verification.md`; concluir a change apenas se todas as entradas em escopo estiverem **Fiel** com evidência completa e sem regressões de comportamento.

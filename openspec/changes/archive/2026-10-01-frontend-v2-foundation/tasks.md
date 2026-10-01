# Tasks

## 1. Scaffold do projecto

- [x] 1.1 Criar `frontend-v2/` como projecto Vite+SolidJS+TS novo (`package.json`, `tsconfig.json` com strict, `noUncheckedIndexedAccess`, `jsxImportSource: solid-js`, escrito a partir dos requisitos e não copiado de `frontend/`) e verificar que `npm install` conclui sem erros
- [x] 1.2 Configurar `vite.config.ts` com `vite-plugin-solid` + `@vitejs/plugin-basic-ssl`, porto de dev diferente do `1420` da v1 (ex. `1421`), e um filtro de logger que silencia o erro benigno de proxy WS em dev (escrito de novo); verificar que `npm run dev` sobe um servidor HTTPS local sem interferir com a v1 a correr em paralelo
- [x] 1.3 Configurar `eslint.config.js` + Prettier a partir de um conjunto de regras próprio; verificar que `npm run lint` corre sem configuração quebrada
- [x] 1.4 Configurar Tailwind CSS (`tailwind.config`, `@tailwindcss/vite` ou PostCSS conforme a versão instalada) e verificar que uma classe utilitária Tailwind (ex. `bg-red-500`) renderiza correctamente numa página de teste

## 2. Tokens de design

- [x] 2.1 Extrair os valores de tokens de cor (dark) dos 29 mockups de produto em `docs/v2/mesa_*/code.html` (excluindo o guia de componentes divergente, conforme D3) para variáveis CSS em `:root` (ou equivalente com atributo de tema), e verificar por inspecção visual que os valores batem com pelo menos 3 mockups de referência (ex. shell+chat, autenticação, ACL de canal)
- [x] 2.2 Definir os valores de tokens de cor (light) — nenhum mockup os demonstra; derivar por extrapolação consistente da paleta dark (ex. inversão de luminância mantendo a mesma relação semântica primary/secondary/tertiary/error), documentando a escolha num comentário no ficheiro de tokens; verificar que activar o tema light não deixa nenhum token sem valor definido
- [x] 2.3 Definir tokens de tipografia (Plus Jakarta Sans / Inter / JetBrains Mono, tamanhos e pesos conforme `docs/v2/campfire_modernism/DESIGN.md`), espaçamento, raio (incl. ausência de um token de 16px dedicado identificada no TR — decidir manter a escala 4/8/12/pill ou adicionar 16px) e elevação/sombra; verificar que cada token tem pelo menos um uso de referência documentado
- [x] 2.4 Definir breakpoints responsivos (mobile <768px, tablet 768–1024px, desktop 1025px+) como tokens Tailwind (`theme.screens`) reutilizáveis por toda a app; verificar com uma página de teste que redimensionar a janela cruza os três breakpoints
- [x] 2.5 Registar todos os tokens acima em `tailwind.config` via `theme.extend`, apontando para as variáveis CSS de 2.1–2.4 (não valores Tailwind por omissão); verificar que uma classe Tailwind (ex. `bg-primary-container`) resolve visualmente para o token correcto em ambos os temas

## 3. Biblioteca base de componentes

- [x] 3.1 Configurar o carregamento da fonte de ícones Material Symbols Outlined (link/`@font-face`) e criar um componente wrapper `<Icon name="..." />`; verificar que renderiza pelo menos 5 ícones usados nos mockups (ex. `mic`, `search`, `settings`)
- [x] 3.2 Implementar componente Botão (variantes primário/secundário/perigo/ícone) consumindo os tokens de 2.x; verificar cada variante nos dois temas numa tela de verificação
- [x] 3.3 Implementar componentes de formulário: campo de texto, radio, checkbox, switch, select; verificar estados focus/disabled/error de cada um nos dois temas
- [x] 3.4 Implementar Diálogo/Modal base (com fecho por Escape e por clique no backdrop, conforme a lacuna de backdrop-click identificada no TR para os mockups de produto — a base deve resolver isto correctamente mesmo que os mockups não demonstrem) e Toast; verificar abertura/fecho por teclado e por clique
- [x] 3.5 Implementar Menu de Contexto (posicionamento no cursor, variante `danger`) reutilizável por clique-direito e toque-longo (~500ms); verificar em desktop (clique-direito) e em viewport mobile emulado (toque longo)
- [x] 3.6 Implementar Avatar (com indicador de estado online/offline), Badge/Chip, Tooltip; verificar nos dois temas
- [x] 3.7 Criar uma rota/tela de verificação (`/__foundation`, não uma rota de produto) que renderiza todas as variantes de todos os componentes de 3.1–3.6 lado a lado, com um alternador de tema; verificar visualmente nos dois temas antes de fechar esta fase

## 4. Cliente de API e WebSocket

- [x] 4.1 Definir os tipos (`Account`, `Server`, `Channel`, `CreateServerBody`, etc.) em `frontend-v2/src/api/client.ts` a partir dos DTOs e rotas do backend (`backend/src`, `README.md`), como TypeScript puro sem import de `solid-js` e sem consultar `frontend/src/api`; verificar com `tsc --noEmit` que compila sem depender de nenhum módulo Solid
- [x] 4.2 Implementar as funções de chamada REST (os 59 endpoints documentados em `README.md`) preservando o formato de erro `{ "error", "code"?, "message"? }`; verificar manualmente com o backend actual a correr (`cargo run`) que `GET /api/auth/me` e `POST /api/auth/login` respondem como esperado a partir do cliente v2
- [x] 4.3 Implementar o cliente WebSocket a partir do protocolo do backend (envelope `{ "event", "server_id"?, "payload" }` e mesmo conjunto de eventos); verificar que uma ligação a `GET /ws` recebe e desserializa correctamente um evento `presence.update` emitido pelo backend actual
- [x] 4.4 Instalar e configurar `@tanstack/solid-query`, criando um `QueryClientProvider` na raiz da app; verificar com uma query de exemplo (ex. `GET /api/auth/me`) que o estado de loading/sucesso/erro é exposto correctamente por cima do cliente puro de 4.1–4.2

## 5. Motor de i18n

- [x] 5.1 Desenhar e implementar de raiz o motor de i18n em `frontend-v2/src/i18n/` (locale reactivo, idiomas suportados, detecção de idioma do navegador, preferência persistida); verificar que o idioma detectado por omissão corresponde ao idioma do navegador de teste
- [x] 5.2 Criar `catalogs/pt-BR.ts` e `catalogs/en.ts` com apenas a árvore de chaves necessária para a tela de verificação de 3.7 (rótulos dos componentes de exemplo); verificar que alternar entre pt-BR e en na tela de verificação troca os textos sem recarregar a página
- [x] 5.3 Implementar fallback para chave de tradução em falta (retorna um valor de recurso em vez de falhar); verificar removendo temporariamente uma chave de um catálogo e confirmando que a UI não quebra

## 6. Verificação de fundação completa

- [x] 6.1 Rodar `npm run build` em `frontend-v2/` e verificar que a build de produção conclui com sucesso, sem qualquer referência a caminhos dentro de `frontend/`
- [x] 6.2 Rodar `frontend-v2/` (`npm run dev`) e, como caixa-preta de comparação de comportamento, a v1 simultaneamente e verificar que ambos funcionam sem conflito de porto ou de processo
- [x] 6.3 Confirmar que nenhum ficheiro dentro de `frontend/` foi criado, alterado ou apagado durante o trabalho desta fase (`git status frontend/` sem alterações)

## 7. Independência da v1 e contratos

- [x] 7.1 Escrever `frontend-v2/scripts/check-v1-overlap` (sequências de 6 tokens, sem comentários nem espaços, `frontend-v2/src` vs `frontend/src`) com os limiares de D7 e saída por ficheiro; verificar que um ficheiro de teste copiado da v1 é reprovado e um ficheiro novo é aprovado
- [x] 7.2 Executar o script sobre o estado actual de `frontend-v2/src`, registar a linha de base em `verification.md` e usá-la como lista dos ficheiros a reescrever nas fases seguintes
- [x] 7.3 Produzir `docs/v2/contracts/crypto-formats.md` (cofre de identidade, envelope de chave de servidor, chave de canal, cifra de mensagem, cifra de anexo, parâmetros Argon2id/AES-GCM/NaCl) e `docs/v2/contracts/vectors/` com vectores gerados pela aplicação em produção usada como oráculo; verificar que cada formato tem ao menos um vector de decifra e um de cifra reproduzível
- [x] 7.4 Implementar o harness de testes de contrato (executável sem navegador) que valida qualquer implementação de formato contra `docs/v2/contracts/vectors/`; verificar que falha com um vector adulterado

## 8. Fidelidade visual, marca e identidade

- [x] 8.1 Criar o modelo de tabela de comparação de fidelidade (elemento, presente/ausente, observação, classificação) e o protocolo de captura de referência (tema escuro, largura do `screen.png`) em `docs/v2/fidelity-protocol.md`; verificar aplicando-o à tela `/__foundation`
- [x] 8.2 Aplicar o logo de `docs/v2/mesa_logo` (componente `Logo`, favicon) e verificar que nenhum ecrã usa o quadrado provisório
- [x] 8.3 Implementar a camada técnica dos mockups na biblioteca base: variantes mono de `Badge`/`Chip` (estado, E2EE, AO VIVO, papel) e utilitário de rótulo mono em caixa alta; verificar nos dois temas contra `mesa_sistema_de_design_tokens_componentes_guia_de_ui`
- [x] 8.4 Rever a biblioteca base contra o guia de componentes (`mesa_sistema_de_design_tokens_componentes_guia_de_ui`): toggles (não checkbox) para interruptores, botões em pílula com ícone, cartões com cabeçalho (ícone + rótulo + título), selector segmentado; verificar a presença de cada variante em `/__foundation`

## 9. Paridade funcional e política de backend

- [x] 9.1 Produzir `docs/v2/parity-checklist.md`: inventário numerado de todas as funcionalidades actuais (fontes: `docs/design-system/stitch-prompt.md` §3, `README.md`, rotas em `backend/src/api`, observação da v1 em execução), cada uma com fase responsável e critério de verificação; verificar que cada endpoint REST e cada evento WS mapeia a pelo menos uma funcionalidade
- [x] 9.2 Marcar na checklist os itens excluídos do escopo (TR §4.2 e §7) com a referência da exclusão; verificar que não há itens sem fase nem sem critério
- [x] 9.3 Registar em `docs/v2/contracts/` a política de alteração de backend (aditiva, retrocompatível, com tarefa própria, testes `cargo test`) e o modelo de entrada de alteração

## 10. Portão de aceite da fase

- [x] 10.1 Executar o script de 7.1 sobre os ficheiros desta fase e confirmar que cumprem os limiares (ou que as excepções estão justificadas)
- [x] 10.2 Registar em `verification.md` a classificação **Fiel** da tela `/__foundation` contra o guia de componentes
- [x] 10.3 Confirmar que `docs/v2/parity-checklist.md` não tem itens sem fase e que os itens desta fase estão verificados

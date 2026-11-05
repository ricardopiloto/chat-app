# Parley: telas de entrada e fidelidade

As telas web e desktop seguem `propostas/parley-home/index.html`, `propostas/parley-electron/index.html` e `propostas/parley-electron/conta-salva.html`. Capturas e medições de 390, 768 e 1280 px estão em `docs/design-ref/parley-entry-captures/` (WebP; lado a lado com os protótipos e uma captura por estado, tema e largura).

| Diferença do protótipo | Implementação | Motivo |
| --- | --- | --- |
| Cantos de 9 px | Botão em pílula | Design system atual |
| Creme próprio | Tokens de superfície e texto | Design system atual |
| Tema em `select` | Alternadores de tema e idioma | Preferência já existente |
| Barra de título própria | Decoração nativa | Shell desktop existente |
| E-mail no login | Handle e senha | Contrato de autenticação |
| Recuperação escondida sob ajuda | Recuperar identidade visível | Requisito de segurança do fluxo |
| Título «Bom ter você de volta.» e conta com e-mail | «Que bom te ver de volta» e conta com @handle | Texto próprio do produto; o contrato de login usa handle |
| Hero com ilustração própria | Print real do app com dados de demonstração | Decisão do autor (2026-11-04) |
| Dois painéis no login | Cartão único Entrar/Criar conta guiado por `registrationConfig().mode` | Decisão do autor (2026-11-04) |

## Afirmações de privacidade

| Texto publicado | Fonte | Avaliação |
| --- | --- | --- |
| Conversas com criptografia de ponta a ponta; servidor não lê o conteúdo | `docs/e2ee-gaps.md`, seção de handoff da chave; specs `frontend-v2/crypto` | Compatível com as mensagens cifradas e envelopes opacos documentados |
| Quem participa pode compartilhar ou gravar o que recebe | Limite inerente à criptografia de ponta a ponta; spec desta change `web-public-home` | Limitação explicitada na página e FAQ |
| Não há recuperação da chave por e-mail | `docs/e2ee-gaps.md`, seção de recuperação; spec `frontend-v2/auth` | Nenhuma promessa de recuperação por e-mail na página |

Não há promessa de anonimato nem de ausência de registros. Os textos foram limitados às capacidades documentadas.

## Verificação no navegador (2026-11-04)

Instâncias descartáveis (banco e portas próprios, build de produção servido por `vite preview`), Chromium via `playwright-core` e, para o desktop, a ponte nativa simulada e o Electron 38 real (`electron/dist/main.js`, `mesa://app`, dados isolados).

| Verificação | Resultado |
| --- | --- |
| Web: `/` página pública, primeira conta, `?invite=`, token inválido, `/recover`, `/invite/…`, registro aberto (e-mail) e fechado (convite), 390/768/1280 px | 26 de 26 |
| Estado da instância lento (>3 s), `429`, `initial_setup:true` tardio | página pública mantida / troca para o cadastro inicial |
| Alturas dos controles (login, cadastros, recuperação, primeira conta, página pública, desbloqueio), 3 larguras, 2 temas | 50 px, diferença 0 |
| Alternadores de tema e idioma | 36 px, raio total |
| Contraste de texto da página pública (WCAG AA), tema claro e escuro | nenhum texto abaixo do mínimo |
| Teclado na página pública | link de salto primeiro, 19 focos com indicador visível, alcança o rodapé |
| Desktop simulado: tela inicial, diálogo de instância, cadastro por e-mail, logout, desbloqueio de conta salva, «Usar outra conta ou instância» | 11 de 11 |
| Desbloqueio (web): senha incorreta, recuperar identidade com confirmação, «Trocar de conta» → `/login` | verificado |
| Electron real: tela inicial, diálogo ao primeiro início, `http` e endereço inacessível, link «Conheça o Parley» entregue ao navegador do sistema sem trocar a janela | 8 de 8 |

Achados corrigidos durante a verificação: altura de 48 × 50 px nos controles; botão «Recuperar identidade» quebrando linha (58 px); cache de `initial_setup:true` mostrando o cadastro inicial depois de criada a primeira conta; painel da instância duplicado no desbloqueio do desktop; «Voltar ao início» sem componente do sistema.

Limites conhecidos: o link recebido por e-mail dentro do Electron real e o estado de cofre ausente não foram exercitados; o Electron real foi verificado com instância sem HTTPS válido (endereço de teste), então o fluxo completo de login nele depende de uma instância HTTPS confiável.

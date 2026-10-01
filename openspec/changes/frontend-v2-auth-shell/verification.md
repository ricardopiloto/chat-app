# Verificação da implementação

Por instrução do utilizador, o agente não realiza validações que requerem navegador. Todas as validações visuais ficam a cargo do utilizador. As tarefas com verificações de navegador permanecem abertas até confirmação; isso não indica necessariamente implementação em falta.

## Verificado sem navegador

- Build TypeScript/Vite e ESLint.
- Round-trip NaCl → Argon2id/AES-GCM → chave secreta original.
- Senha incorreta produz `IdentityUnlockError("bad_password")`.
- Cofre gerado pelo código v1 é aberto pela v2. Não equivale ao teste com conta v1 em 1.3.
- Eventos WS por canal preservam outros canais ocupados; esvaziar o último remove o indicador.
- Nome de exibição usa `PATCH /api/auth/display-name`, conforme o contrato real, apesar da tarefa citar PUT.
- Nenhuma alteração em `frontend/`.

## Implementação entregue

Autenticação, desbloqueio, recuperação com aviso antes de substituir chaves, navegação por URL, sidebar, estados vazios, topbar, temas, conta e gaveta mobile. Shell permanece montado entre rotas, preservando os indicadores. Nome de exibição salvo permanece separado do rascunho; falha no logout preserva a sessão. Ocupação inicial via REST e atualizações por canal via WS.

## Dependência

O backend exige `invite_code` após a primeira conta. O plano não inclui convite. O utilizador autorizou a extensão: campo editável, preenchimento por URL e envio de `invite_code` implementados. A validação do fluxo no navegador permanece com o utilizador.

## Validações do utilizador

- [ ] Conta v1 e desbloqueio na v2 (1.3).
- [ ] Cadastro/login local e estados de desbloqueio: remoto, ausente e senha errada (2.1–2.2).
- [ ] Navegar entre dois servidores/canais; conferir cadeado e estado vazio (3.1–3.3).
- [ ] Entradas de pesquisa/notificações e novidades (4.1).
- [ ] Três temas, persistência e mudança do sistema (4.2).
- [ ] Contraste do shell completo no tema claro (4.3).
- [ ] Nome, avatar, idioma e cancelar/confirmar logout (5.2).
- [ ] Gaveta/backdrop e redimensionamento pelo breakpoint de 768px (6.1–6.2).
- [ ] Novo dispositivo, cofre remoto e inspeção de rede sem chave secreta em claro (7.1).

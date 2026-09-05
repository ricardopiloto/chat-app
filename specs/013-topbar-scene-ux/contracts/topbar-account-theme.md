# Contrato: Tema e menu de conta na TopBar

Âmbito: `frontend/` apenas. Reutiliza:

- `theme/theme.ts` (`resolveTheme`, `writeTheme`, `applyTheme`)
- `POST /api/auth/logout` (via `onLogout` já passado à `TopBar`)
- `Account.handle` já carregado no shell

## Toggle de tema

1. A topbar expõe um botão (não um segmento Escuro/Claro de dois botões).
2. O ícone reflecte o **tema actual**: claro → `IconSun`; escuro → `IconMoon`.
3. Um clique alterna para o outro tema, persiste com `writeTheme`, aplica com `applyTheme` no `.app`.
4. `aria-label` deve descrever a acção ou o estado de forma acessível (ex. «Tema escuro» / «Tema claro» conforme o actual).
5. Não existe controlo de tema em painel de Definições (removido).

## Menu de conta

1. Clique no `user-chip` abre um menu flutuante ancorado (não navega; não faz logout).
2. O menu mostra o **handle/nome em só leitura** e a acção **Terminar sessão**.
3. Escape ou clique fora fecha o menu sem terminar sessão.
4. «Terminar sessão» abre um **diálogo de confirmação**; só a confirmação explícita chama `onLogout`.
5. Cancelar o diálogo mantém a sessão e o shell autenticado.

## Definições (012) — remoção

1. Não há botão `IconSettings` na topbar.
2. Não há `SettingsPanel` montado.
3. Tema e sessão não têm outra entrada canónica nesta entrega além do toggle e do menu de conta.

# Quickstart: 013-topbar-scene-ux

Validação manual da topbar refinada e do layout do editor de cena. Sem migração DB; backend inalterado.

## Pré-requisitos

- Backend + frontend a correr (`README.md`).
- Conta autenticada; ≥1 servidor com canal de texto e canal de voz (com cena editável / admin).
- Preferência: ter usado a app em tema escuro e claro pelo menos uma vez.

## 1. Toggle de tema

1. Na topbar, localizar o botão de tema (ícone sol ou lua).
2. Se o tema actual é escuro, **esperado**: ícone lua; clicar → UI clara e ícone passa a sol.
3. Clicar de novo → escuro + lua.
4. Recarregar (F5) → tema e ícone permanecem alinhados à última escolha.
5. **Esperado**: não há segmento «Escuro/Claro» nem painel de Definições com tema.

## 2. Menu de conta e logout

1. Clicar no chip do utilizador (canto superior direito).
2. **Esperado**: menu flutuante com handle/nome (só leitura) + «Terminar sessão»; sessão ainda activa.
3. Clicar fora ou Escape → menu fecha; sessão continua.
4. Abrir menu → Terminar sessão → **diálogo de confirmação**.
5. Cancelar → sessão continua.
6. Repetir e confirmar → sessão termina; shell autenticado desaparece.

## 3. Definições removidas

1. Percorrer a topbar.
2. **Esperado**: sem ícone de engrenagem/Definições; sem `SettingsPanel`.

## 4. Pesquisa inline

1. Em repouso, ver ícone de pesquisa (campo ainda não expandido).
2. Clicar o ícone → campo de texto **na topbar** recebe foco (sem Dialog modal para digitar).
3. Digitar 1 carácter → sem pesquisa completa.
4. Digitar ≥2 caracteres de uma mensagem conhecida → resultados sob/anexados ao campo.
5. Clicar um resultado → navega para o canal; pesquisa recolhe.
6. Escape com campo aberto → recolhe sem modal residual.

## 5. Editor de cena (layout)

1. Entrar num canal de voz como admin e abrir «Editar cena».
2. Em janela larga (≥1200px): **esperado** pré-visualização ampla à esquerda + coluna lateral (~296px) com layout/banco; preenche o painel (não um cartão minúsculo centrado).
3. Confirmar Descartar/Salvar visíveis no cabeçalho.
4. Reduzir a janela → conteúdo ainda utilizável (stack/scroll).
5. Comparar mentalmente com o ecrã «Editor de cena (admin)» do Protótipo v2.

## 6. Checks rápidos

```bash
cd frontend && npx tsc --noEmit
```

Ver contratos: [topbar-account-theme.md](./contracts/topbar-account-theme.md), [inline-search.md](./contracts/inline-search.md), [scene-editor-layout.md](./contracts/scene-editor-layout.md).

# Tasks

## 1. `Unlock.tsx` — simplificar o ecrã de retorno

- [x] 1.1 Remover a caixa "Vault notice" sempre visível; mostrar o aviso (`unlock.noticeBody`/`unlock.noticeMissing`) só quando `noLocalCopy()` for verdadeiro.
- [x] 1.2 Substituir o cartão "Recover identity" (título + texto + botão) por um link secundário sob o botão "Unlock", que abre o `Dialog` de confirmação já existente. Manter acessível o texto `auth.forgotVaultHelp`, hoje mostrado dentro do cartão: movê-lo para o `Dialog`, onde fica a explicação completa.
- [x] 1.3 Unificar o botão "Use another account or instance" do cartão de instância com o link de rodapé "Not @handle? Switch account" (ambos chamam `switchAccount()`) num só controlo: fica como link de texto no rodapé, na mesma posição onde já está hoje "Not @handle? Switch account" — não como botão novo nem numa posição nova. Manter como link separado, só nativo, a acção "Switch account (ends this session)" (`instance.switch`, que chama `clearInstance()`) — é uma acção distinta (esquecer a instância guardada neste dispositivo), não deve ser fundida com a anterior.
- [x] 1.4 Ajustar `frontend/src/i18n/catalogs/en.ts` e `frontend/src/i18n/catalogs/pt-BR.ts`: remover/ajustar chaves do bloco `unlock.*` que deixarem de ser usadas (ex. `unlock.noticeTitle` se a caixa for removida visualmente), mantendo as chaves ainda referenciadas.
- [x] 1.5 Verificação manual (backend+frontend descartáveis num browser headless real, não só leitura de código), confirmando literalmente os cenários de `frontend-v2/entry-screens`: (a) utilizador com vault local — caixa de aviso ausente, confirmado por screenshot; (b) vault local apagado (IndexedDB `chat-identity`) mantendo a sessão do servidor — caixa de aviso aparece com o texto correcto, confirmado por screenshot; (c) cenário "Recuperação continua acessível" — o link "Recover identity" está sempre visível (sem tentativa de senha falhada) e abre o `Dialog` com os três parágrafos (`unlock.recoverText`, `auth.forgotVaultHelp`, `auth.recoveryWarning`), confirmado por screenshot; (d) cenário "Trocar de conta" — `switchAccount()`/logout terminou a sessão e `/login` abriu normalmente (verificado na web; a variante nativa de `nativeEntry`/nativeinstância não foi exercida por não haver build Electron empacotado neste ambiente — risco residual baixo, a lógica de `clearInstance()`/`instance.switch` não foi tocada pelo diff).
- [x] 1.6 Regressão: `npm run build`, `npm run verify:i18n-keys` (confirma que nenhuma chave `unlock.*` removida na 1.4 ficou órfã num só idioma) e `npm run verify:entry-screens` (confirma o guard "sistema de design não alterado" — `tokens.css`/`tailwind.config.ts`/`components/ui.css`/`components/ui/` sem diff).
- [x] 1.7 Confirmar visualmente o `Unlock.tsx` a 360px de largura depois da consolidação dos cartões (1.1–1.3) — screenshot a 360px confirma sem overflow nem quebra, nos dois casos (com e sem aviso de vault).

## 2. `Auth.tsx` — ecrã de logon

- [x] 2.1 Remover a linha de rodapé "protocolo/cifra" (`auth.protocol`/`auth.cipher`) do formulário quando `mode() === "login"`; decidir e documentar no `design.md` se também sai do modo registo.
- [x] 2.2 Confirmar visualmente a 360px de largura que a remoção não introduz espaço vazio ou salto de layout — screenshot a 1280px e 360px confirma: a linha "NaCl box · Argon2id / AES-256-GCM" está ausente no modo login (termina limpo após o botão "Create a new account") e presente no modo registo, sem espaço vazio nem salto em nenhuma largura.

## 3. Revisão

- [x] 3.1 Revisão dupla dos artefactos e, depois de implementado, do código resultante (arquiteto + fullstack — skills `spec-review-architect` / `spec-review-fullstack`). Achado bloqueante da primeira passagem (referência de capacidades) corrigido via `/opsx:update`; pós-implementação sem novos achados — ver `review-architect.md`/`review-fullstack.md`.
- [x] 3.2 `openspec validate simplify-entry-screens --strict`.

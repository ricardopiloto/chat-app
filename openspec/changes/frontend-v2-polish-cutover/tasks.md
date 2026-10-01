# Tasks

## 1. Auditoria de modo claro

- [ ] 1.1 Percorrer autenticação e shell (Fase 1) em modo claro, corrigindo qualquer defeito de contraste/legibilidade encontrado além do que a revisão da própria Fase 1 já cobriu
- [ ] 1.2 Percorrer administração de servidor e canal (Fase 2) em modo claro — membros, cargos/permissões, imagem/boas-vindas/apagar, ACL de canal, convites
- [ ] 1.3 Percorrer chat de texto (Fase 3) em modo claro — mensagens, composer, lightbox, pesquisa, notificações
- [ ] 1.4 Percorrer voz/vídeo (Fase 4) em modo claro — pré-entrada, Composição, editor de cena, Grade, PiP, faixa de E2EE desligada
- [ ] 1.5 Verificar que todos os tokens de cor claros usados vêm do conjunto definido na Fase 0 (nenhum valor ad-hoc introduzido durante as correcções desta fase)

## 2. Auditoria de responsividade mobile

- [ ] 2.1 Percorrer autenticação e shell em viewport <768px, além da verificação de drawer já feita na Fase 1
- [ ] 2.2 Percorrer administração de servidor e canal em viewport <768px — confirmar que formulários e tabelas (ex. lista de membros) não exigem scroll horizontal
- [ ] 2.3 Percorrer chat de texto em viewport <768px — composer, autocompletes, lightbox
- [ ] 2.4 Percorrer voz/vídeo em viewport <768px — grelhas de câmara, editor de cena, PiP
- [ ] 2.5 Corrigir cada defeito de sobreposição, scroll horizontal não intencional, ou controlo inacessível ao toque encontrado em 2.1–2.4

## 3. Paridade de i18n

- [ ] 3.1 Extrair todas as chaves de texto realmente usadas em `frontend-v2/src` e comparar com `catalogs/pt-BR.ts` e `catalogs/en.ts`; listar chaves em falta em qualquer um dos dois
- [ ] 3.2 Preencher todas as chaves em falta identificadas em 3.1, com revisão de qualidade da tradução (não só texto de preenchimento)
- [ ] 3.3 Verificar que nenhuma tela depende do fallback de chave em falta (Fase 0, requisito de fallback) em uso normal — o fallback deve ficar reservado a casos excepcionais, não a lacunas conhecidas

## 4. Checklist de paridade funcional

- [ ] 4.1 Percorrer `docs/v2/parity-checklist.md` e `docs/design-system/stitch-prompt.md` §3 item a item, marcando cada funcionalidade como verificada presente e funcional em `frontend-v2` contra a aplicação anterior, ou como uma lacuna a resolver antes do corte
- [ ] 4.2 Resolver qualquer lacuna encontrada em 4.1 antes de prosseguir para o corte
- [ ] 4.3 Confirmar que nada do escopo excluído (`docs/backlog/backlog.md`, MLS/multi-dispositivo/Passkeys do TR §7) foi introduzido acidentalmente em nenhuma fase

## 4A. Fidelidade, independência e backend

- [ ] 4A.1 Reavaliar as 31 entradas de `docs/v2/AUDIT-fidelity.md` §4 com o protocolo de `docs/v2/fidelity-protocol.md` e actualizar a tabela; qualquer tela em escopo abaixo de **Fiel** regressa à fase de origem e bloqueia o corte
- [ ] 4A.2 Verificar a presença do logo oficial e da camada tipográfica mono em todas as superfícies e a ausência de elementos excluídos (AUDIT §6)
- [ ] 4A.3 Executar `check-v1-overlap` sobre todo `frontend-v2/src`, anexar o relatório e justificar cada excepção; verificar que nenhum ficheiro referencia `frontend/`
- [ ] 4A.4 Listar as alterações de backend feitas durante a reescrita, confirmar que são aditivas, documentadas em `docs/v2/contracts/` e cobertas por `cargo test`, e que o rollback para `frontend/dist` continua válido com elas
- [ ] 4A.5 Confirmar que a fidelidade se mantém em modo claro e em viewport <768px nas telas Fiel (requisito de fidelidade preservada)

## 5. Corte de produção

- [ ] 5.1 Gerar a build de produção de `frontend-v2/` (`npm run build`) e verificar que `frontend-v2/dist/` é gerado sem erros
- [ ] 5.2 Actualizar a configuração Nginx (conforme `docs/deploy-producao.md`) para apontar `root` a `frontend-v2/dist` em vez de `frontend/dist`, mantendo a mesma origem/porta; verificar que o backend continua acessível sob a mesma origem
- [ ] 5.3 Verificar manualmente que uma sessão de utilizador criada antes do corte continua válida depois do corte (cookie de sessão preservado)
- [ ] 5.4 Verificar o caminho de rollback: reverter a configuração Nginx para `frontend/dist` e confirmar que a v1 volta a funcionar sem alteração de backend
- [ ] 5.5 Re-aplicar o corte (5.2) depois de validado o rollback, deixando `frontend-v2/dist` como a versão servida

## 6. Documentação

- [ ] 6.1 Actualizar `README.md` (incluindo a correcção já identificada na auditoria: "painel de membros" e "canais privados/permissões finas" já implementados, não mais listados em "O que ainda não é")
- [ ] 6.2 Actualizar `docs/operar-instancia.md` e `docs/deploy-producao.md` para referenciar `frontend-v2/` como o frontend de produção
- [ ] 6.3 Adicionar uma entrada no `CHANGELOG.md` documentando o corte para a v2

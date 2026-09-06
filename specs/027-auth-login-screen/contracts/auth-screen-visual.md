# Contrato: Tela de autenticação (visual)

Âmbito: `/auth` e chrome de `/invite/…`. Referência: [docs/screenshots/03-auth.jpg](../../../docs/screenshots/03-auth.jpg).

## Visual checklist (SC-001)

| # | Critério | Pass? |
|---|----------|-------|
| 1 | Fundo de página escuro | |
| 2 | Painel central com duas zonas (brand \| form) em desktop | |
| 3 | Marca Mesa (mark + nome) + tagline na zona esquerda | |
| 4 | Nota de instância self-hosted / sem federação na brand pane | |
| 5 | Abas Entrar / Criar conta no form pane | |
| 6 | Campos com afixos (@ / cadeado) | |
| 7 | Toggle mostrar/ocultar senha | |
| 8 | Botão primário roxo (Entrar / Cadastrar conforme modo) | |
| 9 | No modo Entrar: «ou» + botão outline Criar conta | |
| 10 | Sem link «Esqueceu sua senha?» | |
| 11 | Viewport estreito: formulário utilizável, sem scroll horizontal | |

Meta: ≥80% dos itens 1–11 em revisão.

## Comportamento

| Acção | Resultado |
|-------|-----------|
| Submit Entrar (creds OK) | Entra na app |
| Submit Entrar (creds bad) | Erro visível no form pane |
| Aba ou botão Criar conta | Modo registo |
| Submit registo permitido | Conta criada + entra |
| Unlock com sessão | Senha desbloqueia chaves; mesmo shell |
| `/invite/{code}` | Mesmo shell; aceitar/registar como hoje |

## Copy (sentido da referência; PT ok)

- Tagline ~ «Converse com foco. No seu servidor, do seu jeito.»
- Helper identificador ~ «Este será o seu @handle nesta instância.»
- Footer brand ~ instância self-hosted, sem federação.

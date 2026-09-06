# Quickstart: 027-auth-login-screen

Validação manual. Abrir [contracts/auth-screen-visual.md](./contracts/auth-screen-visual.md) ao lado de [docs/screenshots/03-auth.jpg](../../docs/screenshots/03-auth.jpg).

## Pré-requisitos

- Backend + `cd frontend && npm run dev`
- Conta de teste (ou instância vazia para primeiro registo)

## §1 Visual Entrar (US1)

1. Abrir `/auth` sem sessão (se necessário logout).
2. Confirmar checklist visual itens 1–10 no contrato (≥80%).
3. Entrar com credenciais válidas → shell autenticada.

## §2 Criar conta (US2)

1. Em Entrar, clicar aba **Criar conta** e (em modo Entrar) o botão outline sob «ou».
2. Registar conta permitida → sucesso.
3. Brand pane permanece visível.

## §3 Campos (FR-010)

1. Ver @ e cadeado nos campos.
2. Toggle senha: revelar e ocultar.

## §4 Erros / unlock (US3)

1. Credenciais erradas → mensagem de erro no painel.
2. Se possível: sessão sem chaves locais → ecrã Desbloquear no mesmo chrome.

## §5 Convite (US4)

1. Abrir `/invite/{código}` válido.
2. Mesmo shell de duas zonas; aceitar/registar funciona.

## §6 Mobile

1. Largura ~390px: formulário utilizável, sem scroll horizontal.

## Automação

```bash
cd frontend && npx tsc --noEmit
```

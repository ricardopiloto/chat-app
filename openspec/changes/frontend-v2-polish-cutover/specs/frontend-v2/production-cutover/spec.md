# Spec Delta

## Purpose

Define quando e como o frontend v2 substitui o frontend v1 como a versão servida em produção, sem interromper o acesso dos utilizadores existentes nem quebrar a autenticação por cookie.

## ADDED Requirements

### Requirement: Critério de aceite de paridade antes do corte
O sistema SHALL só ser elegível para corte de produção depois de todas as telas e fluxos listados em `docs/design-system/stitch-prompt.md` §3 (o inventário funcional completo da v1) estarem implementados e verificados em `frontend-v2`, e depois dos requisitos de `frontend-v2/theming-and-responsiveness` estarem satisfeitos.

#### Scenario: Checklist de paridade completo
- **WHEN** a decisão de corte é avaliada
- **THEN** existe um registo explícito confirmando que cada área de `docs/design-system/stitch-prompt.md` §3 foi verificada como presente e funcional em `frontend-v2`

### Requirement: Corte preserva a sessão e o cookie existentes
O sistema SHALL, no momento do corte, continuar a servir a aplicação a partir da mesma origem que o backend espera para o cookie `Session` (`SameSite=Strict`), sem exigir que os utilizadores com sessão activa voltem a autenticar-se apenas por causa da troca de frontend.

#### Scenario: Sessão sobrevive ao corte
- **WHEN** um utilizador com sessão activa na v1 acede à aplicação depois do corte para a v2
- **THEN** a sessão continua válida, sem necessidade de novo login, desde que o cookie e a origem não tenham mudado

### Requirement: Caminho de rollback disponível
O sistema SHALL manter a possibilidade de reverter o Nginx para servir `frontend/dist` (v1) em vez de `frontend-v2/dist`, sem exigir alterações no backend, durante um período a definir após o corte.

#### Scenario: Reverter o corte
- **WHEN** um problema crítico é encontrado na v2 pouco depois do corte
- **THEN** é possível apontar o Nginx de volta para `frontend/dist` sem qualquer alteração de backend ou de dados

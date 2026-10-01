# Spec Delta

## Purpose

Define quando e como o frontend v2 substitui o frontend v1 como a versão servida em produção, sem interromper o acesso dos utilizadores existentes nem quebrar a autenticação por cookie.

## ADDED Requirements

### Requirement: Critério de aceite de paridade antes do corte
O sistema SHALL só ser elegível para corte de produção depois de todas as telas e fluxos listados em `docs/design-system/stitch-prompt.md` §3 e de todos os itens de `docs/v2/parity-checklist.md` (o inventário funcional completo da aplicação actual) estarem implementados e verificados em `frontend-v2`, e depois dos requisitos de `frontend-v2/theming-and-responsiveness` estarem satisfeitos.

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

### Requirement: Todas as telas em escopo fiéis aos mockups antes do corte
O sistema SHALL só ser elegível para corte quando todas as telas mapeadas a um mockup de `docs/v2/mesa_*` e dentro do escopo estiverem classificadas **Fiel** na reavaliação de `docs/v2/AUDIT-fidelity.md` §4, com o registo comparativo em `verification.md`.

#### Scenario: Reavaliação final
- **WHEN** a decisão de corte é avaliada
- **THEN** a tabela de fidelidade está actualizada, não contém nenhuma tela em escopo classificada Parcial ou Genérica, e as telas ausentes estão justificadas por exclusão de escopo

### Requirement: Independência da v1 comprovada antes do corte
O sistema SHALL só ser elegível para corte quando `check-v1-overlap` correr sobre todo `frontend-v2/src` e nenhum ficheiro exceder os limiares de `frontend-v2-foundation` D7 sem excepção justificada, e quando nenhum ficheiro de `frontend-v2/` referenciar `frontend/`.

#### Scenario: Medição final
- **WHEN** o script de sobreposição corre antes do corte
- **THEN** o relatório está dentro dos limiares e as excepções estão registadas e justificadas

### Requirement: Backend reconciliado e retrocompatível
O sistema SHALL ter, antes do corte, uma lista final das alterações de backend feitas durante a reescrita, cada uma aditiva, documentada em `docs/v2/contracts/`, coberta por testes do backend e compatível com a v1 enquanto o rollback estiver disponível.

#### Scenario: Rollback com alterações de backend
- **WHEN** o Nginx é revertido para `frontend/dist` com o backend já contendo as alterações da reescrita
- **THEN** a v1 continua a funcionar sem alterações adicionais

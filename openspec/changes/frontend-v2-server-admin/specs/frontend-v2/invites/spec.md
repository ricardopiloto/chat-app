# Spec Delta

## Purpose

Permite convidar novas pessoas para um servidor por link e permite que quem recebe esse link entre no servidor, criando conta se ainda não tiver uma.

## ADDED Requirements

### Requirement: Criar convite em fluxo de dois passos
O sistema SHALL permitir criar um convite através de um fluxo de dois passos: primeiro escolher o canal de boas-vindas (quando o servidor ainda não tem um definido), depois apresentar o URL do convite gerado (`POST /api/servers/{id}/invites`) de forma copiável, com feedback visual de confirmação ao copiar.

#### Scenario: Servidor já tem canal de boas-vindas definido
- **WHEN** o utilizador inicia a criação de um convite num servidor que já tem canal de boas-vindas configurado
- **THEN** o primeiro passo (escolher canal) é saltado e o URL do convite é apresentado directamente

#### Scenario: Copiar o link gerado
- **WHEN** o utilizador clica em copiar o URL do convite
- **THEN** o URL é colocado na área de transferência e o botão mostra confirmação temporária de que foi copiado

### Requirement: Pré-visualização de convite sem sessão
O sistema SHALL permitir visualizar um convite (`GET /api/invites/{code}`) sem exigir sessão activa, apresentando o nome do servidor e se o histórico de mensagens é incluído, e SHALL apresentar mensagens específicas para convite inválido, expirado ou já revogado, em vez de um erro genérico.

#### Scenario: Convite inválido
- **WHEN** o código de convite não corresponde a nenhum convite activo
- **THEN** o sistema apresenta uma mensagem explicando que o convite é inválido ou expirado, sem expor detalhes internos do erro

### Requirement: Aceitar convite com registo inline
O sistema SHALL permitir, a um visitante sem conta, preencher handle e password directamente no ecrã de pré-visualização do convite e aceitar o convite (`POST /api/invites/{code}/accept`) com uma única acção — sem exigir um fluxo de registo separado antes de poder aceitar.

#### Scenario: Visitante sem conta aceita o convite
- **WHEN** um visitante sem conta preenche handle e password válidos no ecrã do convite e confirma aceitar
- **THEN** uma conta é criada, a identidade criptográfica é gerada (reutilizando a capability `frontend-v2/auth`), o convite é aceite, e o utilizador entra directamente no servidor convidado

#### Scenario: Visitante já autenticado
- **WHEN** um utilizador já autenticado abre um link de convite
- **THEN** o sistema permite aceitar o convite directamente com a conta já autenticada, sem apresentar os campos de registo

### Requirement: Convite e onboarding fiéis aos mockups
O diálogo de convite SHALL ter indicador de passos, cartões de canal de boas-vindas, opção de histórico e URL copiável com feedback; o onboarding SHALL ter cartão do servidor convidante, handle com disponibilidade, nome de exibição, senha com barra de força e checkbox de cofre. QR e expiração configurável SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_di_logo_de_convidar_fluxo_encadeado_de_2_passos e mesa_convite_onboarding_de_convidado` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D4 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional dos convites
O sistema SHALL manter todas as funcionalidades existentes desta área: criar em dois passos (ou directo quando já há canal de boas-vindas), pré-visualizar sem sessão, aceitar com registo inline ou com sessão existente, mensagens específicas para convite inválido/expirado, e publicação da mensagem de boas-vindas ao entrar.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend

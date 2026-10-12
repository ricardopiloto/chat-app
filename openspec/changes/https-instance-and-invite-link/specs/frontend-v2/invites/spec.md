# Spec Delta

## ADDED Requirements

### Requirement: O link de convite usa o endereço da instância

O link mostrado e copiado no diálogo de convite SHALL usar o endereço HTTPS da instância a que o cliente está ligado, seguido de `/invite/` e do código, e SHALL incluir o fragmento de semente quando o criador tem a chave do servidor. No browser, essa instância é a origem de onde a aplicação foi servida. No cliente nativo, é o endereço da instância guardada. O link SHALL NOT usar a origem `mesa://` da janela da aplicação.

#### Scenario: Convite criado no cliente nativo

- **WHEN** uma pessoa ligada a `https://chat.1nodado.com.br` cria um convite no cliente nativo
- **THEN** o link copiado começa por `https://chat.1nodado.com.br/invite/` e não contém `mesa://`

#### Scenario: Convite criado no browser

- **WHEN** uma pessoa cria um convite na aplicação servida por `https://chat.1nodado.com.br`
- **THEN** o link copiado começa por `https://chat.1nodado.com.br/invite/`

#### Scenario: A semente permanece no fragmento

- **WHEN** o criador tem a chave do servidor e o link é gerado
- **THEN** o segredo da semente continua só no fragmento do link, e o endereço HTTPS da instância é a parte que abre a página de criar conta

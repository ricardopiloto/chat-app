# Spec Delta

## MODIFIED Requirements

### Requirement: Página mínima de Minha Conta
O sistema SHALL oferecer uma página "Minha conta", acessível a partir do menu de conta, com cabeçalho (avatar, nome a mostrar editável, handle), alteração e remoção de avatar (JPEG/PNG/WebP, até 1 MiB), selector de idioma (pt-BR/en), um cartão "Alterar senha" (senha actual, nova senha, confirmação) e um cartão "Chave de recuperação" que mostra se a conta tem a chave e permite criá-la ou substituí-la, exigindo a senha actual e mostrando o novo código uma única vez com confirmação. A ausência da chave de recuperação SHALL ser apresentada como recomendação, não como bloqueio. SHALL NOT apresentar perfil estendido, biografia, e-mail de recuperação, Passkeys, visibilidade na malha P2P, métricas de autonomia nem acções de destruição de identidade.

#### Scenario: Editar o nome a mostrar
- **WHEN** o utilizador altera o nome a mostrar e guarda
- **THEN** o nome é persistido no backend e reflectido no painel do utilizador, no painel de Membros e nas mensagens, sem alterar o handle

#### Scenario: Avatar inválido
- **WHEN** o ficheiro escolhido excede 1 MiB ou não é JPEG/PNG/WebP
- **THEN** o sistema rejeita-o com uma mensagem clara sem o enviar ao backend

#### Scenario: Ausência de itens fora de escopo
- **WHEN** o utilizador percorre a página
- **THEN** não existe nenhuma opção de recuperação por e-mail, Passkeys, dispositivos ou visibilidade P2P

#### Scenario: Alterar senha
- **WHEN** o utilizador introduz a senha actual correcta e uma nova senha com 8 ou mais caracteres
- **THEN** a senha é alterada, a identidade mantém-se, as outras sessões terminam e a sessão actual continua

#### Scenario: Cofre local desactualizado noutro dispositivo
- **WHEN** a senha foi alterada noutro dispositivo e o cofre local não abre com a nova senha
- **THEN** o cliente tenta o cofre remoto actualizado, confirma que a chave pública corresponde à identidade da conta e, se abrir, substitui o cofre local sem apresentar erro de senha incorreta

#### Scenario: Criar chave de recuperação numa conta existente
- **WHEN** uma conta sem chave de recuperação usa o cartão e introduz a senha actual correcta
- **THEN** o código é mostrado uma única vez, o utilizador confirma que o guardou e o cartão passa a indicar que a conta tem chave de recuperação

#### Scenario: Substituir a chave de recuperação
- **WHEN** uma conta com chave de recuperação gera uma nova
- **THEN** a anterior deixa de funcionar e o utilizador é avisado antes de confirmar

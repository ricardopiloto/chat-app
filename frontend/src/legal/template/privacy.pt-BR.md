# Política de privacidade

## Instância independente

Esta instância é operada de forma independente pelo operador identificado acima. Ela não é o serviço oficial Parley; suas políticas e operação são responsabilidade do operador desta instância.

## Controlador e contato

O operador desta instância é {{LEGAL_OPERATOR_NAME}}, operador. Contato: {{LEGAL_OPERATOR_CONTACT}}. Jurisdição do operador: {{LEGAL_OPERATOR_JURISDICTION}}. Esta política descreve a instância que você usa, não todas as instalações do Parley.

## Dados usados para operar a instância

O servidor armazena identificadores de conta, registros de autenticação e recuperação, participação em servidores e canais, permissões, convites e metadados operacionais necessários ao serviço. Ele pode observar quem se conecta e quando, relações entre contas e canais, informações de encaminhamento de mensagens e dados de rede como endereços IP. Operadores podem manter logs operacionais e backups conforme sua implantação. O serviço não promete anonimato nem ausência de registros.

Quando o cadastro ou a recuperação por e-mail está ativo, a instância trata seu endereço de e-mail para enviar mensagens de verificação ou recuperação e associá-lo à conta. Provedores de envio podem tratar as mensagens necessárias à entrega. A resposta ao pedido de e-mail é propositalmente genérica, mas isso não significa que o endereço nunca seja armazenado.

## Conteúdo protegido e limites

Mensagens de texto compatíveis são criptografadas no cliente com AES-256-GCM; o servidor armazena texto cifrado. Voz e vídeo usam LiveKit Insertable Streams ou Encoded Transforms com chaves mantidas pelo cliente onde houver suporte. O SFU encaminha mídia protegida. Anexos de chat são armazenados como blobs cifrados pelo cliente. Avatares de conta e imagens de servidor ficam em claro. O servidor guarda envelopes opacos de chaves, não a chave de canal aberta.

A proteção de ponta a ponta tem limites de plataforma: Safari/WebKit e algumas webviews ficam fora do conjunto de navegadores validado; Windows e o cliente nativo WebKitGTK não foram validados na fase documentada. A entrega de chaves pode ficar pendente até que um membro com a chave fique online. Participantes sempre podem copiar, gravar ou compartilhar o que recebem. A criptografia não oculta os metadados necessários à operação do serviço.

## Retenção, acesso e solicitações

Os dados permanecem enquanto necessários para contas e conversas, sujeitos a exclusões, backups e retenção operacional definida pelo operador. Operadores autorizados podem acessar metadados visíveis ao servidor e imagens não cifradas, mas não recuperar chaves de conversa mantidas pelo cliente apenas a partir do texto cifrado armazenado. Entre em contato com o controlador acima para solicitar acesso, correção ou exclusão de dados pessoais; obrigações legais e limites técnicos podem afetar a exclusão.

# Consentimento para webhooks

Ao criar ou reactivar um webhook, o gestor deve enviar `consent_cleartext: true` em `POST /api/channels/{channel_id}/webhooks`. O pedido é recusado com 400 se faltar a confirmação. O campo confirma que **as mensagens enviadas pela integração chegam ao servidor e ficam armazenadas em claro, mesmo quando as mensagens humanas do canal usam E2EE**. A confirmação é exigida de novo em cada reactivação e não é persistida.

Texto recomendado para a interface de gestão na ronda 2: “As mensagens publicadas por esta integração são recebidas e armazenadas em claro no servidor. As mensagens humanas deste canal continuam protegidas com cifra ponta a ponta. Confirmo que compreendo e aceito activar a integração.”

A API expõe `has_active_webhook` no canal a todos os leitores autorizados. A interface da ronda 2 deve mostrar, quando verdadeiro: “Este canal aceita mensagens de integração em claro.” Cada mensagem de integração tem `kind: "webhook"`, nome e avatar em snapshot para permitir um selo de bot e preservar a identidade histórica.

O payload público aceita `content` e ignora campos adicionais de JSON. Nome, avatar, menções, anexos e embeds não podem ser definidos pelo publicador.

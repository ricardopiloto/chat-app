# Privacy policy

## Independent instance

This instance is operated independently by the operator named above. It is not the official Parley service, and its policies and operation are the responsibility of this instance operator.

## Controller and contact

The operator of this instance is {{LEGAL_OPERATOR_NAME}}, the operator. Contact: {{LEGAL_OPERATOR_CONTACT}}. Operator jurisdiction: {{LEGAL_OPERATOR_JURISDICTION}}. This policy describes the instance you are using, not every installation of Parley.

## Data used to run the instance

The server stores account identifiers, authentication and recovery-related records, server and channel membership, permissions, invitation records, and operational metadata needed to deliver the service. It can observe who connects and when, account and channel relationships, message routing information, and network information such as IP addresses. Operators may retain operational logs and backups according to their deployment. This service does not promise anonymity or zero logging.

When email registration or email recovery is enabled, the instance processes your email address to send verification or recovery messages and associate it with your account. Email delivery providers may process messages needed for delivery. The email-request response is deliberately generic, but that does not mean the address is never stored.

## Protected content and limits

Supported text messages are encrypted on the client with AES-256-GCM; the server stores ciphertext. Voice and video use LiveKit Insertable Streams or Encoded Transforms with client-held keys where supported. The SFU forwards protected media. Chat attachments are stored as client-encrypted blobs. Account avatars and server images are stored in clear form. The server stores opaque key envelopes, not the unwrapped channel key.

End-to-end protection has platform limits: Safari/WebKit and some webviews are outside the validated browser set; Windows and the native WebKitGTK client were not validated in the documented phase. Key handoff can remain pending until a member holding the key comes online. A participant can always copy, record, or share content they receive. Encryption does not conceal metadata needed to operate the service.

## Retention, access, and requests

Data remains while needed for accounts and conversations, subject to deletion, backups, and operational retention configured by the operator. Authorized operators can access server-visible metadata and unencrypted images, but not recover client-held conversation keys from stored ciphertext alone. Contact the controller above to ask about access, correction, or deletion of personal data; legal obligations and technical limits may affect what can be removed.

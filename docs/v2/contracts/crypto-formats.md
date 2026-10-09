# Formatos criptográficos persistidos

Contrato de dados entre o frontend e as contas/dados que **já existem**. O backend só guarda estes blobs; quem os escreve e lê é o cliente. Qualquer implementação do frontend v2 tem de ler os formatos abaixo e escrever de forma que a aplicação anterior (durante o rollback) também os leia.

Verificação: `npm run test:contracts` em `frontend-v2/` executa a implementação de referência (`scripts/contracts/reference.mjs`) contra `docs/v2/contracts/vectors/crypto-vectors.json`. Uma implementação nova passa o mesmo harness com `--impl <módulo>`.

Convenções: "bytes" são sequências de octetos. **b64** é Base64 padrão (RFC 4648 §4, com `=`), sem quebras de linha. Inteiros em arrays JSON são octetos 0–255.

Origem: formatos observados nos dados gravados pelo backend (`account.identity_vault`, `key_envelope.sealed_key`, `channel_key.sealed_blob`, `message.content_ciphertext`) e confirmados com vectores gerados pela aplicação anterior usada como oráculo (`scripts/contracts/gen-vectors.mjs`, ver "Nota de proveniência").

## 1. Identidade (par NaCl box)

Par de chaves `nacl.box.keyPair()` (Curve25519): `publicKey` 32 bytes, `secretKey` 32 bytes. A chave pública é também enviada ao backend (`account.identity_pubkey`).

## 2. Cofre de identidade (`IdentityVault`)

Guardado no backend (`account.identity_vault`, enviado por `PUT /api/auth/identity-vault`) e no navegador (IndexedDB).

Estrutura JSON:

```json
{ "v": 1, "publicKey": [32 octetos], "salt": [16 octetos], "iv": [12 octetos], "wrapped": [48 octetos] }
```

- `wrapped` = **AES-256-GCM** da `secretKey` (32 bytes): 32 bytes de texto cifrado + 16 de etiqueta = 48. Sem dados autenticados adicionais (AAD vazio). Chave AES = saída Argon2id abaixo. `iv` aleatório de 12 bytes.
- **Derivação**: Argon2id sobre a password em **UTF-8 (sem normalização)**, `salt` (16 bytes aleatórios), `parallelism = 1`, `iterations = 3`, `memorySize = 32 768 KiB` (32 MiB), `hashLength = 32`. A saída de 32 bytes é a chave AES-GCM.
- Palavra-passe errada ou cofre adulterado: a decifra falha na verificação da etiqueta → erro `bad_password`.
- **Persistência local** (IndexedDB): base `chat-identity`, object store `keys`, chave `identity:<accountId>`, valor = o objecto JSON acima.
- O backend nunca recebe a `secretKey` nem a chave derivada.

## 3. Caixa selada (`seal` / `unseal`)

Usada para o envelope da chave de servidor e para a chave de canal de voz. Equivalente a uma "sealed box" com nonce derivado.

`seal(plaintext, recipientPublicKey)`:
1. Gera um par efémero `nacl.box.keyPair()` (`ephPk`, `ephSk`).
2. `nonce = BLAKE2b-24( ephPk ‖ recipientPublicKey )` — BLAKE2b sem chave, saída de **24 bytes** (`dkLen = 24`), sobre a concatenação dos dois valores de 32 bytes, nesta ordem.
3. `boxed = nacl.box(plaintext, nonce, recipientPublicKey, ephSk)` (XSalsa20-Poly1305; acrescenta 16 bytes de MAC).
4. Resultado = `ephPk (32) ‖ boxed`.

`unseal(sealed, publicKey, secretKey)`: `ephPk = sealed[0..32]`, `boxed = sealed[32..]`, `nonce = BLAKE2b-24(ephPk ‖ publicKey)`, `nacl.box.open(boxed, nonce, ephPk, secretKey)`; devolve `null` se a verificação falhar.

Para uma chave de 32 bytes o resultado tem **80 bytes** (32 + 32 + 16).

## 4. Envelope da chave de servidor

- Chave de servidor: 32 bytes aleatórios.
- Envelope para uma conta = `seal(serverKey, identity.publicKey da conta)`.
- Transporte: `POST /api/servers/{id}/key-envelopes` com `{ "account_id", "sealed_key": b64(envelope) }`; leitura em `GET /api/servers/{id}/key-envelopes/me` → `{ "sealed_key": b64 }` (BLOB de 80 bytes em `key_envelope.sealed_key`).
- Cache: a chave de servidor decifrada vive só em memória durante a sessão.

## 5. Chave de canal de voz (custódia)

- 32 bytes aleatórios gerados no cliente ao criar o canal (ou o servidor com canal de voz).
- Envio ao backend selada para o próprio criador: `channel_key_sealed = b64(seal(channelKey, identity.publicKey))` (BLOB de 80 bytes em `channel_key.sealed_blob`).
- **Apresentação ao utilizador** (para ele guardar): `b64(channelKey)` (44 caracteres). Ao religar a E2EE, o texto colado é aceite se decodificar para exactamente 32 bytes.
- **Cache no dispositivo**: `localStorage["mesa.channelKey." + channelId] = b64(channelKey)`.

## 6. Cifra de mensagem e de anexo (chave de servidor)

`encryptBytes(serverKey, plain)`:
1. `iv` aleatório de 12 bytes.
2. `ct = AES-256-GCM(serverKey, iv, plain)` — saída WebCrypto, ou seja, texto cifrado seguido da etiqueta de 16 bytes; sem AAD.
3. Resultado = `iv (12) ‖ ct`.

- **Mensagem**: `plain` = texto em UTF-8; enviado como `b64(encryptBytes(...))` em `content_ciphertext` (BLOB no backend). Tamanho = `12 + len(utf8) + 16`.
- **Anexo**: `plain` = bytes da imagem; o corpo do upload é o resultado de `encryptBytes` (o backend guarda bytes opacos).
- Decifra: `iv = packed[0..12]`, `ct = packed[12..]`. Falha de etiqueta → erro.

## 7. O que NÃO é contrato

- Chave de media do LiveKit: derivada em tempo de execução a partir da chave de canal ou de servidor e passada ao SDK; não é persistida.
- Cookie de sessão: definido pelo backend.

## 8. Vectores

`docs/v2/contracts/vectors/crypto-vectors.json` contém, em Base64, para cada formato: entradas, saída esperada e casos negativos (password errada, caixa selada adulterada, pacote AES adulterado). A leitura é obrigatória (decifrar o vector); a escrita é verificada por ida-e-volta com a implementação de referência e com o oráculo.

## 9. Chave de recuperação

O código de recuperação tem 16 bytes aleatórios, apresentados em Crockford base32 (alfabeto `0123456789ABCDEFGHJKMNPQRSTVWXYZ`, 26 caracteres, agrupados de 4 com `-`). O servidor nunca recebe o código nem a `secretKey`.

1. `salt = BLAKE2b-16("mesa-recovery-v1" ‖ UTF-8(lower(trim(handle))))`. Sem chave, `dkLen = 16`.
2. `master = Argon2id` sobre o UTF-8 do código normalizado de 26 caracteres (sem hífenes), com esse `salt` e os mesmos parâmetros do cofre de identidade (p=1, t=3, m=32768 KiB, hashLength 32).
3. `wrapKey = BLAKE2b-32(master, personalization = "wrap" preenchido com zeros até 16 bytes)` e `signSeed = BLAKE2b-32(master, personalization = "sign" do mesmo modo)`. A chave Ed25519 deriva de `signSeed` (`nacl.sign.keyPair.fromSeed`); só a chave pública de 32 bytes vai ao servidor, em Base64.
4. `recovery_vault = { "v": 1, "publicKey": [32 octetos], "iv": [12 octetos], "wrapped": [48 octetos] }`. `wrapped` é AES-256-GCM da `secretKey` com `wrapKey` e `iv` aleatório, sem AAD e sem `salt`.
5. Assinatura Ed25519 (`nacl.sign.detached`) sobre a mensagem versionada: byte `0x01`, depois cada parte com comprimento `u16` big-endian seguido dos bytes. Partes, por ordem: UTF-8 da operação (`start` ou `redeem`), UTF-8 de `lower(trim(handle))`, `left`, `right`.
   - `start`: `left` = 16 bytes do UUID do desafio (ordem RFC 4122, a mesma de `Uuid::as_bytes`), `right` = nonce de 32 bytes.
   - `redeem`: `left` = ticket de 16 bytes, `right` = `SHA-256(UTF-8(password) ‖ 0x00 ‖ UTF-8(cofre canónico))`.
6. Cofre canónico da identidade, sem espaços: `{"v":1,"publicKey":[...],"salt":[...],"iv":[...],"wrapped":[...]}`. A ordem dos campos é fixa.
7. Desafio e ticket duram 5 minutos, são de uso único e ficam ligados a `recovery_generation`. Não entram em logs.

## 11. Semente de convite

O link de convite pode transportar a `server_key` sem o backend a ver. O criador gera um par X25519 efémero (`nacl.box.keyPair`). A parte privada vive só no fragmento `#k=<base64url da secretKey, sem padding>`. O backend guarda um blob opaco, em Base64 padrão, de no máximo **128 bytes** depois de descodificado.

Blob versão 1, 97 bytes:

1. `0x01`.
2. `seal(server_key, chave pública efémera)` — 80 bytes, secção 3.
3. Valor de verificação: `BLAKE2b-16("mesa-invite-seed-v1" ‖ server_key)` — 16 bytes, sem chave. O cliente só publica o envelope se este valor bater certo com a chave aberta. Se o servidor já tiver uma mensagem cifrada, o cliente também a decifra com a chave aberta; se a decifra falhar, não publica e fica `pending`.

Convite com semente e sem `expires_in_seconds` expira em 24 h. A recuperação por código do operador não usa esta semente: continua no handoff online.

## 12. Nota de proveniência

Os formatos acima foram confirmados de duas maneiras: observação dos dados reais gravados no backend (tamanhos e estrutura) e vectores produzidos pela aplicação anterior em execução, usada como oráculo. A estrutura exacta de encaixe (ordem `iv ‖ ct`, nonce derivado por BLAKE2b, parâmetros Argon2id) é confirmada pelos vectores: a implementação de referência, escrita a partir deste documento e das bibliotecas (`tweetnacl`, `@noble/hashes`, `hash-wasm`, WebCrypto), só passa se o documento estiver correcto e completo.

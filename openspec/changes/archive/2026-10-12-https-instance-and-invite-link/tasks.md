# Tasks

## 1. Endereço da instância

- [x] 1.1 Em `normalizeInstanceUrl`, tratar um host sem esquema como `https://` e recusar `http://` com um erro distinto do endereço inválido. Aceitar um `https://` já escrito e guardar só a origem, incluindo host com porta. Verificar com um teste em Node que `chat.1nodado.com.br` fica `https://chat.1nodado.com.br`, que `https://chat.1nodado.com.br/caminho` fica `https://chat.1nodado.com.br`, que `chat.exemplo.com:8443` fica `https://chat.exemplo.com:8443`, e que `http://chat.1nodado.com.br` é recusado.
- [x] 1.2 Actualizar o placeholder e a mensagem de erro em pt-BR e en para pedirem o host, e para dizerem que a instância tem de ser HTTPS quando o endereço é `http://`. Verificar que o ecrã de instância mostra o placeholder sem `https://` e que a mensagem de `http://` não pede para escrever `http://` ou `https://`.

## 2. Link de convite

- [x] 2.1 No diálogo de convite, usar a origem da página no browser e `currentInstance().baseUrl` no cliente nativo, tanto no link com semente como no link sem semente. Se a instância nativa não tiver endereço guardado, mostrar o erro do diálogo e não gerar um link `mesa://`. Verificar que um convite nativo para `https://chat.1nodado.com.br` começa por `https://chat.1nodado.com.br/invite/` e que o fragmento da semente, quando existe, continua depois de `#`.

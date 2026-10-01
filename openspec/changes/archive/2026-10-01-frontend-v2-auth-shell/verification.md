# Verificação — frontend-v2-auth-shell

Reescrita da fase (revisão de 2026-10-01): a verificação anterior foi descartada porque o código descendia da v1. Ambiente: backend descartável (`DATABASE_URL=sqlite://…`, `MESA_RATE_LIMIT_DISABLED=1`), `frontend-v2` em `https://localhost:1421`, v1 em `https://localhost:1420` apenas como oráculo (caixa-preta). Contas de teste geradas para a ocasião, fora do repositório.

## 1. Criptografia de identidade (1.1–1.3)

- `src/crypto/vault.ts` (funções puras: cofre, caixa selada) e `src/crypto/identity.ts` (IndexedDB, política de desbloqueio) escritos a partir de `docs/v2/contracts/crypto-formats.md`. Nada em `src/` importa `frontend/`; `identity.manual.ts` deixou de o fazer.
- **1.1** `node scripts/contracts/run.mjs --impl scripts/contracts/impl-v2.mjs`: **24/24** (vectores de cofre e caixa selada contra `vault.ts`; as funções AES de mensagem vêm da implementação de referência porque pertencem à fase de chat).
- **1.2** `runIdentityRoundTripManualCheck()` no navegador: «round trip mantém a chave secreta; senha errada levanta `bad_password`».
- **1.3** Compatibilidade nos dois sentidos com a v1 em execução como oráculo:
  - v2 → v1: conta criada na v2 (`elysia_star`) autenticada na v1 num contexto sem cofre local; a v1 abriu o cofre remoto e mostrou o shell (e guardou a chave no seu IndexedDB).
  - v1 → v2: conta criada na v1 (`oraculo_v1`, registo por `/invite/:code`); a v2, sem cofre local, abriu o cofre remoto com a senha da v1.
- Pedidos de rede observados no registo e na recuperação: apenas `identity_pubkey` e o cofre cifrado (`v, publicKey, salt, iv, wrapped`); a chave secreta nunca sai. A senha em claro segue no registo/login porque o backend a usa para a sua própria autenticação (contrato do backend, igual à v1).

## 2. Autenticação e desbloqueio (2.1–2.4, 8.1–8.2)

Verificado no navegador, contra o backend:
- Registo (conta nova entra no shell vazio «Seu espaço começa aqui»), login com cofre local (só pede a senha), erro de credenciais, senha curta no registo (sem pedido), recarregar mantém a sessão e pede o desbloqueio.
- Desbloqueio, três estados: **cofre remoto** (IndexedDB apagado → «cofre local em falta»; a senha abre a cópia do servidor e grava-a localmente), **sem cofre** (conta sem cofre em lado nenhum → mensagem + opção de gerar chaves), **senha errada** (erro único, sem dizer qual condição falhou).
- «Recuperar identidade» visível em todas as visitas ao ecrã de desbloqueio; confirma antes de substituir; `PUT /api/auth/identity` leva só chave pública e cofre.
- «Esqueceu o cofre?» explica o caminho (entrar normalmente; o ecrã de desbloqueio oferece a recuperação), porque recuperar exige sessão no servidor.
- **2.4** `grep -rniE 'passkey|fido|MLS|dispositivos|p2p'` nos ficheiros desta fase: só um comentário que nega a existência. Nenhum ecrã de dispositivos, MLS ou Passkeys.
- Convite: `/invite/<código>` e `/?invite=<código>` abrem o cadastro com o código preenchido e editável; convite inválido dá «Informe um convite válido…» e não cria identidade; convite válido cria a conta e entra no servidor. `invite_code` é opcional (primeira conta). Aceitar convite com sessão já iniciada (SRV-19) pertence à fase `server-admin` (D6).

## 3. Rail, sidebar, topbar (3.1–3.3, 4.1)

- Rail com 3 servidores: navegação activa por URL; ponto de não lido e de chamada ao vivo actualizados por WS (`message.new` enviada por outra conta; `voice.occupancy` por entrada em canal de voz); imagem do servidor (`/api/servers/{id}/image`) e iniciais.
- Sidebar: duas secções, cadeado em canal privado, estado vazio sem canais (o backend não permite apagar o último canal de cada tipo, por isso o estado foi exercido com a resposta da lista simulada vazia), roster de voz e selo «AO VIVO».
- Topbar: pesquisa (atalho Ctrl+K visível e funcional), notificações com indicador, tema, membros, avatar. Pesquisa e notificações só emitem `mesa:search` / `mesa:notifications`.
- Faixa «Reconectando ao servidor…» (SHL-11): aparece ao parar o backend e desaparece ao religar.

## 4. Tema (4.2, 4.3)

- `node scripts/verify-theme.mjs`: 9/9 (modo guardado, aplicação imediata, «Sistema» segue o SO ao vivo, modo fixo ignora o SO, o observador remove-se).
- No navegador: os três estados alternam e `localStorage["mesa.theme"]` persiste.
- **Revisão visual do modo claro (D3)**: shell completo, menu de conta, modal de saída e ecrã de login revistos no tema claro; sem problemas de contraste encontrados (mantém-se a observação de que o claro é extrapolado, sem mockup).

## 5. Menu de conta e conta (5.1–5.3, 9.5)

- Menu: nome de exibição (`PATCH /api/auth/display-name`, reflectido no painel e na lista de membros, handle intacto), Minha conta, idioma, tema, Sair. Sem `<input type=file>` à vista.
- Idioma pt-BR ↔ en troca os textos sem recarregar e `<html lang>`.
- Sair: o diálogo explica o efeito; Esc cancela e a sessão continua; só depois de confirmar `GET /api/auth/me` passa a 204.
- Minha conta: nome editável, foto (JPEG/PNG/WebP ≤ 1 MiB). GIF e ficheiro de 1 MiB + 1 byte recusados sem pedido de rede; PNG válido → `PUT /api/auth/avatar`; remover → `DELETE`.

## 6. Responsividade (6.1–6.2)

Num iframe com largura variável: abaixo de 768px o rail+sidebar ficam numa gaveta fora do ecrã (`inert`), o hambúrguer abre-a, o backdrop fecha-a; o painel de Membros fica oculto. Alargar a janela para ≥ 768px com a gaveta aberta repõe o layout fixo sem acção do utilizador.

## 7. Fluxo completo (7.1–7.2)

Registo → shell vazio → «dispositivo novo» (IndexedDB apagado + recarregar) → desbloqueio com a mesma senha → o shell carrega os mesmos servidores e canais. `git status frontend/` sem alterações.

## 8. Fidelidade visual (9.1–9.6)

Capturas em `docs/v2/fidelity/frontend-v2-auth-shell/`, tema escuro, na largura do `screen.png` de cada mockup (1280 / 1600 / 1254 px). A captura é de uma região do ecrã do navegador, por isso a resolução é inferior à do mockup.

### 9.1 Autenticação — `login.png`, `register.png`

| Elemento (D7) | Mockup | v2 | Observação |
|---|---|---|---|
| Painel esquerdo: marca, proposta de valor, três cartões, rodapé de instância | presente | presente | rodapé mostra o anfitrião; sem «ping» (dado inexistente) |
| Cartão com controlo segmentado Entrar / Criar conta | presente | presente | |
| Handle com prefixo `@` e dica de exemplo | presente | presente | |
| «Senha e chave mestra», «Esqueceu o cofre?», alternância de visibilidade | presente | presente | |
| Botão primário em pílula com ícone | presente | presente | |
| Separador «OU» e botão secundário «Criar uma nova conta na instância» | presente | presente | |
| Selo de protocolo | presente | presente | texto reflecte a cifra real (NaCl box · Argon2id · AES-256-GCM), não o texto ilustrativo do mockup |
| Chips de topo: instância/versão, E2EE, idioma, tema | presente | presente | |
| Excluídos (simulador de estado) ausentes | — | sim | |

Classificação: **Fiel**.

### 9.2 Desbloqueio — `unlock-remote-vault.png`, `unlock-no-vault.png`, `unlock-wrong-password.png`, `unlock-local.png`

| Elemento (D7) | Mockup | v2 | Observação |
|---|---|---|---|
| Painel esquerdo | presente | presente | |
| Chip «sessão detectada · cofre em falta» | presente | presente | muda para «cofre bloqueado» quando o cofre existe neste navegador |
| Cartão de identidade (avatar, nome, handle, sessão) + «Trocar de conta» | presente | presente | |
| Aviso de enclave | presente | presente | |
| Campo de senha com alternância | presente | presente | |
| Botão «Desbloquear» | presente | presente | |
| Separador e bloco «Recuperar identidade» com a acção | presente | presente | a acção gera chaves novas (sem «Mesa Bridge»/QR/24 palavras, excluídos) |
| Ligação «Trocar de conta» no rodapé | presente | presente | |

Classificação: **Fiel** nos três estados.

### 9.3 Shell — `shell.png`

| Elemento (D7) | Mockup | v2 | Observação |
|---|---|---|---|
| Topbar: logo, instância+versão, chip E2EE, busca com atalho, tema em 3 ícones, notificações com indicador, avatar | presente | presente | |
| Rail com imagem/iniciais e indicadores de não lido e voz | presente | presente | |
| Sidebar: cabeçalho (nome, convidar, definições), secções Texto e Voz/vídeo com «+», cadeado, «AO VIVO» | presente | presente | |
| Painel do utilizador | presente | presente | |
| Painel de Membros (contagem online, por cargo e presença, alternável, oculto em mobile) | presente | presente | |
| Excluídos (ferramentas VTT, bandeja de dados, fixar) ausentes | — | sim | |

Classificação: **Fiel**.

### 9.4 Menu de conta e saída — `account-menu.png`, `signout-modal.png`

| Elemento (D7) | Mockup | v2 | Observação |
|---|---|---|---|
| Menu de acções (Minha conta, idioma, tema, Sair), sem `<input type=file>` | presente | presente | acrescenta o campo do nome (exigido por `app-shell`) |
| Modal: ícone, explicação do efeito, Cancelar com Esc, confirmação com ícone | presente | presente | faixa de acento e mosaico de ícone como no mockup |
| «Cache encriptada» (excluído) ausente | — | sim | |

Classificação: **Fiel**.

### 9.5 Minha conta — `account.png`

| Elemento (subconjunto em escopo) | Mockup | v2 | Observação |
|---|---|---|---|
| Cabeçalho de perfil (avatar, nome editável, handle) | presente | presente | |
| Cartões com cabeçalho (ícone + rótulo + título) | presente | presente | |
| Navegação lateral de configurações | presente | presente | só as secções existentes, mais «Voltar à Mesa · Esc» |
| Recuperação, Passkeys, P2P, destruição de identidade (excluídos) ausentes | — | sim | |

Classificação: **Fiel** para o subconjunto.

### 9.6 Painel de Membros

Verificado com 5 contas de teste: grupos por cargo («DONO», «MEMBROS») e «OFFLINE», contagem online, mudança de grupo ao ligar/desligar o socket (`presence`), membro novo aparece sem recarregar, alternável, oculto abaixo de 768px.

## 9. Paridade (10.1)

`docs/v2/parity-checklist.md`: itens AUT-01–12, CTA-01–06, SHL-01–09, SHL-11–13 marcados como verificados contra o comportamento da v1; SHL-10 (menu de contexto) e a parte de diálogos de SHL-12 pertencem a outras fases.

## 10. Independência (10.2)

`npm run check:v1-overlap` sobre os ficheiros desta fase: dentro dos limiares ou com excepção justificada em `scripts/v1-overlap-exceptions.json`. As excepções passaram a ter um tecto de **maior sequência partilhada** (`maxRun`, 40 tokens; 60 para `vault.ts`): o que partilham com a v1 são idiomas curtos do framework (imports, `createSignal`, etiquetas JSX), e cópia de lógica falharia pelo tecto. O script ganhou a coluna «longest shared run». `styles.css` perdeu as regras do shell antigo.

## 11. Alterações de backend (10.3)

**Nenhuma.**

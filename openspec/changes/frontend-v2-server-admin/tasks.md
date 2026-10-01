# Tasks

## 1. Criar servidor e criar canal

- [ ] 1.1 Implementar o diálogo de criar servidor seguindo `mesa_modal_criar_servidor_cust_dia_e2ee` (nome, chave gerada copiável, checkbox de custódia obrigatória gating o botão) consumindo `POST /api/servers`; verificar que o botão fica bloqueado sem a checkbox marcada e desbloqueado com ela
- [ ] 1.2 Implementar o diálogo de criar canal seguindo `mesa_modal_criar_canal_de_voz_cust_dia_e2ee` para voz e a mesma estrutura sem o bloco de custódia para texto, com alternância Texto/Voz funcional (o mockup tem essa alternância estática — implementar como interactiva); verificar ambos os tipos de canal
- [ ] 1.3 Verificar visibilidade Público/Privado + "visível para novos membros" em ambos os diálogos contra `GET /api/servers/{id}/channels` reflectindo o valor correcto após criação

## 2. Definições de servidor — Membros e Cargos

- [ ] 2.1 Implementar a página de Membros seguindo `mesa_defini_es_do_servidor_membros` (pesquisa, selector de cargo por linha, remover) consumindo `GET /api/servers/{id}/members`; verificar que a linha do dono não tem selector nem botão de remover
- [ ] 2.2 Implementar a página de Cargos seguindo `mesa_defini_es_do_servidor_cargos_e_permiss_es` (criar, reordenar ↑/↓, apagar, edição de permissões inline conforme D1 do design.md) com os três grupos de permissão exactos (Geral/Texto/Voz); verificar que um cargo de sistema aparece só-leitura sem reordenar/apagar
- [ ] 2.3 Verificar o aviso ao apagar um cargo com membros associados, e que a alteração de uma permissão afecta o acesso real de um membro de teste com esse cargo

## 3. Definições de servidor — Visão Geral, Boas-vindas e Apagar

- [ ] 3.1 Implementar a página "Visão Geral" agregada seguindo `mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas` (imagem, boas-vindas, apagar) como landing de definições por omissão; verificar upload/remoção de imagem com validação de tipo/tamanho (JPEG/PNG/WebP, ≤1 MiB)
- [ ] 3.2 Implementar a configuração de boas-vindas (selector de canal + template) e verificar que uma mensagem de boas-vindas é publicada no canal escolhido quando um membro novo entra (depende da Tarefa 6.x de convites estar funcional para testar ponta a ponta)
- [ ] 3.3 Implementar a confirmação de apagar servidor com exigência de digitar o nome exacto antes do botão destrutivo activar; verificar com um servidor de teste descartável

## 4. Gestão de canal

- [ ] 4.1 Implementar renomear canal inline (normalização de espaços→hífens, limite 32 caracteres); verificar com nomes válidos e inválidos
- [ ] 4.2 Implementar apagar canal com tratamento explícito do erro 409 `last_channel_of_type`; verificar tentando apagar o último canal de texto e o último de voz de um servidor de teste
- [ ] 4.3 Implementar o painel de ACL de canal seguindo `mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso` (visibilidade, construtor de regras com os 4 selects dependentes, lista de regras removíveis); verificar adicionar e remover pelo menos 2 regras diferentes (uma de cargo, uma de membro específico)
- [ ] 4.4 Implementar o sub-painel "Inspecionar acesso" (D-inspector do design.md) reutilizando a lógica de resolução de acesso; verificar com um membro cujo acesso é determinado por cada um dos 3 factores de precedência (sobrescrita de membro, cargo, `@everyone`)
- [ ] 4.5 Implementar o diálogo de silenciar/dessilenciar membro com as durações da v1 (5/10/15/30 min + custom, conforme D2 do design.md, não as do mockup) como um único componente coerente (D3); verificar silenciar, ver o tempo restante, e dessilenciar antes do fim

## 5. Convites

- [ ] 5.1 Implementar o fluxo de criar convite em 2 passos seguindo `mesa_di_logo_de_convidar_fluxo_encadeado_de_2_passos` (escolher canal de boas-vindas quando ainda não definido, depois mostrar URL copiável); verificar o caso "servidor já tem canal de boas-vindas" saltando o primeiro passo
- [ ] 5.2 Implementar o ecrã de pré-visualização/aceitar convite seguindo `mesa_convite_onboarding_de_convidado` (preview sem sessão, registo inline para visitante sem conta, aceitar directo para quem já tem sessão); verificar os 3 estados: convite válido sem conta, convite válido com conta já autenticada, convite inválido/expirado
- [ ] 5.3 Verificar ponta a ponta: criar convite → abrir o URL numa sessão anónima → registar e aceitar → confirmar que a conta nova aparece na lista de Membros do servidor (Tarefa 2.1) e recebe a mensagem de boas-vindas (Tarefa 3.2)

## 6. Verificação de fase completa

- [ ] 6.1 Percorrer o ciclo completo: criar servidor → criar canal de texto e de voz → convidar um segundo utilizador de teste → configurar um cargo com permissões restritas e atribuí-lo ao convidado → confirmar via "Inspecionar acesso" que a restrição é aplicada corretamente
- [ ] 6.2 Confirmar que nenhuma alteração foi feita a `frontend/` durante esta fase (`git status frontend/` sem alterações)

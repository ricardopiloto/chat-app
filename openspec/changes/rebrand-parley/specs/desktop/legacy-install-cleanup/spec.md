# Spec Delta

## Purpose

Faz o shell desktop remover, com consentimento, uma instalação anterior do produto sob o nome Mesa na primeira execução, para que o app com identidade nova não fique instalado ao lado do antigo.

## ADDED Requirements

### Requirement: Detecção e remoção da instalação anterior com confirmação

Na primeira execução da aplicação empacotada, o sistema SHALL procurar uma instalação anterior do Mesa na plataforma atual e, se existir, SHALL perguntar ao usuário se quer removê-la antes de remover qualquer coisa. O sistema SHALL NOT remover nada sem resposta afirmativa, SHALL NOT tocar na instalação em execução, e SHALL NOT executar a limpeza em ambiente de desenvolvimento.

#### Scenario: Instalação anterior encontrada e aceite
- **WHEN** o Parley abre pela primeira vez numa máquina com o Mesa instalado e o usuário aceita remover
- **THEN** a instalação do Mesa é removida e o Parley continua aberto

#### Scenario: Usuário recusa
- **WHEN** o usuário recusa a remoção
- **THEN** nada é removido, a pergunta não volta a aparecer, e a aplicação mostra como remover manualmente

#### Scenario: Nenhuma instalação anterior
- **WHEN** o Parley abre pela primeira vez numa máquina sem o Mesa
- **THEN** nenhum diálogo aparece

### Requirement: Escopo da remoção por plataforma

O sistema SHALL remover, no Windows, o programa registrado como instalação anterior executando seu desinstalador silencioso; no macOS, `Mesa.app` em `/Applications` e em `~/Applications`; no Linux, o AppImage, o atalho de menu e o ícone criados pelo script de instalação. Para pacotes Linux `.deb`/`.rpm` e para instalações que exijam elevação, o sistema SHALL apenas informar o comando ou passo manual e SHALL NOT tentar elevar privilégios.

#### Scenario: Windows
- **WHEN** o Mesa está instalado por NSIS para o usuário atual e o usuário aceita
- **THEN** o desinstalador do Mesa é executado em modo silencioso e o Mesa desaparece de Aplicativos instalados

#### Scenario: Linux por pacote
- **WHEN** o Mesa foi instalado por `.deb` ou `.rpm`
- **THEN** o sistema informa o comando de remoção do pacote e não remove nada

#### Scenario: Falha na remoção
- **WHEN** a remoção falha por permissão ou erro do desinstalador
- **THEN** a aplicação continua normalmente e mostra o passo manual

### Requirement: Dados do Mesa são preservados e a limpeza roda uma vez

A limpeza SHALL NOT apagar a pasta de dados do Mesa. A limpeza SHALL ocorrer no máximo uma vez por instalação do Parley e SHALL NOT atrasar nem impedir a abertura da aplicação.

#### Scenario: Pasta de dados intacta
- **WHEN** a remoção do Mesa termina
- **THEN** a pasta de dados do Mesa continua no disco

#### Scenario: Segunda execução
- **WHEN** o Parley abre pela segunda vez
- **THEN** não procura nem pergunta sobre o Mesa

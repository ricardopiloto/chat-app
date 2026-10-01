# Spec Delta

## Purpose

Garante que toda a aplicação (não só as partes desenhadas em mockup) funciona correctamente em modo claro e em viewport mobile, encerrando a dívida acumulada nas Fases 0-4 de resolver estes dois eixos por extrapolação, sem uma auditoria de conjunto.

## ADDED Requirements

### Requirement: Modo claro consistente em toda a aplicação
O sistema SHALL apresentar toda tela de produto (autenticação, shell, administração de servidor/canal, chat de texto, voz/vídeo) correctamente legível e sem problema de contraste em modo claro, não apenas no shell de navegação.

#### Scenario: Auditoria de modo claro por área
- **WHEN** cada área funcional entregue nas Fases 1-4 é revista em modo claro
- **THEN** nenhuma área apresenta texto ilegível, elemento invisível, ou contraste insuficiente entre texto e fundo

### Requirement: Responsividade mobile consistente em toda a aplicação
O sistema SHALL apresentar toda tela de produto de forma utilizável em viewport móvel (<768px), incluindo áreas que nas fases anteriores só verificaram a componente de shell (gaveta/drawer) sem verificar o conteúdo interno de cada tela específica.

#### Scenario: Auditoria de responsividade por área
- **WHEN** cada área funcional entregue nas Fases 1-4 é revista em viewport <768px
- **THEN** nenhuma área exige scroll horizontal não intencional, sobreposição de elementos, ou controlos inacessíveis ao toque

### Requirement: Paridade de i18n completa
O sistema SHALL ter, em ambos os catálogos (pt-BR e en), uma tradução para 100% dos textos de interface introduzidos em qualquer fase anterior — nenhuma tela SHALL depender de um valor de recurso (fallback) de forma permanente.

#### Scenario: Nenhuma chave em falta
- **WHEN** o catálogo de cada idioma é comparado com o conjunto de chaves realmente usadas pela aplicação
- **THEN** não existe nenhuma chave usada pela aplicação que esteja ausente de algum dos dois catálogos

# Review — Arquiteto de Soluções

**Change:** direct-join-call-entry
**Data:** 2026-11-08 (revisão do código implementado)
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: OK

- Implementação fiel a D1-D4. `VoicePage.tsx` ficou pequeno e legível: `onMount` resolve acesso efectivo (`refreshChannels`/`refreshRoles`), decide `full`/`listen`, chama `join()` com `cam: false` sempre (D1), e mostra erro com retry manual em vez de reabrir `GreenRoom` (D2).
- **Reforço de concorrência que vai além do pedido, correctamente justificado**: `callSession.tsx` ganhou `activeJoin`/`activeLeave` (substituindo o simples `joining: boolean`) e um parâmetro `valid: () => boolean` passado por `VoicePage` (`{ valid: () => !disposed }`). Isto serializa `join()`/`leave()` entre si e dá ao chamador uma forma de cancelar um `join()` em curso quando o componente é desmontado antes de resolver — por exemplo, navegar para um canal de texto a meio de uma entrada automática em curso. Sem isto, esse join terminaria "live" numa chamada que a pessoa já não estava a tentar entrar. Confirmei no diff que `valid()` é verificado em quatro pontos diferentes de `joinOnce` (antes de começar, depois de esperar um `leave` anterior, depois do `status() !== "idle"` disparar um `leave`, e depois do `await` da chave E2EE) — não é um remendo superficial.

## 2. Integração com a infraestrutura existente
Veredito: N/A

Sem backend tocado nesta change; API de voz já existente é reaproveitada sem alteração de contrato.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção

- Remoção de `GreenRoom.tsx`/`testPattern.ts` confirmada limpa: corri `npm run build` (produção completa) e `tsc --noEmit`/`eslint src` eu próprio, sem nenhum erro nem referência solta. `onCleanup` em `VoicePage.tsx` só chama `call.leave()` quando `connectingHere()` é verdadeiro (ligação ainda em curso) — uma chamada já "live" sobrevive à navegação, preservando o comportamento existente do PiP/FloatingPlayer ao navegar para fora do canal. Verifiquei esta distinção com atenção, por ser fácil de errar (cancelar uma chamada já estabelecida por engano).
- **Achado novo, não desta change mas descoberto ao revê-la**: `docs/v2/parity-checklist.md`, linha VOZ-09, ainda diz "partilha (só Grade)" — ficou desactualizado pela change `improve-call-view-controls` (implementada antes desta, que tornou a partilha disponível nas duas vistas), não por esta. Vale uma correcção de uma linha numa próxima passagem, não bloqueia esta change.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `implementation-summary.md` documenta com precisão o que mudou, incluindo a serialização de `join`/`leave` que não estava explicitamente nas tarefas originais mas decorre directamente do Risk já identificado em `design.md` ("usar o cancelamento já previsto em `call.join()`").

## 5. Ponte entre produto e técnico
Veredito: OK

- O pedido do utilizador (clicar no canal já entra, câmara desligada por omissão, modelo Discord) está implementado ponta a ponta, incluindo a remoção deliberada do modo "Testar vídeo" que não existe nesse modelo.

## Bloqueantes antes de implementar
- Nenhum. Recomendo a correcção de uma linha no `parity-checklist.md` (secção 3) numa próxima passagem de qualquer das duas changes relacionadas.

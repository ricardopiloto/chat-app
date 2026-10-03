# Fecho do `frontend-v2-polish-cutover`: independência, backend e auditorias

Registo de 2026-10-02 das tarefas 1, 2, 3, 4A.2, 4A.3 e 4A.4. O estado da paridade (4.1) e da fidelidade (4A.1) e o corte (5.x) estão em `tasks.md` do change.

## Independência da v1 (4A.3)

Comando: `cd frontend-v2 && npm run check:v1-overlap`.

**Resultado: 139 ficheiros, sobreposição ponderada 20%, 0 reprovados.** 71 ficheiros dentro do limiar sem excepção e 68 com excepção justificada em `frontend-v2/scripts/v1-overlap-exceptions.json` (cada uma com o motivo e, quando aplicável, o teto de sequência comum).

Antes desta fase reprovavam 6 ficheiros, resolvidos assim:

| Ficheiro | Antes | Resolução |
|---|---|---|
| `lib/localPrefs.ts` | 100% | Reescrito a partir do requisito (acesso protegido ao armazenamento local), sem as funções que ninguém usava |
| `lib/safeMedia.ts` | 100% | Removido: nenhum ficheiro o importava |
| `lib/capabilities.ts` | 76% | Reescrito a partir das regras de permissão do servidor |
| `lib/errors.ts` | 65% | Reescrito |
| `lib/toast.ts` | 33% | Reescrito |
| `admin.css` | 28% (limite 15%) | Removido: 95 das 111 classes não eram usadas por nenhum componente; a única regra viva (`.dialog-actions`) passou para `components/ui.css`. O `.segmented` deixa de ser sobreposto e passa a seguir o estilo de `ui.css` |

Nenhum ficheiro de `frontend-v2/src`, `scripts`, `vite.config.ts` ou `package.json` referencia `frontend/` (exceto o próprio verificador e o ficheiro de exceções, que o nomeiam).

### Relatório completo

```
> node scripts/check-v1-overlap.mjs

EXCUSED  59% (max 30%)     179 tok  logic lib/channelName.ts  longest shared run 31  -- Rewritten from the backend rule (whitespace becomes hyphen, 32 Unicode characters, not empty or hyphens only). The rule is fixed by the server, so the expressions that implement it repeat; capped by longest shared run.
EXCUSED  41% (max 30%)     720 tok  logic crypto/keyHandoff.ts  longest shared run 39  -- Rewritten from the backend contract. Endpoint paths, event names, payload fields and the sealed-envelope flow are fixed by the server and by interoperability with existing members' keys, so call sequences repeat; capped by longest shared run.
EXCUSED  41% (max 30%)    3333 tok  logic i18n/catalogs/legacy/pt-BR.ts  longest shared run 564  -- Transitional: text of screens not rebuilt yet. Each phase deletes the keys it replaces; the file is removed when empty.
EXCUSED  41% (max 30%)    2990 tok  logic i18n/catalogs/legacy/en.ts  longest shared run 488  -- Transitional: text of screens not rebuilt yet. Each phase deletes the keys it replaces; the file is removed when empty.
EXCUSED  35% (max 15%)     548 tok  ui    chat/EmojiPicker.tsx  longest shared run 24  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  33% (max 15%)    1736 tok  ui    admin/channel/MuteMemberDialog.tsx  longest shared run 35  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  33% (max 15%)     984 tok  ui    admin/channel/DeleteChannelDialog.tsx  longest shared run 33  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  32% (max 15%)     240 tok  ui    styles.css  longest shared run 26  -- Transitional: global reset and the auth/shell layout rules of screens not rebuilt yet. Tokens already moved out to tokens.css; each phase deletes the rules it replaces.
EXCUSED  32% (max 30%)     755 tok  logic crypto/vault.ts  longest shared run 43  -- Implements the byte formats fixed by docs/v2/contracts/crypto-formats.md (vault layout, Argon2id parameters, BLAKE2b-24 nonce, NaCl box calls); calls into tweetnacl, @noble/hashes and hash-wasm are identical by necessity. It passes the contract vectors independently (npm run test:contracts).
EXCUSED  31% (max 15%)     268 tok  ui    shell/LanguageSwitch.tsx  longest shared run 19  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  31% (max 15%)    1436 tok  ui    components/ui/Overlay.tsx  longest shared run 38  -- Rewritten from the requirements; the residual overlap is the public contract that existing screens call (prop names, class hooks such as .dialog/.field/.ui-button, ARIA roles) plus framework idioms; in small files a few shared 6-token runs weigh heavily. Capped by longest shared run.
EXCUSED  31% (max 15%)     557 tok  ui    shell/SignOutDialog.tsx  longest shared run 30  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  31% (max 30%)     329 tok  logic api/types.ts  longest shared run 24  -- Wire types mirror the serialised structs in backend/src; field names and shapes are fixed by the backend contract, so shared sequences are inevitable.
EXCUSED  31% (max 15%)    1494 tok  ui    admin/CreateServerDialog.tsx  longest shared run 33  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  30% (max 15%)     883 tok  ui    admin/channel/MutePanel.tsx  longest shared run 24  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  29% (max 15%)    3334 tok  ui    admin/channel/AccessPanel.tsx  longest shared run 31  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       29% (max 30%)      92 tok  logic api/limits.ts
ok       28% (max 30%)     306 tok  logic lib/capabilities.ts
ok       28% (max 30%)     105 tok  logic lib/toast.ts
EXCUSED  28% (max 15%)     684 tok  ui    voice/CompositionView.tsx  longest shared run 24  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       28% (max 30%)     157 tok  logic chat/logic/links.ts
EXCUSED  27% (max 15%)     995 tok  ui    admin/ChannelSettingsDialog.tsx  longest shared run 28  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  27% (max 15%)    9904 tok  ui    chat.css  longest shared run 36  -- Written from the mockups. Rules use the design-token custom properties and ordinary flex/grid declaration lists, which form long runs by nature; selectors, layout and values are this phase's own. Capped by longest shared run.
ok       27% (max 30%)     192 tok  logic lib/copy.ts
EXCUSED  27% (max 15%)     550 tok  ui    chat/LinkCards.tsx  longest shared run 16  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  26% (max 15%)    3033 tok  ui    admin/settings/Overview.tsx  longest shared run 35  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       26% (max 30%)     548 tok  logic api/endpoints/voice.ts
EXCUSED  26% (max 15%)    1526 tok  ui    shell/AccountMenu.tsx  longest shared run 26  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       26% (max 30%)     964 tok  logic api/endpoints/servers.ts
ok       25% (max 30%)     127 tok  logic voice/view.ts
EXCUSED  25% (max 15%)    1240 tok  ui    voice/CallControls.tsx  longest shared run 28  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  25% (max 15%)    1379 tok  ui    voice/E2ee.tsx  longest shared run 32  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  25% (max 15%)    1809 tok  ui    admin/CreateChannelDialog.tsx  longest shared run 31  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  25% (max 15%)    1109 tok  ui    voice/GridView.tsx  longest shared run 25  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       24% (max 30%)     357 tok  logic api/endpoints/auth.ts
EXCUSED  24% (max 15%)    2118 tok  ui    admin/InviteDialog.tsx  longest shared run 34  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  24% (max 15%)    2995 tok  ui    voice/SceneEditor.tsx  longest shared run 26  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  24% (max 15%)     378 tok  ui    shell/ThemeSwitch.tsx  longest shared run 20  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  24% (max 15%)     633 tok  ui    chat/AttachmentThumb.tsx  longest shared run 17  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  23% (max 15%)    2997 tok  ui    admin/settings/Members.tsx  longest shared run 33  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  23% (max 15%)    7919 tok  ui    voice.css  longest shared run 49  -- Written from the mockups. Rules use the design-token custom properties (--surface-*, --on-surface*, --radius*) and standard flex/grid declaration lists, which form long runs by nature; selectors, layout and values are this phase's own. Capped by longest shared run.
EXCUSED  23% (max 15%)     270 tok  ui    admin/settings/PageHead.tsx  longest shared run 16  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       23% (max 30%)     444 tok  logic voice/sceneStore.ts
ok       23% (max 30%)     525 tok  logic api/endpoints/conversation.ts
ok       23% (max 30%)     427 tok  logic crypto/serverKey.ts
ok       23% (max 30%)     582 tok  logic api/endpoints/channels.ts
EXCUSED  23% (max 15%)    4159 tok  ui    admin/settings/Roles.tsx  longest shared run 33  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       22% (max 30%)     784 tok  logic api/http.ts
ok       22% (max 30%)     197 tok  logic lib/localPrefs.ts
EXCUSED  22% (max 15%)     957 tok  ui    admin/settings/SettingsSidebar.tsx  longest shared run 23  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  22% (max 15%)    2483 tok  ui    chat/Lightbox.tsx  longest shared run 28  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       22% (max 30%)     764 tok  logic crypto/identity.ts
EXCUSED  22% (max 15%)    1198 tok  ui    voice/tiles.tsx  longest shared run 22  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       22% (max 30%)     253 tok  logic i18n/negotiate.ts
EXCUSED  22% (max 15%)     256 tok  ui    voice/VoicePage.tsx  longest shared run 16  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  21% (max 15%)     400 tok  ui    admin/KeyCustody.tsx  longest shared run 16  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  21% (max 15%)   13509 tok  ui    mgmt.css  longest shared run 46  -- Written from the mockups. Rules use the design-token custom properties (--surface-*, --on-surface*, --radius*) and standard flex/grid declaration lists, which form long runs by nature; selectors, layout and values are this phase's own. Capped by longest shared run.
EXCUSED  21% (max 15%)    3035 tok  ui    chat/SearchPanel.tsx  longest shared run 28  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  21% (max 15%)     773 tok  ui    shell/AppShell.tsx  longest shared run 16  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  21% (max 15%)    2599 tok  ui    chat/NotificationsPanel.tsx  longest shared run 33  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  21% (max 15%)    3370 tok  ui    chat/Composer.tsx  longest shared run 36  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  21% (max 15%)     489 tok  ui    shell/UserPanel.tsx  longest shared run 21  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       21% (max 30%)     695 tok  logic chat/notices.ts
EXCUSED  21% (max 15%)    1221 tok  ui    shell/MembersPanel.tsx  longest shared run 20  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  21% (max 15%)     978 tok  ui    components/ui/Form.tsx  longest shared run 17  -- Rewritten from the requirements; the residual overlap is the public contract that existing screens call (prop names, class hooks such as .dialog/.field/.ui-button, ARIA roles) plus framework idioms; in small files a few shared 6-token runs weigh heavily. Capped by longest shared run.
EXCUSED  21% (max 15%)    3317 tok  ui    pages/Invite.tsx  longest shared run 36  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  20% (max 15%)    3010 tok  ui    shell/Sidebar.tsx  longest shared run 28  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  20% (max 15%)    1528 tok  ui    voice/Stage.tsx  longest shared run 20  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       20% (max 30%)     301 tok  logic shell/theme.ts
EXCUSED  20% (max 15%)     135 tok  ui    components/ui/Icon.tsx  longest shared run 11  -- Rewritten from the requirements; the residual overlap is the public contract that existing screens call (prop names, class hooks such as .dialog/.field/.ui-button, ARIA roles) plus framework idioms; in small files a few shared 6-token runs weigh heavily. Capped by longest shared run.
EXCUSED  20% (max 15%)    2510 tok  ui    pages/Account.tsx  longest shared run 28  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  20% (max 15%)     664 tok  ui    components/ui/Display.tsx  longest shared run 15  -- Rewritten from the requirements; the residual overlap is the public contract that existing screens call (prop names, class hooks such as .dialog/.field/.ui-button, ARIA roles) plus framework idioms; in small files a few shared 6-token runs weigh heavily. Capped by longest shared run.
ok       20% (max 30%)     257 tok  logic i18n/messages.ts
EXCUSED  19% (max 15%)     398 tok  ui    admin/settings/SettingsPage.tsx  longest shared run 16  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  19% (max 15%)    3453 tok  ui    voice/GreenRoom.tsx  longest shared run 32  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  19% (max 15%)     587 tok  ui    index.tsx  longest shared run 15  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       19% (max 30%)     393 tok  logic voice/people.ts
EXCUSED  19% (max 15%)     159 tok  ui    components/ui/Logo.tsx  longest shared run 14  -- Rewritten from the requirements; the residual overlap is the public contract that existing screens call (prop names, class hooks such as .dialog/.field/.ui-button, ARIA roles) plus framework idioms; in small files a few shared 6-token runs weigh heavily. Capped by longest shared run.
ok       19% (max 30%)     312 tok  logic sound/triggers.ts
ok       18% (max 30%)     238 tok  logic chat/logic/people.ts
EXCUSED  18% (max 15%)    1969 tok  ui    pages/Auth.tsx  longest shared run 30  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  18% (max 15%)    1003 tok  ui    shell/ServerRail.tsx  longest shared run 29  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  18% (max 15%)    1884 tok  ui    chat/MessageRow.tsx  longest shared run 29  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       18% (max 30%)     169 tok  logic voice/e2eeState.ts
EXCUSED  17% (max 15%)    2025 tok  ui    pages/Unlock.tsx  longest shared run 25  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  17% (max 15%)    2642 tok  ui    voice/AudioVideoSettings.tsx  longest shared run 24  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  17% (max 15%)    2248 tok  ui    admin/channel/InspectPanel.tsx  longest shared run 25  -- Rewritten from the requirements and mockups for frontend-v2-server-admin (state reorganised, handlers extracted, long shared runs broken up). What remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared API call shapes; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  17% (max 15%)     768 tok  ui    shell/Content.tsx  longest shared run 18  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       17% (max 30%)     341 tok  logic api/helpers.ts
EXCUSED  17% (max 15%)     226 tok  ui    components/ui/Button.tsx  longest shared run 14  -- Rewritten from the requirements; the residual overlap is the public contract that existing screens call (prop names, class hooks such as .dialog/.field/.ui-button, ARIA roles) plus framework idioms; in small files a few shared 6-token runs weigh heavily. Capped by longest shared run.
ok       17% (max 30%)    1335 tok  logic chat/thread.ts
EXCUSED  16% (max 15%)    1724 tok  ui    voice/FloatingPlayer.tsx  longest shared run 19  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  16% (max 15%)    4433 tok  ui    chat/ChannelPage.tsx  longest shared run 24  -- Written from the specs, the mockups and the backend contracts for frontend-v2-text-chat, without reading frontend/. The overlap that remains is short framework idiom (solid-js imports, signal declarations, JSX closing tags) and the shared names of the design tokens and API calls; the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
EXCUSED  16% (max 15%)    1366 tok  ui    shell/Hosts.tsx  longest shared run 16  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       15% (max 30%)     189 tok  logic chat/logic/permissions.ts
ok       15% (max 15%)    2998 tok  ui    shell/state.tsx  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       15% (max 15%)    1410 tok  ui    auth/AuthFrame.tsx  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       15% (max 30%)     666 tok  logic api/realtime.ts
ok       15% (max 30%)     533 tok  logic i18n/index.ts
ok       14% (max 15%)    1080 tok  ui    session/session.tsx  -- Written from the requirements. What it shares with the previous frontend is short framework idiom (imports from solid-js and ../i18n, createSignal declarations, closing JSX tags, event-handler templates); the exception holds only while the longest shared run stays at or below the cap, so copied logic would still fail.
ok       14% (max 15%)      95 tok  ui    api/query.tsx
ok       14% (max 30%)     369 tok  logic crypto/channelKey.ts
ok       14% (max 15%)    1193 tok  ui    shell/Topbar.tsx
ok       14% (max 15%)    4164 tok  ui    voice/callSession.tsx
ok       14% (max 30%)     423 tok  logic chat/logic/mentions.ts
ok       13% (max 30%)    1168 tok  logic voice/scene.ts
ok       13% (max 30%)     106 tok  logic i18n/locales.ts
ok       12% (max 15%)    3070 tok  ui    pages/Foundation.tsx
ok       12% (max 30%)     203 tok  logic crypto/identity.manual.ts
ok       12% (max 30%)     436 tok  logic voice/testPattern.ts
ok       12% (max 30%)     608 tok  logic chat/attachments.ts
ok       11% (max 30%)    1639 tok  logic voice/devices.ts
ok       11% (max 30%)    1141 tok  logic voice/preview.ts
ok       11% (max 30%)     851 tok  logic chat/searching.ts
ok       11% (max 30%)     109 tok  logic chat/loaded.ts
ok       11% (max 30%)      80 tok  logic api/ws.ts
ok       11% (max 30%)     612 tok  logic sound/effects.ts
ok       10% (max 30%)     189 tok  logic shell/voice-state.ts
ok       10% (max 30%)     719 tok  logic chat/logic/timeline.ts
ok        9% (max 30%)     293 tok  logic chat/logic/autocomplete.ts
ok        9% (max 30%)     382 tok  logic chat/directory.ts
ok        8% (max 30%)    1331 tok  logic i18n/catalogs/chat.pt-BR.ts
ok        7% (max 30%)     465 tok  logic shell/theme.manual.ts
ok        7% (max 30%)    1232 tok  logic i18n/catalogs/chat.en.ts
ok        6% (max 30%)    1589 tok  logic i18n/catalogs/voice.en.ts
ok        6% (max 30%)    1840 tok  logic i18n/catalogs/voice.pt-BR.ts
ok        5% (max 30%)    2622 tok  logic i18n/catalogs/mgmt.pt-BR.ts
ok        5% (max 30%)    1468 tok  logic i18n/catalogs/settings.en.ts
ok        5% (max 30%)    1684 tok  logic i18n/catalogs/settings.pt-BR.ts
ok        5% (max 30%)    2444 tok  logic i18n/catalogs/pt-BR.ts
ok        5% (max 30%)     422 tok  logic chat/logic/search.ts
ok        5% (max 30%)    2316 tok  logic i18n/catalogs/mgmt.en.ts
ok        4% (max 15%)      97 tok  ui    components/ui/index.tsx
ok        4% (max 15%)    1339 tok  ui    tokens.css
ok        4% (max 30%)    1445 tok  logic chat/logic/emoji.ts
ok        4% (max 30%)     921 tok  logic api/client.ts
ok        4% (max 30%)    2149 tok  logic i18n/catalogs/en.ts
ok        3% (max 15%)    2544 tok  ui    components/ui.css
ok        0% (max 30%)     265 tok  logic api/queryKeys.ts

139 files, weighted overlap 20%, 0 failing
```

## Backend reconciliado (4A.4)

Alterações de backend desde `main` (`git diff main -- backend`):

| Alteração | Ficheiros | Aditiva | Documentada | Testes |
|---|---|---|---|---|
| `GET /api/invites/{code}/handle-available` e limite de pedidos próprio | `api/invites.rs`, `api/mod.rs`, `rate_limit.rs` | Sim: rota nova, nenhuma muda | `docs/v2/contracts/backend-change-policy.md` | `tests/contract/invites.rs` |
| `GET /api/channels/{id}/voice/channel-key` | `api/voice.rs`, `api/mod.rs` | Sim: rota nova, sem migração | idem | `tests/contract/channels_delete.rs` |

`cargo test` (2026-10-02): testes unitários 10/10, contrato **139/139**. O teste de integração `server_isolation::servers_do_not_leak_across_membership` falha (`GET /api/channels/{id}/messages` por quem não é membro devolve um estado diferente de 403 na linha 101). Não é consequência destas alterações: nenhuma toca nas mensagens nem nas permissões, e o registo da política já o apontava como anterior. Fica por corrigir à parte, não bloqueia o corte.

**Rollback:** como as duas alterações só acrescentam rotas e o `frontend/dist` não as usa, a v1 continua a funcionar contra o backend atual.

## Elementos obrigatórios e excluídos (4A.2)

- **Logo oficial:** presente no login, registo e desbloqueio (`auth/AuthFrame.tsx`), na página de convite, no cabeçalho, na barra de servidores e no estado inicial do conteúdo.
- **Camada tipográfica mono:** rótulos em fonte mono (`mono-label`, `Badge mono`) em cartões, chips de estado, contadores e identificadores, em todas as áreas.
- **Excluídos (AUDIT §6) ausentes:** pesquisa no código por dados e bandeja de dados, MLS/ratchet/epochs, BIP-39, QR, multidispositivo, Passkeys, RTT/jitter, RNNoise/AEC/AGC e seletor de codec não encontra nenhuma funcionalidade (só um contador interno `epoch` em `voice/callSession.tsx` e o nome do emoji "dice").

## Auditoria de modo claro e de mobile (secções 1 e 2)

Percorridas em desktop claro (1280×800) e mobile claro e escuro (390×844), com verificação automática de overflow horizontal, contraste WCAG AA, alvos de toque com menos de 24 px e chaves de i18n à vista, mais revisão visual de capturas. Telas: login, registo, desbloqueio, convite, início, canal de texto (mensagens, imagem, lightbox), pesquisa, notificações, emojis, menções, painel de membros, diálogos de convite/criar canal/criar servidor, menu de conta, configurações (visão geral, cargos, membros), configurações de canal (acesso e inspeção), conta, Áudio & Vídeo, pré-entrada, palco, grelha, editor de cena, menu de fundo e PiP. Resultado final: 0 problemas.

Correções feitas: contraste do botão primário em modo claro (`--primary-container` claro de `#c85a3b` para `#c05436`, de 4,22 para 4,6); cabeçalho de autenticação sem overflow em mobile; hora das mensagens em linhas destacadas e em mensagens de sistema; etiquetas e temporizador sobre fundo escuro fixo na pré-entrada e no PiP em modo claro; alvos de toque pequenos (links do login, desbloqueio e convite, campos de filtro de membros e de nome de cargo).

## i18n (secção 3)

`npm run verify:i18n-keys`: 763 chaves usadas, 1150 por idioma, nenhuma em falta nem só num idioma; as famílias de chaves dinâmicas também. Duas chaves em falta corrigidas (`txt.preview.open`, `mgmt.channel.loadingRules`).

## Paridade funcional (4.1, 4.2)

`docs/v2/parity-checklist.md`: todas as linhas têm agora estado. 136 marcadas como verificadas (fase que verificou entre parênteses) e uma, TRV-09 (sessão sobrevive ao corte), com o procedimento em `docs/deploy-producao.md` §14.3 mas **sem execução**, porque o corte não foi feito. As linhas EXC-01 a EXC-06 são exclusões de escopo com motivo.

Como foi verificado: o registo de cada fase (`openspec/changes/archive/*/verification.md`) cobre as suas áreas contra o backend real e um segundo cliente. Nesta fase repeti, com duas e três contas num backend novo, o que mais depende de várias sessões: CRP-02 e CRP-03 (um convidado entra com o dono offline, o dono volta, o backend repete o pedido de chave e o convidado decifra as mensagens seguintes), TXT-01, TXT-03, TXT-05 e TXT-06 (decifrar, tempo real, resposta com citação, apagar a propagar), SRV-19 (convite com registo) e a chamada entre duas sessões. As verificações da v1 como caixa-preta não foram refeitas: os critérios da checklist foram fixados a partir dela e as fases anteriores verificaram contra eles.

Lacunas conhecidas, nenhuma bloqueia o corte: arrastar a imagem ampliada (TXT-10) e o selo "Vídeo" (TXT-11) estão implementados sem teste manual; um convidado só decifra as mensagens posteriores à sua entrada quando o convite não inclui histórico (comportamento esperado do convite).

## Fidelidade (4A.1, 4A.5)

`docs/v2/AUDIT-fidelity.md` §9: 31 entradas reavaliadas, 26 telas em escopo Fiel, 5 fora de escopo ou excluídas, nenhuma Parcial ou Genérica. Capturas em `docs/v2/fidelity/frontend-v2-polish-cutover/`.

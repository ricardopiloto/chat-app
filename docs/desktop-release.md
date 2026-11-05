# Desktop client releases

## Integrity manifest and update notice

The release job generates `SHA256SUMS` for the six installers and attaches it to the same draft GitHub release. Before publishing, confirm that all six files and the manifest are present. `scripts/install-mesa.sh` and `scripts/install-mesa.ps1` install only published releases with this manifest and verify SHA-256 before running an installer. Rerunning a script reinstalls the latest published version. Older releases without a manifest can still be installed by direct download.

The packaged app checks the latest published release on launch and every six hours. If a newer version exists, it displays a banner linking to the release. Updates are manual for every package format; this flow has no `latest*.yml` feed or `electron-updater`.

[`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) packages the Electron shell with `electron-builder`. It does not run on every push.

## Bump the version

The product version appears in three manifests. All three must match; `frontend/package.json` is the source of truth.

- `backend/Cargo.toml`
- `frontend/package.json`
- `frontend/electron/package.json`

The installers use the version in `frontend/package.json` (`electron-builder` reads this manifest with `frontend/` as the project). A tag such as `v1.4.0` is accepted only when `frontend/electron/package.json` says `1.4.0`. Otherwise, the workflow fails before producing installers.

## Trigger a build

- **Build without publishing:** In GitHub Actions, run **Desktop release** with **Run workflow** (`workflow_dispatch`). The three build jobs leave files in the run artifacts. No GitHub release is created.
- **Prepare a release:** Create a `v*` tag, for example `v1.4.0`, on a commit where all three manifests have been updated. The `release` job creates a **draft** GitHub release (`draft: true` in `softprops/action-gh-release`) and attaches the installers. It remains private until someone publishes it on the release page. A manual run without a tag does not execute this job.

The draft is deliberate so the files can be reviewed before the first real release becomes public.

## Platform output

| Runner | Files |
|---|---|
| Linux | `.AppImage`, `.deb`, `.rpm` |
| Windows | `.exe` (NSIS) and `.msi`, without Authenticode signatures |
| macOS | `.dmg` (containing the `.app`), without notarization |

Each filename includes the version from the three manifests. On Linux, the package, executable, and `.desktop` file use `parley-chat-app`; `parley` alone conflicts with KDE's Parley application. `productName` is `Parley` and `appId` is `com.parley.desktop`. Windows and macOS installers use `Parley-<version>`. The changed `appId` creates a new Electron profile; old-installation cleanup happens after the first launch, with consent.

Tagged builds appear on the draft `v*` release at [GitHub releases](https://github.com/ricardopiloto/chat-app/releases). Manual builds appear only in that workflow run's artifacts.

The `.deb` and `.rpm` install `parley-chat-app.desktop` with the icon from `frontend/electron/icons/`. On Wayland, the taskbar icon appears only after package installation; a development window or unpacked directory may retain a generic icon.

## Unsigned installers

Windows and macOS installers are **unsigned and not notarized**. This repository has no Authenticode certificate or Apple Developer account, and the workflow defines no signing variables.

- **Windows:** SmartScreen may block the `.exe` or `.msi` with “Windows protected your PC.” Users who trust the source can choose **More info** and **Run anyway**.
- **macOS:** Gatekeeper may reject the app because its developer cannot be verified. Users who trust the source can allow it under **Privacy & Security** or use the context menu's **Open** action. The package still declares camera and microphone use (`NSCameraUsageDescription` and `NSMicrophoneUsageDescription`) so the system shows permission dialogs.

These warnings remain until signing credentials are available; the installer does not resolve them automatically.

## Start screen and instance selection

The app opens on its start screen with the selected instance, or indicates that none has been selected. **Sign in** and **Create account** use the same authentication as the web client. Without an instance, those actions open the address dialog. The address is saved only after `GET /health` succeeds. **Change** opens the same dialog; **Switch instance** clears the selection and returns to the start screen. External links, including **Learn about Parley**, open in the system browser through the existing handler in `frontend/electron/main.ts`.

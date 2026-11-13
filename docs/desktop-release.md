# Desktop client releases

## Integrity manifest and update notice

The release job generates `SHA256SUMS` for the three official installers (Linux AppImage, Windows NSIS `.exe`, macOS DMG) and attaches it to the same draft GitHub release. Before publishing, confirm that all three files and the manifest are present. `scripts/install-mesa.sh` and `scripts/install-mesa.ps1` install only published releases with this manifest and verify SHA-256 before running an installer. Rerunning a script reinstalls the latest published version. Older releases without a manifest can still be installed by direct download.

The packaged app checks once after its main window loads, with no interval and no GitHub REST API request. Windows NSIS and Linux AppImages in writable directories download a newer published release in the background. A persistent toast offers **Restart now** or **Later**; choosing Later leaves the app running and installs on exit. A connected call requires confirmation before restarting. macOS DMG, AppImages in non-writable directories, and legacy installations (older `.deb` / `.rpm` / MSI still on the machine) only show a release link; they require manual installation or migration to NSIS/AppImage for automatic updates. A failed automatic download falls back to that notice. Version 1.5.0 has no self-updater: install the first version containing it manually once.

The update feed consists of `latest.yml` (Windows NSIS), `latest-linux.yml` (AppImage), and generated `*.blockmap` files for Windows installers (and macOS if produced). The AppImage embeds its blockmap, with `blockMapSize` in `latest-linux.yml`; no separate AppImage `.blockmap` is produced. The workflow uploads them alongside the three installers. The updater checks the downloaded file against the SHA-512 digest in the feed; the install scripts use the separate `SHA256SUMS`. The feed and notice see only published, non-prerelease releases. A draft does not offer an update. The test-only `PARLEY_UPDATE_FEED_URL` accepts only `http(s)` loopback hosts (`127.0.0.1` or `localhost`); other hosts are ignored. Updater logs go to `parley-updater.log` under Electron's `app.getPath("logs")`.

The Linux install script uses `~/.local/bin/parley-chat-app.AppImage`, with no version in the local filename, so an update keeps its desktop shortcut. A manually downloaded AppImage with a version in its filename can be renamed by the updater. AppImage needs FUSE 2 on many distributions; `--appimage-extract-and-run` is a workaround when FUSE 2 is unavailable.

[`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) packages the Electron shell with `electron-builder`. It does not run on every push. Official releases no longer publish `.deb`, `.rpm`, or Windows MSI; migrate those installs to AppImage or NSIS for self-update.

## Bump the version

The product version appears in three manifests. All three must match; `frontend/package.json` is the source of truth.

- `backend/Cargo.toml`
- `frontend/package.json`
- `frontend/electron/package.json`

The installers use the version in `frontend/package.json` (`electron-builder` reads this manifest with `frontend/` as the project). A three-number tag such as `v1.5.1` is accepted only when `frontend/electron/package.json` says `1.4.0`. Otherwise, the workflow fails before producing installers.

## Trigger a build

- **Build without publishing:** In GitHub Actions, run **Desktop release** with **Run workflow** (`workflow_dispatch`). The three build jobs leave files in the run artifacts. No GitHub release is created.
- **Prepare a release:** Create a `vX.Y.Z` tag, for example `v1.5.1`, on a commit where all three manifests have been updated. The `release` job creates a **draft** GitHub release (`draft: true` in `softprops/action-gh-release`) and attaches the installers, feed files, and checksums. It remains private until someone publishes it on the release page. A manual run without a tag does not execute this job.

The draft is deliberate so the files can be reviewed before the first real release becomes public.

## Platform output

| Runner | Files |
|---|---|
| Linux | `.AppImage` |
| Windows | `.exe` (NSIS), without Authenticode signatures |
| macOS | `.dmg` (containing the `.app`), without notarization |

Each filename includes the version from the three manifests. On Linux, the AppImage, executable name, and `.desktop` entry use `parley-chat-app`; `parley` alone conflicts with KDE's Parley application. `productName` is `Parley` and `appId` is `com.parley.desktop`. Windows and macOS installers use `Parley-<version>`. The changed `appId` creates a new Electron profile; old-installation cleanup happens after the first launch, with consent.

Tagged builds appear on the draft `vX.Y.Z` release at [GitHub releases](https://github.com/ricardopiloto/chat-app/releases). Manual builds appear only in that workflow run's artifacts.

## Unsigned installers

Windows and macOS installers are **unsigned and not notarized**. This repository has no Authenticode certificate or Apple Developer account, and the workflow defines no signing variables.

- **Windows:** SmartScreen may block the NSIS `.exe` with “Windows protected your PC.” Users who trust the source can choose **More info** and **Run anyway**.
- **macOS:** Gatekeeper may reject the app because its developer cannot be verified. Users who trust the source can allow it under **Privacy & Security** or use the context menu's **Open** action. The package still declares camera and microphone use (`NSCameraUsageDescription` and `NSMicrophoneUsageDescription`) so the system shows permission dialogs.

These warnings remain until signing credentials are available; the installer does not resolve them automatically.

## Start screen and instance selection

The app opens on its start screen with the selected instance, or indicates that none has been selected. **Sign in** and **Create account** use the same authentication as the web client. Without an instance, those actions open the address dialog. The address is saved only after `GET /health` succeeds. **Change** opens the same dialog; **Switch instance** clears the selection and returns to the start screen. External links, including **Learn about Parley**, open in the system browser through the existing handler in `frontend/electron/main.ts`.

import { basename, join, resolve } from "node:path";

export type LegacyPlatform = "win32" | "darwin" | "linux";
export type LegacyInstallation = { kind: "file" | "windows" | "package"; path: string; manual: string; uninstall?: string; registryKey?: string };
export type LegacyPorts = {
  exists(path: string): Promise<boolean>;
  remove(path: string): Promise<void>;
  registry(): Promise<{ key: string; displayName: string; uninstall: string; location: string; scope: "HKCU" | "HKLM" }[]>;
  packages(): Promise<("deb" | "rpm")[]>;
  execute(file: string, args: string[]): Promise<void>;
  sleep(ms: number): Promise<void>;
};
export type CleanupPorts = LegacyPorts & {
  markerExists(): Promise<boolean>;
  mark(): Promise<void>;
  confirm(): Promise<boolean>;
  inform(message: string): Promise<void>;
  log(message: string): Promise<void>;
};

// Provisional electron-builder NSIS criterion until task 1.1 records a real installation.
// Both the registry key and display name must identify Mesa; HKLM is manual only.
export function isMesaRegistryEntry(entry: { key: string; displayName: string }): boolean {
  return /(?:^|\\)com\.mesa\.desktop(?:$|\\)/i.test(entry.key) && entry.displayName === "Mesa";
}

export async function detectLegacy(platform: LegacyPlatform, home: string, currentExecutable: string, ports: LegacyPorts): Promise<LegacyInstallation[]> {
  const found: LegacyInstallation[] = [];
  const current = resolve(currentExecutable);
  const addFile = async (path: string, manual: string) => {
    if (resolve(path) !== current && await ports.exists(path)) found.push({ kind: "file", path, manual });
  };
  if (platform === "linux") {
    await addFile(join(home, ".local/bin/mesa-chat-app.AppImage"), "Remova ~/.local/bin/mesa-chat-app.AppImage.");
    await addFile(join(home, ".local/share/applications/mesa.desktop"), "Remova ~/.local/share/applications/mesa.desktop.");
    await addFile(join(home, ".local/share/icons/mesa-chat-app.png"), "Remova ~/.local/share/icons/mesa-chat-app.png.");
    for (const packageType of await ports.packages()) found.push({ kind: "package", path: "mesa-chat-app", manual: packageType === "deb" ? "sudo apt remove mesa-chat-app" : "sudo dnf remove mesa-chat-app" });
  } else if (platform === "darwin") {
    await addFile("/Applications/Mesa.app", "Remova /Applications/Mesa.app no Finder.");
    await addFile(join(home, "Applications/Mesa.app"), "Remova ~/Applications/Mesa.app no Finder.");
  } else {
    for (const entry of await ports.registry()) {
      if (!isMesaRegistryEntry(entry) || !entry.uninstall || resolve(entry.location) === current) continue;
      found.push({ kind: entry.scope === "HKCU" ? "windows" : "package", path: entry.location,
        registryKey: entry.key, uninstall: entry.uninstall,
        manual: "Desinstale Mesa em Configurações > Aplicativos instalados." });
    }
  }
  return found;
}

export async function runLegacyCleanup(platform: LegacyPlatform, home: string, executable: string, ports: CleanupPorts): Promise<void> {
  if (await ports.markerExists()) return;
  try {
    const found = await detectLegacy(platform, home, executable, ports);
    if (found.length === 0) { await ports.log("Nenhuma instalação anterior encontrada."); return; }
    const manual = [...new Set(found.map(item => item.manual))].join("\n");
    if (!await ports.confirm()) {
      await ports.log("Remoção recusada.");
      await ports.inform(manual);
      return;
    }
    let failed = false;
    for (const item of found) {
      if (item.kind === "package") { await ports.log(`Remoção manual necessária: ${item.manual}`); failed = true; continue; }
      try {
        if (item.kind === "file") await ports.remove(item.path);
        else {
          await ports.execute(item.uninstall!, ["/S"]);
          let removed = false;
          for (let attempt = 0; attempt < 20; attempt++) {
            const entries = await ports.registry();
            if (!entries.some(entry => entry.key === item.registryKey) && !await ports.exists(item.path)) { removed = true; break; }
            await ports.sleep(500);
          }
          if (!removed) throw new Error("O desinstalador retornou, mas a instalação ainda existe.");
        }
        await ports.log(`Removido: ${basename(item.path)}`);
      } catch (error) { failed = true; await ports.log(`Falha: ${String(error)}; ${item.manual}`); }
    }
    if (failed) await ports.inform(manual);
  } catch (error) {
    await ports.log(`Falha na limpeza: ${String(error)}`);
    await ports.inform("Desinstale Mesa em Aplicativos instalados ou remova a aplicação anterior manualmente.");
  } finally { await ports.mark(); }
}

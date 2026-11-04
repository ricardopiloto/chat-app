import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { detectLegacy, runLegacyCleanup } from '../electron/legacy-cleanup.ts';

const files = new Set();
const calls = [];
let entries = [];
let packages = [];
let marked = false;
let accept = true;
let fail = false;
let autoRemove = true;
const ports = {
  exists: async path => files.has(path),
  remove: async path => { if (fail) throw new Error('permission'); files.delete(path); calls.push(`remove:${path}`); },
  registry: async () => entries,
  packages: async () => packages,
  execute: async () => { calls.push('execute'); if (fail) throw new Error('uninstaller'); if (autoRemove) { entries = []; files.delete('/old/Mesa.exe'); } },
  sleep: async () => {},
  markerExists: async () => marked,
  mark: async () => { marked = true; },
  confirm: async () => { calls.push('confirm'); return accept; },
  inform: async () => { calls.push('inform'); },
  log: async message => { calls.push(`log:${message}`); },
};
const reset = () => { files.clear(); calls.length = 0; entries = []; packages = []; marked = false; accept = true; fail = false; autoRemove = true; };
const appImage = '/home/test/.local/bin/mesa-chat-app.AppImage';
assert.deepEqual(await detectLegacy('linux', '/home/test', '/new/Parley', ports), []);
files.add(appImage);
assert.equal((await detectLegacy('linux', '/home/test', '/new/Parley', ports)).length, 1);
assert.deepEqual(await detectLegacy('linux', '/home/test', appImage, ports), []);
packages = ['deb'];
assert.equal((await detectLegacy('linux', '/home/test', '/new/Parley', ports)).find(i => i.kind === 'package').manual, 'sudo apt remove mesa-chat-app');
reset();
entries = [{ key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\com.mesa.desktop', displayName: 'Other', uninstall: '/old/uninstall.exe', location: '/old/Mesa.exe', scope: 'HKCU' }];
assert.deepEqual(await detectLegacy('win32', '/home/test', '/new/Parley', ports), []);
reset(); files.add(appImage); accept = false;
await runLegacyCleanup('linux', '/home/test', '/new/Parley', ports);
assert(files.has(appImage)); assert(marked); assert(calls.includes('inform'));
const count = calls.length; await runLegacyCleanup('linux', '/home/test', '/new/Parley', ports); assert.equal(calls.length, count);
reset(); files.add(appImage);
await runLegacyCleanup('linux', '/home/test', '/new/Parley', ports); assert(!files.has(appImage)); assert(marked);
reset(); files.add(appImage); fail = true;
await runLegacyCleanup('linux', '/home/test', '/new/Parley', ports); assert(files.has(appImage)); assert(calls.includes('inform')); assert(marked);
reset(); files.add('/old/Mesa.exe');
entries = [{ key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\com.mesa.desktop', displayName: 'Mesa', uninstall: '/old/uninstall.exe', location: '/old/Mesa.exe', scope: 'HKCU' }];
autoRemove = false;
await runLegacyCleanup('win32', '/home/test', '/new/Parley', ports);
assert(calls.includes('execute')); assert(calls.includes('inform')); assert(marked);
const source = readFileSync(new URL('../electron/legacy-cleanup.ts', import.meta.url), 'utf8');
assert(!/AppData|Application Support|\.config\/Mesa|\\\\Mesa/.test(source), 'legacy profile path must never be referenced');
const main = readFileSync(new URL('../electron/main.ts', import.meta.url), 'utf8');
assert(main.includes('if (!app.isPackaged || isDev) return;'));
console.log('legacy cleanup checks passed');

/** Apply volume to every audio element for a remote identity. */
export function applyVolumeForIdentity(
  audioHost: Pick<HTMLElement, "querySelectorAll">,
  identity: string,
  percent: number,
  applyElementVolume: (el: HTMLMediaElement, percent: number) => boolean,
): boolean {
  const elements = Array.from(audioHost.querySelectorAll("audio")) as HTMLMediaElement[];
  const matching = elements.filter((el) => el.dataset.identity === identity);
  if (matching.length === 0) {
    if (identity) console.warn("No remote audio element for identity", { identity, presentIdentities: elements.map((el) => el.dataset.identity) });
    return false;
  }
  let applied = true;
  for (const el of matching) if (!applyElementVolume(el, percent)) applied = false;
  return applied;
}

/** Instance label for the top bar (not persisted). */
export function instanceLabel(hostname: string = location.hostname): string {
  return `instância · ${hostname}`;
}

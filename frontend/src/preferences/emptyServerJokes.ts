/** Light PT-BR jokes for empty-server main pane (041). No offensive/political content. */

const EMPTY_SERVER_JOKES: readonly string[] = [
  "Este servidor está tão vazio que até o eco pediu para sair.",
  "Zero canais. Ideal para quem gosta de silêncio… e de criar o primeiro canal.",
  "Não há canais aqui — só potencial (e esta piada).",
  "Servidor novinho: ainda sem canais, já com personalidade.",
  "A área principal está em branco. A culpa não é sua — ainda não há canais.",
];

/** Random joke per call (may repeat). */
export function pickEmptyServerJoke(): string {
  const i = Math.floor(Math.random() * EMPTY_SERVER_JOKES.length);
  return EMPTY_SERVER_JOKES[i] ?? EMPTY_SERVER_JOKES[0]!;
}

export function emptyServerJokeCount(): number {
  return EMPTY_SERVER_JOKES.length;
}

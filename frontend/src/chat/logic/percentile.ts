/** Map a percentile total 1..=100 to library face values for d100 (tens) + d10 (units). */
export function percentileFaces(total: number): [number, number] {
  if (total === 100) return [100, 0];
  const tens = Math.floor(total / 10) * 10;
  const units = total % 10;
  return [tens === 0 ? 100 : tens, units];
}

export function facesForDiceRoll(sides: number, rolls: number[], faces?: number[]): number[] | undefined {
  if (sides !== 100) return undefined;
  if (Array.isArray(faces) && faces.length === rolls.length * 2 && faces.every((value) => Number.isInteger(value))) {
    return faces;
  }
  return rolls.flatMap((value) => percentileFaces(value));
}

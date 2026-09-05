export type SearchEmptyReason = "channel_not_found" | "voice_only" | "no_results";

export const SEARCH_EMPTY_COPY: Record<SearchEmptyReason, string> = {
  channel_not_found: "Canal não encontrado",
  voice_only: "Só canais de texto",
  no_results: "Sem resultados",
};

export function searchEmptyMessage(reason: SearchEmptyReason): string {
  return SEARCH_EMPTY_COPY[reason];
}

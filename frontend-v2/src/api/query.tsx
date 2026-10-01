import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import type { JSX } from "solid-js";

// Data is fetched through TanStack Query so caching, retries and loading/error state behave the
// same everywhere. The API functions underneath stay framework-free.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

export function AppQueryProvider(props: { children: JSX.Element }) {
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
}

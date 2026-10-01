import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import type { JSX } from "solid-js";
export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
export function AppQueryProvider(props: { children: JSX.Element }) { return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>; }

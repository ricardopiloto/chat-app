const STORAGE_KEY = "mesa.highlightSeen";

type Store = Record<string, true>;

function read(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Store;
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function isHighlightSeen(messageId: string): boolean {
  return !!read()[messageId];
}

export function markHighlightSeen(messageId: string) {
  const store = read();
  if (store[messageId]) return;
  store[messageId] = true;
  write(store);
}

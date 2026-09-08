/**
 * Day separators for text-channel history (client-only).
 * Separators are emitted only for civil days that appear in the loaded rows —
 * calendar gaps (e.g. D1 then D3 with no D2 messages) never invent a D2 line.
 */

export type TimelineMessage = {
  id: string;
  sender: string;
  createdAt?: string;
};

export type DaySeparatorItem = {
  kind: "day-separator";
  dayKey: string;
  label: string;
};

export type MsgGroupItem<T extends TimelineMessage = TimelineMessage> = {
  kind: "msg-group";
  sender: string;
  dayKey: string;
  items: T[];
};

export type TimelineItem<T extends TimelineMessage = TimelineMessage> =
  | DaySeparatorItem
  | MsgGroupItem<T>;

const PT_MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

/** Local civil day `YYYY-MM-DD`, or null if unparseable. */
export function civilDayKey(date: Date | string): string | null {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDayKey(dayKey: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function shiftDayKey(dayKey: string, deltaDays: number): string | null {
  const d = parseDayKey(dayKey);
  if (!d) return null;
  d.setDate(d.getDate() + deltaDays);
  return civilDayKey(d);
}

/** Absolute `DD Mês AAAA` (pt product months). */
export function formatAbsoluteDayLabel(dayKey: string): string {
  const d = parseDayKey(dayKey);
  if (!d) return dayKey;
  const dd = String(d.getDate()).padStart(2, "0");
  const month = PT_MONTHS[d.getMonth()] ?? "";
  return `${dd} ${month} ${d.getFullYear()}`;
}

/**
 * Hoje / Ontem for local today/yesterday; otherwise absolute PT date.
 */
export function formatDayLabel(dayKey: string, now: Date = new Date()): string {
  const today = civilDayKey(now);
  if (!today) return formatAbsoluteDayLabel(dayKey);
  if (dayKey === today) return "Hoje";
  const yesterday = shiftDayKey(today, -1);
  if (yesterday && dayKey === yesterday) return "Ontem";
  return formatAbsoluteDayLabel(dayKey);
}

/**
 * Build render timeline: one day-separator per distinct civil day in `rows`
 * (adjacency only — never fills empty calendar gaps), then same-sender groups
 * that do not cross day boundaries.
 */
export function buildTimeline<T extends TimelineMessage>(
  rows: T[],
  now: Date = new Date(),
): TimelineItem<T>[] {
  const out: TimelineItem<T>[] = [];
  let prevDay: string | null = null;
  let openGroup: MsgGroupItem<T> | null = null;

  const flushGroup = () => {
    if (openGroup && openGroup.items.length > 0) {
      out.push(openGroup);
    }
    openGroup = null;
  };

  for (const row of rows) {
    const parsedKey = row.createdAt ? civilDayKey(row.createdAt) : null;
    // Unparseable timestamps: keep with previous day group if any; else no new separator.
    const dayKey: string | null = parsedKey ?? prevDay;

    if (dayKey && dayKey !== prevDay) {
      flushGroup();
      out.push({
        kind: "day-separator",
        dayKey,
        label: formatDayLabel(dayKey, now),
      });
      prevDay = dayKey;
    }

    const groupDay = dayKey ?? prevDay ?? "unknown";
    if (openGroup && openGroup.sender === row.sender && openGroup.dayKey === groupDay) {
      openGroup.items.push(row);
    } else {
      flushGroup();
      openGroup = {
        kind: "msg-group",
        sender: row.sender,
        dayKey: groupDay,
        items: [row],
      };
    }
  }

  flushGroup();
  return out;
}

/** ms until next local midnight (+1s buffer). */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

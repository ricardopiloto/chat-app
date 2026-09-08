import { civilDayKey } from "./daySeparators";

const PT_MONTH_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

const FALLBACK_CHANNEL = "Canal indisponível";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatHm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function shiftCivilDay(dayKey: string, deltaDays: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setDate(d.getDate() + deltaDays);
  return civilDayKey(d);
}

/** Channel label for notif rows: `#name`, or short fallback (no long UUID). */
export function channelDisplayName(name: string | null | undefined): string {
  const t = name?.trim();
  if (t) return t.startsWith("#") ? t : `#${t}`;
  return FALLBACK_CHANNEL;
}

/**
 * Local relative/short datetime for notification rows:
 * Hoje HH:MM | Ontem HH:MM | DD mmm HH:MM
 */
export function formatNotifWhen(iso: string, now: Date = new Date()): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dayKey = civilDayKey(d);
  const today = civilDayKey(now);
  if (!dayKey || !today) return formatHm(d);
  const hm = formatHm(d);
  if (dayKey === today) return `Hoje ${hm}`;
  const yesterday = shiftCivilDay(today, -1);
  if (yesterday && dayKey === yesterday) return `Ontem ${hm}`;
  const dd = pad2(d.getDate());
  const mon = PT_MONTH_SHORT[d.getMonth()] ?? "";
  return `${dd} ${mon} ${hm}`;
}

import { fetchAndParseSchedule } from './fetch-schedule';
import type { ParsedSchedule } from './safe-array-parser';

interface CacheEntry {
  serviceDate: string;
  schedule: ParsedSchedule;
}

let cache: CacheEntry | null = null;
let inFlight: Promise<ParsedSchedule> | null = null;

/**
 * Enoden's service day rolls over ~3am JST, not midnight (see position-calculator's
 * getServiceMinutesNow) — a request at 1am JST belongs to the previous calendar
 * day's timetable. Computed in JST regardless of the server's local timezone
 * (Vercel functions run in UTC).
 */
export function getServiceDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  let year = Number(lookup.year);
  let month = Number(lookup.month);
  let day = Number(lookup.day);
  const hour = Number(lookup.hour === '24' ? '0' : lookup.hour);

  if (hour < 3) {
    const rolled = new Date(Date.UTC(year, month - 1, day));
    rolled.setUTCDate(rolled.getUTCDate() - 1);
    year = rolled.getUTCFullYear();
    month = rolled.getUTCMonth() + 1;
    day = rolled.getUTCDate();
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Best-effort per-instance cache: Vercel doesn't guarantee a single warm instance
 * or shared memory across scale-events/regions, so this may still re-fetch more
 * than once per service day under load. Acceptable for this app's traffic — revisit
 * with Vercel KV/Upstash if stricter throttling is ever needed.
 */
export async function getSchedule(): Promise<ParsedSchedule> {
  const key = getServiceDateKey(new Date());
  if (cache && cache.serviceDate === key) return cache.schedule;
  if (inFlight) return inFlight;

  inFlight = fetchAndParseSchedule()
    .then((schedule) => {
      cache = { serviceDate: key, schedule };
      return schedule;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

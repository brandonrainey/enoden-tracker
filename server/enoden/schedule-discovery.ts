// Locates today's schedule <script> URL. loo-ool.com's /rail/EN/ page loads its
// timetable data via a plain <script src="/rail/js/EN/J<date>EN/<n>/?<ts>"> tag
// (not an XHR/fetch — easy to miss in DevTools' Network tab), so it must be
// discovered from the page HTML rather than called directly with a static URL.

const PAGE_URL = 'https://loo-ool.com/rail/EN/';

export const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en;q=0.9',
  Referer: PAGE_URL,
};

export async function discoverScheduleUrl(): Promise<string> {
  const response = await fetch(PAGE_URL, { headers: BROWSER_HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${PAGE_URL}: HTTP ${response.status}`);
  }
  const html = await response.text();

  const scriptMatch = /<script\s+src=['"](\/rail\/js\/EN\/J[^'"]+)['"]/i.exec(html);
  if (!scriptMatch) {
    throw new Error('Could not locate the schedule <script> tag on loo-ool.com/rail/EN/');
  }
  const scriptPath = scriptMatch[1];

  // The cache-bust param mirrors the data-tsc/data-tsf attributes that govern the
  // coo.json/f.json endpoints. Which attribute governs THIS script has not been
  // empirically confirmed yet — falls back to data-tsf as a reasonable default.
  // Verify against the live page during Phase 4 testing and adjust if the fetched
  // schedule is ever stale.
  const tsMatch = /data-tsf=['"]?(\d+)['"]?/i.exec(html);
  const ts = tsMatch ? tsMatch[1] : Date.now().toString();

  const separator = scriptPath.includes('?') ? '&' : '?';
  return `https://loo-ool.com${scriptPath}${separator}${ts}`;
}

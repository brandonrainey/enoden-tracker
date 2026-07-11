import { discoverScheduleUrl, BROWSER_HEADERS } from './schedule-discovery.js';
import { parseLooOolSchedule, type ParsedSchedule } from './safe-array-parser.js';

export async function fetchAndParseSchedule(): Promise<ParsedSchedule> {
  const scheduleUrl = await discoverScheduleUrl();
  const response = await fetch(scheduleUrl, { headers: BROWSER_HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch schedule script ${scheduleUrl}: HTTP ${response.status}`);
  }
  const rawScript = await response.text();
  return parseLooOolSchedule(rawScript);
}

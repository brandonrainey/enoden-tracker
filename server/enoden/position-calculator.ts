// Faithful TypeScript port of the position-computing logic reverse-engineered from
// loo-ool.com's minified `vt()` function. No I/O — pure functions over already-parsed
// schedule data. Deliberately skips the site's own "+18" pixel-offset constant (that's
// specific to its canvas rendering, not meaningful for a text summary).

import type { ParsedSchedule } from './safe-array-parser.js';

export interface ActiveTrain {
  /** loo-ool trip identifier with its leading "$" stripped, e.g. "200". Not yet
   * resolved to a physical formation number (e.g. "1501F") — see project notes. */
  tripId: string;
  direction: 1 | 2;
  prevStationIndex: number;
  nextStationIndex: number;
  /** 0..1 progress from prevStationIndex toward nextStationIndex. */
  fraction: number;
  /** True when the train is on its last scheduled leg ("+"-prefixed terminal waypoint). */
  isFinalLeg: boolean;
}

/**
 * Enoden's service day rolls over ~3am, not midnight: a 1am timestamp belongs to
 * the *previous* service day's timetable, so it's represented as >1440.
 */
export function getServiceMinutesNow(date: Date): number {
  let minutes = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  if (minutes < 180) minutes += 1440;
  return minutes;
}

function parseWaypointTime(value: number | string): { time: number; isFinal: boolean } {
  if (typeof value === 'number') return { time: value, isFinal: false };
  const isFinal = value.startsWith('+');
  const time = Number(isFinal ? value.slice(1) : value);
  if (Number.isNaN(time)) {
    throw new Error(`Invalid waypoint time value: ${JSON.stringify(value)}`);
  }
  return { time, isFinal };
}

/**
 * Computes every currently-active (in-service) train and which station-pair
 * segment it is currently between, given the day's parsed schedule and the
 * current service-minutes-since-midnight (see getServiceMinutesNow).
 */
export function computeActiveTrains(schedule: ParsedSchedule, nowMinutes: number): ActiveTrain[] {
  const { TLD, STP } = schedule;
  const results: ActiveTrain[] = [];

  for (const row of TLD) {
    const startMin = row[0] as number;
    const endMin = row[1] as number;
    if (!(startMin <= nowMinutes && nowMinutes <= endMin)) continue;

    const direction = row[2] as 1 | 2;
    const tripIdRaw = row[3] as string;
    const tripId = tripIdRaw.startsWith('$') ? tripIdRaw.slice(1) : tripIdRaw;
    const waypointLength = row[10] as number;
    const waypointEnd = 11 + waypointLength; // exclusive upper bound of the pair list

    let s = 13;
    while (s < waypointEnd) {
      const { time } = parseWaypointTime(row[s]);
      if (nowMinutes <= time) break;
      s += 2;
    }
    if (s >= waypointEnd) continue; // no matching upcoming waypoint (shouldn't happen for well-formed rows)

    const prevStationIndex = row[s - 1] as number;
    const nextStationIndex = row[s + 1] as number;
    const { time: prevTime } = parseWaypointTime(row[s - 2]);
    const { time: currTime, isFinal } = parseWaypointTime(row[s]);

    if (currTime === prevTime) continue; // avoid div-by-zero
    if (!(STP[prevStationIndex] > 0) || !(STP[nextStationIndex] > 0)) continue;

    const isSameStation = nextStationIndex === prevStationIndex;
    const prevPrevValid = s > 13 && STP[row[s - 3] as number] > 0;
    if (!(!isSameStation || s === 13 || prevPrevValid)) continue;

    const fraction = Math.min(1, Math.max(0, (nowMinutes - prevTime) / (currTime - prevTime)));

    results.push({
      tripId,
      direction,
      prevStationIndex,
      nextStationIndex,
      fraction,
      isFinalLeg: isFinal,
    });
  }

  return results;
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSchedule, getServiceDateKey } from '../server/enoden/timetable-cache.js';
import { getServiceMinutesNow, computeActiveTrains } from '../server/enoden/position-calculator.js';

export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const schedule = await getSchedule();
    const now = new Date();
    const nowMinutes = getServiceMinutesNow(now);
    const activeTrains = computeActiveTrains(schedule, nowMinutes);

    const trains = activeTrains.map((train) => ({
      tripId: train.tripId,
      direction: train.direction,
      prevStation: schedule.STN[train.prevStationIndex],
      nextStation: schedule.STN[train.nextStationIndex],
      fraction: train.fraction,
      isFinalLeg: train.isFinalLeg,
    }));

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=15');
    res.status(200).json({
      generatedAt: now.toISOString(),
      serviceDate: getServiceDateKey(now),
      trains,
    });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : String(error) });
  }
}

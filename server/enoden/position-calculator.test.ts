import { describe, expect, it } from 'vitest';
import { computeActiveTrains, getServiceMinutesNow } from './position-calculator.js';
import { parseLooOolSchedule } from './safe-array-parser.js';
import { SAMPLE_SCHEDULE_SCRIPT } from './__fixtures__/sample-schedule.js';

const schedule = parseLooOolSchedule(SAMPLE_SCHEDULE_SCRIPT);

describe('getServiceMinutesNow', () => {
  it('rolls over times before 3am JST into the previous service day (adds 1440)', () => {
    // 2026-07-06 01:30:00 JST == 2026-07-05 16:30:00 UTC. Constructed via Date.UTC
    // so the test is unambiguous regardless of the runner's local timezone.
    const oneThirtyAmJst = new Date(Date.UTC(2026, 6, 5, 16, 30, 0));
    expect(getServiceMinutesNow(oneThirtyAmJst)).toBeCloseTo(1440 + 90, 5);
  });

  it('does not roll over times at/after 3am JST', () => {
    // 2026-07-06 04:00:00 JST == 2026-07-05 19:00:00 UTC.
    const fourAmJst = new Date(Date.UTC(2026, 6, 5, 19, 0, 0));
    expect(getServiceMinutesNow(fourAmJst)).toBeCloseTo(240, 5);
  });
});

describe('computeActiveTrains', () => {
  it('interpolates a mid-segment position for an active trip ($200 at t=330)', () => {
    const results = computeActiveTrains(schedule, 330);
    const trip200 = results.find((r) => r.tripId === '200');

    expect(trip200).toBeDefined();
    expect(trip200).toMatchObject({
      tripId: '200',
      direction: 2,
      prevStationIndex: 15,
      nextStationIndex: 6,
      isFinalLeg: false,
    });
    expect(trip200!.fraction).toBeCloseTo((330 - 320) / (342 - 320), 5);
  });

  it('handles a dwell at the origin terminal (s===13 guard, same station both ends)', () => {
    // At t=320, trip $200 is still sitting at its first waypoint (station 15,
    // scheduled 315-320) before departing toward station 6 at t=342.
    const results = computeActiveTrains(schedule, 320);
    const trip200 = results.find((r) => r.tripId === '200');

    expect(trip200).toBeDefined();
    expect(trip200!.prevStationIndex).toBe(15);
    expect(trip200!.nextStationIndex).toBe(15);
    expect(trip200!.fraction).toBeCloseTo(1, 5);

    // trip $10 (310-329) is also active at t=320, between stations 6 and 1.
    const trip10 = results.find((r) => r.tripId === '10');
    expect(trip10).toBeDefined();
    expect(trip10).toMatchObject({ prevStationIndex: 6, nextStationIndex: 1, direction: 2 });
    expect(trip10!.fraction).toBeCloseTo((320 - 315) / (324 - 315), 5);
  });

  it('marks the terminal leg as final and strips the "+" time prefix (s>13 guard)', () => {
    const results = computeActiveTrains(schedule, 360);
    const trip200 = results.find((r) => r.tripId === '200');

    expect(trip200).toBeDefined();
    expect(trip200!.isFinalLeg).toBe(true);
    expect(trip200!.prevStationIndex).toBe(1);
    expect(trip200!.nextStationIndex).toBe(1);
    expect(trip200!.fraction).toBeCloseTo((360 - 359) / (364 - 359), 5);
  });

  it('excludes trips outside their scheduled start/end window', () => {
    const results = computeActiveTrains(schedule, 1000);
    expect(results.find((r) => r.tripId === '10')).toBeUndefined();
    expect(results.find((r) => r.tripId === '200')).toBeUndefined();
    expect(results.find((r) => r.tripId === '11')).toBeUndefined();
  });
});

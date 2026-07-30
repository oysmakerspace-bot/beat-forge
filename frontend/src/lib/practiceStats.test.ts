import { computeStreak, dayKey, maxTempoByDay, PracticeSession } from './practiceStats';

const DAY_MS = 24 * 60 * 60 * 1000;

const makeSession = (overrides: Partial<PracticeSession>): PracticeSession => ({
  id: 'test',
  startedAt: Date.now(),
  endedAt: Date.now() + 5000,
  startTempo: 100,
  endTempo: 100,
  timeSignature: '4/4',
  subdivision: 'Quarter',
  ...overrides,
});

describe('dayKey', () => {
  test('formats a timestamp as YYYY-MM-DD in local time', () => {
    const d = new Date(2026, 0, 5, 23, 59); // Jan 5 2026, local time
    expect(dayKey(d.getTime())).toBe('2026-01-05');
  });
});

describe('computeStreak', () => {
  test('returns 0 for no sessions', () => {
    expect(computeStreak([])).toBe(0);
  });

  test('returns 0 if the most recent session is more than a day old', () => {
    const now = Date.now();
    const sessions = [makeSession({ startedAt: now - 3 * DAY_MS })];
    expect(computeStreak(sessions, now)).toBe(0);
  });

  test('counts consecutive days ending today', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ startedAt: now }),
      makeSession({ startedAt: now - DAY_MS }),
      makeSession({ startedAt: now - 2 * DAY_MS }),
    ];
    expect(computeStreak(sessions, now)).toBe(3);
  });

  test('still counts the streak if today has no session yet but yesterday does', () => {
    const now = Date.now();
    const sessions = [makeSession({ startedAt: now - DAY_MS })];
    expect(computeStreak(sessions, now)).toBe(1);
  });

  test('stops at the first gap', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ startedAt: now }),
      makeSession({ startedAt: now - 2 * DAY_MS }), // gap on "yesterday"
    ];
    expect(computeStreak(sessions, now)).toBe(1);
  });
});

describe('maxTempoByDay', () => {
  test('buckets sessions by day and takes the max tempo reached', () => {
    const now = Date.now();
    const sessions = [
      makeSession({ startedAt: now, startTempo: 100, endTempo: 140 }),
      makeSession({ startedAt: now, startTempo: 90, endTempo: 95 }),
      makeSession({ startedAt: now - DAY_MS, startTempo: 200, endTempo: 200 }),
    ];
    const result = maxTempoByDay(sessions, 3, now);
    expect(result).toHaveLength(3);
    expect(result[2].maxTempo).toBe(140); // today
    expect(result[1].maxTempo).toBe(200); // yesterday
    expect(result[0].maxTempo).toBe(0); // two days ago, no sessions
  });
});

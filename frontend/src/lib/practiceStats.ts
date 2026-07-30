export interface PracticeSession {
  id: string;
  startedAt: number;
  endedAt: number;
  startTempo: number;
  endTempo: number;
  timeSignature: string;
  subdivision: string;
}

export const dayKey = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const computeStreak = (sessions: PracticeSession[], now: number = Date.now()): number => {
  if (sessions.length === 0) return 0;

  const practicedDays = new Set(sessions.map((s) => dayKey(s.startedAt)));
  const cursor = new Date(now);

  if (!practicedDays.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!practicedDays.has(dayKey(cursor.getTime()))) {
      return 0;
    }
  }

  let streak = 0;
  while (practicedDays.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export interface DayTempo {
  day: string;
  maxTempo: number;
}

export const maxTempoByDay = (
  sessions: PracticeSession[],
  days: number,
  now: number = Date.now()
): DayTempo[] => {
  const result: DayTempo[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    const maxTempo = sessions
      .filter((s) => dayKey(s.startedAt) === key)
      .reduce((max, s) => Math.max(max, s.startTempo, s.endTempo), 0);
    result.push({ day: key, maxTempo });
  }
  return result;
};

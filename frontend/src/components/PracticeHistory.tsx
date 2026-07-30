import React from 'react';
import { usePracticeHistoryStore } from '@/store/practiceHistoryStore';
import { computeStreak, maxTempoByDay } from '@/lib/practiceStats';

const TREND_DAYS = 14;
const MAX_RECENT_SESSIONS = 10;

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const PracticeHistory: React.FC = () => {
  const sessions = usePracticeHistoryStore((s) => s.sessions);
  const streak = computeStreak(sessions);
  const trend = maxTempoByDay(sessions, TREND_DAYS);
  const maxTrendTempo = Math.max(...trend.map((t) => t.maxTempo), 1);

  if (sessions.length === 0) {
    return (
      <div className="w-full max-w-md mt-8 text-center text-sm text-muted-foreground">
        Practice sessions will show up here once you run the metronome for a few seconds.
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Practice History</h2>
        <span className="text-sm text-muted-foreground">
          {streak > 0 ? `${streak} day streak` : 'No active streak'}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${TREND_DAYS * 20} 40`}
        className="w-full h-10"
        preserveAspectRatio="none"
        role="img"
        aria-label="Max tempo practiced per day, last 14 days"
      >
        {trend.map((point, i) => (
          <rect
            key={point.day}
            x={i * 20 + 4}
            y={40 - (point.maxTempo / maxTrendTempo) * 36}
            width={12}
            height={Math.max((point.maxTempo / maxTrendTempo) * 36, 1)}
            className={point.maxTempo > 0 ? 'fill-primary' : 'fill-muted'}
          />
        ))}
      </svg>

      <ul className="space-y-2 text-sm">
        {sessions.slice(0, MAX_RECENT_SESSIONS).map((session) => (
          <li key={session.id} className="flex justify-between border-b border-border pb-1">
            <span>
              {new Date(session.startedAt).toLocaleDateString()} · {session.timeSignature} ·{' '}
              {session.subdivision}
            </span>
            <span>
              {session.startTempo === session.endTempo
                ? `${session.startTempo} BPM`
                : `${session.startTempo}→${session.endTempo} BPM`}
              {' · '}
              {formatDuration(session.endedAt - session.startedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PracticeHistory;

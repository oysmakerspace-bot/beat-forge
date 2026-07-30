import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PracticeSession } from '../lib/practiceStats';

const MIN_SESSION_DURATION_MS = 3000;
const MAX_STORED_SESSIONS = 200;

interface PracticeHistoryState {
  sessions: PracticeSession[];
  addSession: (session: Omit<PracticeSession, 'id'>) => void;
}

export const usePracticeHistoryStore = create<PracticeHistoryState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) => {
        if (session.endedAt - session.startedAt < MIN_SESSION_DURATION_MS) {
          return;
        }
        set((state) => ({
          sessions: [
            { ...session, id: `${session.startedAt}-${Math.random().toString(36).slice(2, 8)}` },
            ...state.sessions,
          ].slice(0, MAX_STORED_SESSIONS),
        }));
      },
    }),
    { name: 'beatforge-practice-history' }
  )
);

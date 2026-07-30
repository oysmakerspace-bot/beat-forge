import { usePracticeHistoryStore } from './practiceHistoryStore';

const baseSession = {
  timeSignature: '4/4',
  subdivision: 'Quarter',
  startTempo: 100,
  endTempo: 100,
};

describe('practiceHistoryStore', () => {
  beforeEach(() => {
    usePracticeHistoryStore.setState({ sessions: [] });
    window.localStorage.clear();
  });

  test('ignores sessions shorter than the minimum duration', () => {
    const now = Date.now();
    usePracticeHistoryStore.getState().addSession({
      ...baseSession,
      startedAt: now,
      endedAt: now + 500,
    });
    expect(usePracticeHistoryStore.getState().sessions).toHaveLength(0);
  });

  test('records sessions at or above the minimum duration, newest first', () => {
    const now = Date.now();
    usePracticeHistoryStore.getState().addSession({
      ...baseSession,
      startedAt: now,
      endedAt: now + 3000,
    });
    usePracticeHistoryStore.getState().addSession({
      ...baseSession,
      startedAt: now + 10000,
      endedAt: now + 20000,
    });

    const { sessions } = usePracticeHistoryStore.getState();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].startedAt).toBe(now + 10000);
    expect(sessions[1].startedAt).toBe(now);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import PracticeHistory from './PracticeHistory';
import { usePracticeHistoryStore } from '@/store/practiceHistoryStore';

describe('PracticeHistory', () => {
  beforeEach(() => {
    usePracticeHistoryStore.setState({ sessions: [] });
    window.localStorage.clear();
  });

  test('shows an empty state when there is no history yet', () => {
    render(<PracticeHistory />);
    expect(
      screen.getByText(/practice sessions will show up here/i)
    ).toBeInTheDocument();
  });

  test('lists sessions and the current streak once history exists', () => {
    const now = Date.now();
    usePracticeHistoryStore.getState().addSession({
      startedAt: now,
      endedAt: now + 10000,
      startTempo: 100,
      endTempo: 120,
      timeSignature: '3/4',
      subdivision: 'Eighth',
    });

    render(<PracticeHistory />);
    expect(screen.getByText('1 day streak')).toBeInTheDocument();
    expect(screen.getByText(/100→120 BPM/)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders metronome component', () => {
  render(<App />);
  const linkElement = screen.getByText(/BPM/i);
  expect(linkElement).toBeInTheDocument();
});

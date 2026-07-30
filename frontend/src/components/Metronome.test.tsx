import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Metronome from './Metronome';

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn(),
    },
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
    },
  })),
  suspend: jest.fn(),
  resume: jest.fn(),
  currentTime: 0,
  destination: {},
};

// Mocking AudioContext and webkitAudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudioContext),
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudioContext),
});


describe('Metronome component', () => {
  beforeEach(() => {
    // CRA's Jest config runs with resetMocks: true, which strips
    // mockImplementation before every test, so it must be re-armed here.
    jest.clearAllMocks();
    (window.AudioContext as jest.Mock).mockImplementation(() => mockAudioContext);
    ((window as any).webkitAudioContext as jest.Mock).mockImplementation(() => mockAudioContext);
  });

  test('renders initial state correctly', () => {
    render(<Metronome />);
    expect(screen.getByText('120 BPM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  });

  test('starts and stops the metronome', async () => {
    render(<Metronome />);
    const startButton = screen.getByRole('button', { name: 'Start' });
    await userEvent.click(startButton);
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    expect(window.AudioContext).toHaveBeenCalledTimes(1);

    const stopButton = screen.getByRole('button', { name: 'Stop' });
    await userEvent.click(stopButton);
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(mockAudioContext.suspend).toHaveBeenCalledTimes(1);
  });

  test('changes tempo with input', async () => {
    render(<Metronome />);
    const tempoInput = screen.getByRole('spinbutton');
    await userEvent.clear(tempoInput);
    await userEvent.type(tempoInput, '150');
    expect(screen.getByText('150 BPM')).toBeInTheDocument();
  });

  test('changes time signature', async () => {
    render(<Metronome />);
    const trigger = screen.getAllByRole('combobox')[0]; // First one is time signature
    await userEvent.click(trigger);

    const option = await screen.findByRole('option', { name: '3/4' });
    await userEvent.click(option);

    const triggerAfterClick = await screen.findByText('3/4');
    expect(triggerAfterClick).toBeInTheDocument();
  });

  test('changes subdivision', async () => {
    render(<Metronome />);
    const trigger = screen.getAllByRole('combobox')[1]; // Second one is subdivision
    await userEvent.click(trigger);

    const option = await screen.findByRole('option', { name: 'Eighth' });
    await userEvent.click(option);

    const triggerAfterClick = await screen.findByText('Eighth');
    expect(triggerAfterClick).toBeInTheDocument();
  });
});

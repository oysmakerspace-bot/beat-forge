import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { usePracticeHistoryStore } from '@/store/practiceHistoryStore';

const SUBDIVISION_CLICKS_PER_BEAT: Record<string, number> = {
  Quarter: 1,
  Eighth: 2,
  Triplet: 3,
  Sixteenth: 4,
};

const SCHEDULE_AHEAD_TIME = 0.1; // seconds of audio to keep scheduled
const SCHEDULER_INTERVAL = 25; // ms between scheduler ticks
const CLICK_DURATION = 0.05; // seconds

const Metronome: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [subdivision, setSubdivision] = useState('Quarter');
  const [beat, setBeat] = useState(false);
  const [isAccent, setIsAccent] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerIdRef = useRef<number | null>(null);
  const nextClickTimeRef = useRef(0);
  const currentClickRef = useRef(0);
  const visualTimeoutsRef = useRef<number[]>([]);
  const sessionStartRef = useRef<{ startedAt: number; startTempo: number } | null>(null);
  const addSession = usePracticeHistoryStore((s) => s.addSession);

  const beatsPerBar = parseInt(timeSignature.split('/')[0], 10);
  const clicksPerBeat = SUBDIVISION_CLICKS_PER_BEAT[subdivision] ?? 1;

  const tempoRef = useRef(tempo);
  const beatsPerBarRef = useRef(beatsPerBar);
  const clicksPerBeatRef = useRef(clicksPerBeat);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar;
    clicksPerBeatRef.current = clicksPerBeat;
    currentClickRef.current = 0;
  }, [beatsPerBar, clicksPerBeat]);

  const scheduleClick = (clickIndex: number, time: number) => {
    const ctx = audioContextRef.current!;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const isBeatStart = clickIndex % clicksPerBeatRef.current === 0;
    const beatNumber = Math.floor(clickIndex / clicksPerBeatRef.current);
    const isDownbeat = isBeatStart && beatNumber === 0;

    if (isDownbeat) {
      osc.frequency.setValueAtTime(1320, time);
      gainNode.gain.setValueAtTime(1, time);
    } else if (isBeatStart) {
      osc.frequency.setValueAtTime(880, time);
      gainNode.gain.setValueAtTime(0.7, time);
    } else {
      osc.frequency.setValueAtTime(660, time);
      gainNode.gain.setValueAtTime(0.35, time);
    }

    osc.start(time);
    osc.stop(time + CLICK_DURATION);

    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
    const showTimeout = window.setTimeout(() => {
      setIsAccent(isDownbeat);
      setBeat(true);
      const hideTimeout = window.setTimeout(() => setBeat(false), 100);
      visualTimeoutsRef.current.push(hideTimeout);
    }, delayMs);
    visualTimeoutsRef.current.push(showTimeout);
  };

  const advanceClick = () => {
    const secondsPerBeat = 60.0 / tempoRef.current;
    const secondsPerClick = secondsPerBeat / clicksPerBeatRef.current;
    nextClickTimeRef.current += secondsPerClick;
    const totalClicks = beatsPerBarRef.current * clicksPerBeatRef.current;
    currentClickRef.current = (currentClickRef.current + 1) % totalClicks;
  };

  const schedulerTick = () => {
    const ctx = audioContextRef.current!;
    while (nextClickTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleClick(currentClickRef.current, nextClickTimeRef.current);
      advanceClick();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      currentClickRef.current = 0;
      nextClickTimeRef.current = audioContextRef.current.currentTime + 0.05;
      schedulerIdRef.current = window.setInterval(schedulerTick, SCHEDULER_INTERVAL);
      sessionStartRef.current = { startedAt: Date.now(), startTempo: tempo };
    } else {
      if (schedulerIdRef.current !== null) {
        clearInterval(schedulerIdRef.current);
        schedulerIdRef.current = null;
      }
      visualTimeoutsRef.current.forEach(clearTimeout);
      visualTimeoutsRef.current = [];
      setBeat(false);
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
      if (sessionStartRef.current) {
        addSession({
          startedAt: sessionStartRef.current.startedAt,
          endedAt: Date.now(),
          startTempo: sessionStartRef.current.startTempo,
          endTempo: tempo,
          timeSignature,
          subdivision,
        });
        sessionStartRef.current = null;
      }
    }
    return () => {
      if (schedulerIdRef.current !== null) {
        clearInterval(schedulerIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTempoChange = (value: number[]) => {
    setTempo(value[0]);
  };

  const handleTimeSignatureChange = (value: string) => {
    setTimeSignature(value);
  };

  const handleSubdivisionChange = (value: string) => {
    setSubdivision(value);
  };

  return (
    <div className="flex flex-col items-center p-8 space-y-4">
      <motion.div
        className={`w-16 h-16 rounded-full ${isAccent ? 'bg-primary' : 'bg-secondary'}`}
        animate={{ scale: beat ? (isAccent ? 1.35 : 1.2) : 1 }}
        transition={{ duration: 0.1 }}
      />
      <h1 className="text-4xl font-bold">{tempo} BPM</h1>
      <div className="w-full max-w-md">
        <Slider
          value={[tempo]}
          onValueChange={handleTempoChange}
          min={20}
          max={300}
          step={1}
        />
      </div>
      <div className="flex items-center space-x-4">
        <Button onClick={handlePlayPause}>{isPlaying ? 'Stop' : 'Start'}</Button>
        <Input
          type="number"
          value={tempo}
          onChange={(e) => {
            const newTempo = parseInt(e.target.value);
            if (!isNaN(newTempo)) {
              setTempo(newTempo);
            }
          }}
          className="w-24"
        />
      </div>
      <div className="flex space-x-4">
        <Select value={timeSignature} onValueChange={handleTimeSignatureChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Signature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2/4">2/4</SelectItem>
            <SelectItem value="3/4">3/4</SelectItem>
            <SelectItem value="4/4">4/4</SelectItem>
            <SelectItem value="6/8">6/8</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subdivision} onValueChange={handleSubdivisionChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subdivision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Quarter">Quarter</SelectItem>
            <SelectItem value="Eighth">Eighth</SelectItem>
            <SelectItem value="Triplet">Triplet</SelectItem>
            <SelectItem value="Sixteenth">Sixteenth</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Metronome;

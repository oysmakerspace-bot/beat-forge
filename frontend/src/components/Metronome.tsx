import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const Metronome: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [subdivision, setSubdivision] = useState('Quarter');
  const [beat, setBeat] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const scheduleNote = () => {
        setBeat(true);
        setTimeout(() => setBeat(false), 100);
        const osc = audioContextRef.current!.createOscillator();
        osc.frequency.setValueAtTime(880, audioContextRef.current!.currentTime);
        osc.connect(audioContextRef.current!.destination);
        osc.start(audioContextRef.current!.currentTime);
        osc.stop(audioContextRef.current!.currentTime + 0.1);
      };

      const interval = (60 / tempo) * 1000;
      intervalRef.current = window.setInterval(scheduleNote, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, tempo]);

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
        className="w-16 h-16 bg-primary rounded-full"
        animate={{ scale: beat ? 1.2 : 1 }}
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

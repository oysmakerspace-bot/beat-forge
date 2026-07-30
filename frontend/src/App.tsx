import React from 'react';
import Metronome from './components/Metronome';
import PracticeHistory from './components/PracticeHistory';

function App() {
  return (
    <div className="flex flex-col items-center min-h-screen py-8">
      <Metronome />
      <PracticeHistory />
    </div>
  );
}

export default App;

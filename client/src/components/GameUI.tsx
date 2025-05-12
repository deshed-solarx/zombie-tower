import { useState, useEffect } from 'react';
import { useAudio } from '../lib/stores/useAudio';

const GameUI = () => {
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const { isMuted, toggleMute } = useAudio();

  // Subscribe to game events via a custom event system
  useEffect(() => {
    const handleScoreUpdate = (e: CustomEvent) => {
      setScore(e.detail.score);
    };

    const handleHealthUpdate = (e: CustomEvent) => {
      setHealth(e.detail.health);
    };

    const handleWaveUpdate = (e: CustomEvent) => {
      setWave(e.detail.wave);
    };

    // Add event listeners
    window.addEventListener('game:score-update' as any, handleScoreUpdate as EventListener);
    window.addEventListener('game:health-update' as any, handleHealthUpdate as EventListener);
    window.addEventListener('game:wave-update' as any, handleWaveUpdate as EventListener);

    return () => {
      // Remove event listeners
      window.removeEventListener('game:score-update' as any, handleScoreUpdate as EventListener);
      window.removeEventListener('game:health-update' as any, handleHealthUpdate as EventListener);
      window.removeEventListener('game:wave-update' as any, handleWaveUpdate as EventListener);
    };
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none">
      <div className="flex justify-between items-start">
        {/* Score and wave display */}
        <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
          <div className="text-lg font-semibold">Score: {score}</div>
          <div className="text-sm">Wave: {wave}</div>
        </div>
        
        {/* Health bar */}
        <div className="w-48">
          <div className="text-white text-center mb-1 text-shadow">Tower Health</div>
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300"
              style={{ width: `${health}%` }}
            />
          </div>
        </div>
        
        {/* Sound toggle button */}
        <button 
          onClick={toggleMute} 
          className="bg-black/70 text-white p-2 rounded-full pointer-events-auto"
          aria-label={isMuted ? "Unmute sound" : "Mute sound"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default GameUI;

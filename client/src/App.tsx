import { useState, useEffect, useCallback } from "react";
import GameContainer from "./components/GameContainer";
import StartScreen from "./components/StartScreen";
import GameOverScreen from "./components/GameOverScreen";
import { useGame } from "./lib/stores/useGame";

function App() {
  const { phase, start, restart, end } = useGame();
  const [score, setScore] = useState(0);
  
  // Create stable callback functions that won't change on each render
  const handleGameOver = useCallback(() => {
    console.log('Game over triggered from GameContainer');
    try {
      // Force a small delay before state change to prevent React state conflicts
      setTimeout(() => {
        end();
        console.log('Game state changed to "ended"');
      }, 50);
    } catch (err) {
      console.error('Error during game over:', err);
      // Ensure game end even if there was an error
      end();
    }
  }, [end]);
  
  const handleScoreUpdate = useCallback((newScore: number) => {
    if (typeof newScore === 'number' && isFinite(newScore)) {
      setScore(newScore);
    }
  }, []);
  
  useEffect(() => {
    // Reset score when game restarts
    if (phase === "ready") {
      setScore(0);
    }
    
    console.log('Game phase changed:', phase);
  }, [phase]);

  return (
    <div className="w-full h-full relative">
      {phase === "ready" && (
        <StartScreen onStart={start} />
      )}
      
      <GameContainer 
        isActive={phase === "playing"} 
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
      />
      
      {phase === "ended" && (
        <GameOverScreen score={score} onRestart={restart} />
      )}
    </div>
  );
}

export default App;

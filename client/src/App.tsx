import { useState, useEffect, useCallback } from "react";
import GameContainer from "./components/GameContainer";
import StartScreen from "./components/StartScreen";
import GameOverScreen from "./components/GameOverScreen";
import { useGame } from "./lib/stores/useGame";
import PlayerDataService from "./services/PlayerDataService";
import LeaderboardService from "./services/LeaderboardService";

function App() {
  const { phase, start, restart, end } = useGame();
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [currentWave, setCurrentWave] = useState(1);
  
  // Create stable callback functions that won't change on each render
  const handleGameOver = useCallback(async () => {
    console.log('Game over triggered from GameContainer');
    try {
      // Award coins based on score (e.g., 1 coin per 10 points)
      const coinsEarned = Math.floor(score / 10);
      
      // Update player's coins in the database
      if (coinsEarned > 0) {
        try {
          // Update coins
          await PlayerDataService.updateCoins(coinsEarned)
            .then(updatedPlayerData => {
              setCoins(updatedPlayerData.coins);
              console.log(`Earned ${coinsEarned} coins, new total: ${updatedPlayerData.coins}`);
            })
            .catch(err => {
              console.error('Error updating coins:', err);
            });
        } catch (error) {
          console.error('Failed to update coins:', error);
        }
      }
      
      // Try to submit score to leaderboard
      try {
        const playerData = await PlayerDataService.getPlayerData();
        // Submit to leaderboard if available
        if (score > 0) {
          LeaderboardService.submitScore(
            playerData.displayName,
            score, 
            currentWave
          ).then(success => {
            if (success) {
              console.log('Score submitted to leaderboard successfully');
            }
          }).catch(err => {
            console.log('Leaderboard submission error (non-critical):', err);
          });
        }
      } catch (error) {
        console.log('Failed to submit score to leaderboard (non-critical)');
      }
      
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
  }, [end, score]);
  
  const handleScoreUpdate = useCallback((newScore: number) => {
    if (typeof newScore === 'number' && isFinite(newScore)) {
      setScore(newScore);
    }
  }, []);
  
  const handleWaveUpdate = useCallback((wave: number) => {
    if (typeof wave === 'number' && isFinite(wave)) {
      setCurrentWave(wave);
    }
  }, []);
  
  useEffect(() => {
    // Load player data when the app starts
    const loadPlayerData = async () => {
      try {
        const playerData = await PlayerDataService.getPlayerData();
        setCoins(playerData.coins);
      } catch (error) {
        console.error('Failed to load player data:', error);
      }
    };
    
    loadPlayerData();
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
        onWaveUpdate={handleWaveUpdate}
      />
      
      {phase === "ended" && (
        <GameOverScreen 
          score={score} 
          onRestart={restart}
          coinsEarned={Math.floor(score / 10)} 
          totalCoins={coins}
        />
      )}
    </div>
  );
}

export default App;

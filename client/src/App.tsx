import React, { useState, useEffect } from 'react';
import StartScreen from './components/StartScreen';
import GameContainer from './components/GameContainer';
import GameOverScreen from './components/GameOverScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import { getOrCreatePlayerId, getPlayerData } from './services/PlayerDataService';
import { addHighScore } from './services/LeaderboardService';

const App: React.FC = () => {
  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Player data
  const [score, setScore] = useState(0);
  const [waveReached, setWaveReached] = useState(1);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [playerName, setPlayerName] = useState<string>('');
  
  // Load player data on mount
  useEffect(() => {
    async function loadPlayerData() {
      try {
        const playerId = getOrCreatePlayerId();
        const data = await getPlayerData(playerId);
        
        if (data) {
          const displayName = data.displayName || `Player_${playerId.substring(0, 6)}`;
          setPlayerName(displayName);
          setTotalCoins(data.coins || 0);
        }
      } catch (error) {
        console.error('Failed to load player data:', error);
      }
    }
    
    loadPlayerData();
  }, []);
  
  // Start the game
  const handleStartGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setWaveReached(1);
    setCoinsEarned(0);
  };
  
  // Game over handler
  const handleGameOver = async () => {
    setGameActive(false);
    setGameOver(true);
    
    // Calculate coins earned (1 coin per 10 points)
    const coins = Math.floor(score / 10);
    setCoinsEarned(coins);
    setTotalCoins(prevTotal => prevTotal + coins);
    
    // Add to leaderboard
    try {
      await addHighScore({
        playerName,
        score,
        waveReached
      });
    } catch (error) {
      console.error('Failed to add score to leaderboard:', error);
    }
  };
  
  // Score update handler
  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };
  
  // Wave update handler
  const handleWaveUpdate = (wave: number) => {
    setWaveReached(wave);
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {!gameActive && !gameOver && (
        <StartScreen onStart={handleStartGame} />
      )}
      
      {gameActive && (
        <GameContainer 
          isActive={gameActive} 
          onGameOver={handleGameOver} 
          onScoreUpdate={handleScoreUpdate}
          onWaveUpdate={handleWaveUpdate}
        />
      )}
      
      {gameOver && (
        <GameOverScreen 
          score={score} 
          onRestart={handleStartGame} 
          coinsEarned={coinsEarned}
          totalCoins={totalCoins}
          waveReached={waveReached}
        />
      )}
      
      {showLeaderboard && (
        <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
};

export default App;
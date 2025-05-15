import React, { useEffect } from 'react';
import { getOrCreatePlayerId, getPlayerData, updatePlayerData } from '../services/PlayerDataService';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
  coinsEarned?: number;
  totalCoins?: number;
  waveReached?: number;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  onRestart, 
  coinsEarned = 0, 
  totalCoins = 0,
  waveReached = 1
}) => {
  // On mount, update the player's coins in the database
  useEffect(() => {
    async function updateCoins() {
      try {
        // Get the player ID from local storage
        const playerId = getOrCreatePlayerId();
        
        // Get current player data
        const playerData = await getPlayerData(playerId);
        
        if (playerData) {
          // Calculate new coin total
          const currentCoins = playerData.coins || 0;
          const newTotal = currentCoins + coinsEarned;
          
          // Update player data
          await updatePlayerData(playerId, { 
            coins: newTotal
          });
          
          console.log(`Updated player coins: ${currentCoins} + ${coinsEarned} = ${newTotal}`);
        }
      } catch (error) {
        console.error('Failed to update player coins:', error);
      }
    }
    
    // Only update if the player earned coins
    if (coinsEarned > 0) {
      updateCoins();
    }
  }, [coinsEarned]);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-card p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-primary mb-2">Game Over</h2>
        
        <div className="my-6 flex flex-col gap-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-lg">Final Score</p>
            <p className="text-3xl font-bold">{score}</p>
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-lg">Wave Reached</p>
            <p className="text-3xl font-bold">{waveReached}</p>
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-lg">Coins Earned</p>
            <p className="text-3xl font-bold">{coinsEarned}</p>
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-lg">Total Coins</p>
            <p className="text-3xl font-bold">{totalCoins}</p>
          </div>
        </div>
        
        <button
          onClick={onRestart}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold text-lg hover:bg-primary/90 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
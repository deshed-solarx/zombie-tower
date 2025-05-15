import React, { useState, useEffect } from 'react';
import { getOrCreatePlayerId, getPlayerData } from '../services/PlayerDataService';

// Import our screens
import LeaderboardScreen from './LeaderboardScreen';
import PermanentUpgradesScreen from './PermanentUpgradesScreen';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [playerCoins, setPlayerCoins] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load player data when component mounts
  useEffect(() => {
    async function loadPlayerData() {
      try {
        setLoading(true);
        const playerId = getOrCreatePlayerId();
        const data = await getPlayerData(playerId);
        
        if (data) {
          setPlayerCoins(data.coins);
        }
      } catch (error) {
        console.error('Failed to load player data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadPlayerData();
  }, []);
  
  // Update player coins when returning from upgrades screen
  const handleCloseUpgrades = () => {
    setShowUpgrades(false);
    
    // Refresh player data to get updated coins
    async function refreshPlayerData() {
      try {
        const playerId = getOrCreatePlayerId();
        const data = await getPlayerData(playerId);
        
        if (data) {
          setPlayerCoins(data.coins);
        }
      } catch (error) {
        console.error('Failed to refresh player data:', error);
      }
    }
    
    refreshPlayerData();
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground">
      <div className="w-full max-w-md text-center">
        <h1 className="text-5xl font-bold text-primary mb-8">Zombie Tower Defense</h1>
        
        {/* Display player coins if available */}
        {!loading && playerCoins !== null && (
          <div className="bg-card p-3 rounded-md mb-6 inline-block mx-auto">
            <p className="text-lg">
              Your Coins: <span className="font-bold text-primary">{playerCoins}</span>
            </p>
          </div>
        )}
        
        <div className="space-y-4 mt-6">
          <button
            onClick={onStart}
            className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-md text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Game
          </button>
          
          <button
            onClick={() => setShowUpgrades(true)}
            className="w-full py-3 px-6 bg-muted text-foreground rounded-md text-lg font-semibold hover:bg-muted/90 transition-colors"
          >
            Permanent Upgrades
          </button>
          
          <button
            onClick={() => setShowLeaderboard(true)}
            className="w-full py-3 px-6 bg-muted text-foreground rounded-md text-lg font-semibold hover:bg-muted/90 transition-colors"
          >
            Leaderboard
          </button>
        </div>
        
        <p className="mt-8 text-muted-foreground">
          Defend your tower against waves of zombies.<br />
          Earn coins to unlock permanent upgrades!
        </p>
      </div>
      
      {/* Render leaderboard screen if shown */}
      {showLeaderboard && (
        <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />
      )}
      
      {/* Render upgrades screen if shown */}
      {showUpgrades && (
        <PermanentUpgradesScreen onClose={handleCloseUpgrades} />
      )}
    </div>
  );
};

export default StartScreen;
import { useState, useEffect } from 'react';
import PlayerDataService from '../services/PlayerDataService';

interface PermanentUpgradesScreenProps {
  onClose: () => void;
}

const PermanentUpgradesScreen: React.FC<PermanentUpgradesScreenProps> = ({ onClose }) => {
  const [playerData, setPlayerData] = useState<{ 
    playerId: string;
    displayName?: string;
    coins: number;
    permUpgrades: Record<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load player data when component mounts
    const loadPlayerData = async () => {
      try {
        setLoading(true);
        const data = await PlayerDataService.getPlayerData();
        setPlayerData(data);
      } catch (error) {
        console.error('Failed to load player data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPlayerData();
  }, []);
  
  // A collection of possible permanent upgrades (placeholders for now)
  const availableUpgrades = [
    { id: 'starting_health', name: 'Starting Health', description: 'Increase tower starting health', cost: 100, maxLevel: 5 },
    { id: 'starting_bullet_damage', name: 'Bullet Damage', description: 'Increase starting bullet damage', cost: 150, maxLevel: 5 },
    { id: 'starting_bullet_speed', name: 'Bullet Speed', description: 'Increase starting bullet speed', cost: 125, maxLevel: 3 },
    { id: 'coin_multiplier', name: 'Coin Booster', description: 'Earn more coins per zombie', cost: 200, maxLevel: 3 },
    { id: 'starting_multi_shot', name: 'Multi-Shot', description: 'Start with extra bullets', cost: 300, maxLevel: 2 },
  ];
  
  const handleUpgradePurchase = async (upgradeId: string) => {
    if (!playerData) return;
    
    const upgrade = availableUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    // Get current level of this upgrade (or 0 if not purchased yet)
    const currentLevel = playerData.permUpgrades[upgradeId] || 0;
    
    // Check if max level reached
    if (currentLevel >= upgrade.maxLevel) {
      alert('Maximum level reached for this upgrade');
      return;
    }
    
    // Check if player has enough coins
    if (playerData.coins < upgrade.cost) {
      alert('Not enough coins');
      return;
    }
    
    try {
      // Update player data with new upgrade level and reduced coins
      const newPermUpgrades = {
        ...playerData.permUpgrades,
        [upgradeId]: currentLevel + 1
      };
      
      const updatedPlayer = await PlayerDataService.updatePlayerData({
        coins: playerData.coins - upgrade.cost,
        permUpgrades: newPermUpgrades
      });
      
      setPlayerData(updatedPlayer);
    } catch (error) {
      console.error('Failed to purchase upgrade:', error);
      alert('Failed to purchase upgrade');
    }
  };
  
  const getCurrentLevel = (upgradeId: string) => {
    return playerData?.permUpgrades[upgradeId] || 0;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">Permanent Upgrades</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-yellow-400 text-2xl"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-white">Loading player data...</p>
          </div>
        ) : playerData ? (
          <>
            <div className="mb-6 p-3 bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Player ID</p>
                  <p className="text-white font-mono text-xs">{playerData.playerId}</p>
                </div>
                <div>
                  <p className="text-yellow-400 text-xl font-bold">
                    {playerData.coins} <span className="text-yellow-500">coins</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-4">
              {availableUpgrades.map(upgrade => {
                const currentLevel = getCurrentLevel(upgrade.id);
                return (
                  <div key={upgrade.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-white font-bold">{upgrade.name}</h3>
                        <p className="text-gray-300 text-sm">{upgrade.description}</p>
                        <div className="mt-2 flex items-center">
                          <div className="text-xs text-gray-400">Level:</div>
                          <div className="ml-2 flex space-x-1">
                            {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                              <div 
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i < currentLevel 
                                    ? 'bg-green-500' 
                                    : 'bg-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <button
                          onClick={() => handleUpgradePurchase(upgrade.id)}
                          disabled={
                            currentLevel >= upgrade.maxLevel || 
                            playerData.coins < upgrade.cost
                          }
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            currentLevel >= upgrade.maxLevel
                              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                              : playerData.coins < upgrade.cost
                              ? 'bg-red-800 text-red-200 cursor-not-allowed'
                              : 'bg-yellow-600 text-white hover:bg-yellow-500'
                          }`}
                        >
                          {currentLevel >= upgrade.maxLevel 
                            ? 'MAX LEVEL' 
                            : `Buy: ${upgrade.cost} coins`
                          }
                        </button>
                        {currentLevel === 0 ? (
                          <span className="text-red-400 text-xs mt-1">Not Purchased</span>
                        ) : (
                          <span className="text-green-400 text-xs mt-1">Level {currentLevel}/{upgrade.maxLevel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-400">Failed to load player data</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermanentUpgradesScreen;
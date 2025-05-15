import React, { useState, useEffect } from 'react';
import { getOrCreatePlayerId, getPlayerData, updatePlayerData, PlayerData } from '../services/PlayerDataService';

interface PermanentUpgradesScreenProps {
  onClose: () => void;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  level: number;
  maxLevel: number;
  effect: (level: number) => string;
}

const PermanentUpgradesScreen: React.FC<PermanentUpgradesScreenProps> = ({ onClose }) => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Define the available permanent upgrades
  const availableUpgrades: Upgrade[] = [
    {
      id: 'health',
      name: 'Max Health',
      description: 'Increase your maximum health',
      baseCost: 100,
      level: 0,
      maxLevel: 5,
      effect: (level) => `+${level * 20} health`,
    },
    {
      id: 'damage',
      name: 'Base Damage',
      description: 'Increase your weapon damage',
      baseCost: 150,
      level: 0,
      maxLevel: 5,
      effect: (level) => `+${level * 15}% damage`,
    },
    {
      id: 'speed',
      name: 'Movement Speed',
      description: 'Increase your movement speed',
      baseCost: 120,
      level: 0,
      maxLevel: 5,
      effect: (level) => `+${level * 10}% speed`,
    },
    {
      id: 'startingWave',
      name: 'Skip Waves',
      description: 'Start the game at a higher wave',
      baseCost: 300,
      level: 0,
      maxLevel: 3,
      effect: (level) => `Start at wave ${level + 1}`,
    },
  ];
  
  // Load player data
  useEffect(() => {
    async function loadPlayerData() {
      try {
        setLoading(true);
        const playerId = getOrCreatePlayerId();
        const data = await getPlayerData(playerId);
        
        if (data) {
          setPlayerData(data);
          
          // Apply saved upgrade levels from player data
          if (data.permUpgrades) {
            availableUpgrades.forEach(upgrade => {
              upgrade.level = data.permUpgrades[upgrade.id] || 0;
            });
          }
        }
      } catch (error) {
        console.error('Failed to load player data:', error);
        setErrorMessage('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadPlayerData();
  }, []);
  
  // Calculate cost for the next level of an upgrade
  const calculateUpgradeCost = (upgrade: Upgrade): number => {
    if (upgrade.level >= upgrade.maxLevel) return 0;
    return Math.ceil(upgrade.baseCost * Math.pow(1.5, upgrade.level));
  };
  
  // Purchase an upgrade
  const purchaseUpgrade = async (upgrade: Upgrade) => {
    if (!playerData) return;
    
    const cost = calculateUpgradeCost(upgrade);
    
    if (playerData.coins < cost) {
      setErrorMessage('Not enough coins!');
      return;
    }
    
    if (upgrade.level >= upgrade.maxLevel) {
      setErrorMessage('Upgrade already at maximum level!');
      return;
    }
    
    try {
      // Update locally first
      const newLevel = upgrade.level + 1;
      const newCoins = playerData.coins - cost;
      
      // Create a copy of the current permUpgrades
      const updatedUpgrades = { ...playerData.permUpgrades };
      updatedUpgrades[upgrade.id] = newLevel;
      
      // Send update to server
      const updatedPlayer = await updatePlayerData(playerData.playerId, {
        coins: newCoins,
        permUpgrades: updatedUpgrades
      });
      
      if (updatedPlayer) {
        setPlayerData(updatedPlayer);
        upgrade.level = newLevel;
        setErrorMessage(null);
      } else {
        throw new Error('Failed to update player data');
      }
    } catch (error) {
      console.error('Failed to purchase upgrade:', error);
      setErrorMessage('Failed to purchase upgrade. Please try again.');
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-card p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Permanent Upgrades</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mb-4"></div>
            <p>Loading your upgrades...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-destructive bg-opacity-20 text-destructive-foreground p-4 rounded mb-4">
            {errorMessage}
          </div>
        ) : playerData ? (
          <>
            <div className="mb-6 p-4 bg-muted rounded-md">
              <p className="text-xl">
                Available Coins: <span className="font-bold text-primary">{playerData.coins}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableUpgrades.map((upgrade) => (
                <div 
                  key={upgrade.id}
                  className="border border-border rounded-lg p-4 bg-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{upgrade.name}</h3>
                    <span className="px-2 py-1 bg-muted rounded text-sm">
                      Level {upgrade.level}/{upgrade.maxLevel}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground mb-2">{upgrade.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm">
                      Current: <span className="text-accent-foreground">{upgrade.effect(upgrade.level)}</span>
                    </p>
                    {upgrade.level < upgrade.maxLevel && (
                      <p className="text-sm">
                        Next: <span className="text-accent-foreground">{upgrade.effect(upgrade.level + 1)}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    {upgrade.level < upgrade.maxLevel ? (
                      <>
                        <p className="text-sm">
                          Cost: <span className="font-semibold">{calculateUpgradeCost(upgrade)} coins</span>
                        </p>
                        <button
                          onClick={() => purchaseUpgrade(upgrade)}
                          disabled={playerData.coins < calculateUpgradeCost(upgrade)}
                          className={`px-4 py-2 rounded font-semibold ${
                            playerData.coins >= calculateUpgradeCost(upgrade)
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                          }`}
                        >
                          Upgrade
                        </button>
                      </>
                    ) : (
                      <p className="text-accent-foreground font-semibold w-full text-center">
                        Maximum Level Reached
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center p-4">No data available. Please try again later.</p>
        )}
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded font-semibold hover:bg-secondary/90"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermanentUpgradesScreen;
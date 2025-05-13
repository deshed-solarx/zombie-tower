import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import PermanentUpgradesScreen from './PermanentUpgradesScreen';
import PlayerDataService from '../services/PlayerDataService';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [playerCoins, setPlayerCoins] = useState<number | null>(null);
  
  // Load player coins when component mounts or when upgrades screen closes
  useEffect(() => {
    const loadPlayerCoins = async () => {
      try {
        const playerData = await PlayerDataService.getPlayerData();
        setPlayerCoins(playerData.coins);
      } catch (error) {
        console.error('Failed to load player coins:', error);
      }
    };
    
    loadPlayerCoins();
  }, []);
  
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      <div className="max-w-md w-full bg-black/90 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Zombie Tower Defense</h1>
        
        {playerCoins !== null && (
          <div className="mb-4 bg-gray-800 rounded-lg p-2 inline-block">
            <p className="text-yellow-400 font-bold">
              {playerCoins} <span className="text-yellow-200">coins</span>
            </p>
          </div>
        )}
        
        <p className="text-lg text-gray-300 mb-6">
          Defend your tower from waves of zombies! Click anywhere on the screen to shoot.
        </p>
        
        <div className="mb-8 bg-gray-800 rounded-lg p-4 text-left">
          <h2 className="text-xl font-semibold text-white mb-2">How to Play:</h2>
          <ul className="text-gray-300 space-y-2">
            <li>• Click to shoot at zombies</li>
            <li>• Each killed zombie gives you points</li>
            <li>• Zombies damage your tower when they reach it</li>
            <li>• Survive as long as possible!</li>
            <li>• Press 'i' during game for developer menu</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Button 
            onClick={onStart}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg text-xl font-bold transition"
          >
            Start Game
          </Button>
          
          <Button
            onClick={() => setShowUpgrades(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg text-xl font-bold transition flex items-center justify-center"
          >
            Upgrades
          </Button>
        </div>
        
        <div className="flex justify-center">
          <a 
            href="/support.html" 
            target="_blank" 
            className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-lg font-bold transition flex items-center justify-center"
          >
            Support Game
          </a>
        </div>
      </div>
      
      {showUpgrades && (
        <PermanentUpgradesScreen 
          onClose={() => {
            setShowUpgrades(false);
            // Refresh coins after closing the upgrades screen
            PlayerDataService.getPlayerData().then(data => {
              setPlayerCoins(data.coins);
            });
          }} 
        />
      )}
    </div>
  );
};

export default StartScreen;

import React, { useRef, useEffect, useState } from 'react';
import GameUI from './GameUI';
import UpgradeScreen from './UpgradeScreen';
import { Game } from '../game/Game';
import { useAudio } from '../lib/stores/useAudio';
import { Upgrade } from '../game/UpgradeSystem';

interface GameContainerProps {
  isActive: boolean;
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
}

const GameContainer = ({ isActive, onGameOver, onScoreUpdate }: GameContainerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  
  // State for upgrade screen
  const [showUpgrades, setShowUpgrades] = useState<boolean>(false);
  const [availableUpgrades, setAvailableUpgrades] = useState<Upgrade[]>([]);

  // Setup audio elements
  useEffect(() => {
    const backgroundMusic = new Audio('/sounds/background.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    
    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.volume = 0.3;
    
    const successSound = new Audio('/sounds/success.mp3');
    successSound.volume = 0.4;
    
    const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio.getState();
    
    setBackgroundMusic(backgroundMusic);
    setHitSound(hitSound);
    setSuccessSound(successSound);
    
    return () => {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    };
  }, []);

  // Event handler for when an upgrade is available
  const handleUpgradeAvailable = () => {
    if (!gameInstanceRef.current) return;
    
    // Pause the game
    gameInstanceRef.current.pause();
    
    // Get available upgrades and show the upgrade screen
    if (gameInstanceRef.current) {
      const upgradeSystem = gameInstanceRef.current.getUpgradeSystem();
      if (upgradeSystem) {
        const upgrades = upgradeSystem.getUpgradesForSelection();
        
        if (upgrades.length === 0) {
          // If no upgrades are available, auto-skip
          console.log("No upgrades available, auto-skipping");
          handleSkipUpgrade();
          return;
        }
        
        setAvailableUpgrades(upgrades);
        setShowUpgrades(true);
      }
    }
  };

  // Handler for when an upgrade is selected
  const handleUpgradeSelected = (upgradeId: string) => {
    if (!gameInstanceRef.current) return;
    
    // Apply the selected upgrade
    const upgradeSystem = gameInstanceRef.current.getUpgradeSystem();
    if (upgradeSystem) {
      upgradeSystem.applyUpgrade(upgradeId);
      
      // Play success sound
      useAudio.getState().playSuccess();
    }
    
    // Hide the upgrade screen and resume the game
    setShowUpgrades(false);
    
    // Resume game after short delay - but DON'T create a new game instance
    setTimeout(() => {
      if (gameInstanceRef.current && isActive) {
        console.log("Resuming game after upgrade with preserved state");
        // Pass true to preserve state during resume
        gameInstanceRef.current.resumeAfterUpgrade();
      }
    }, 200);
  };

  // Handler for skipping upgrades
  const handleSkipUpgrade = () => {
    if (!gameInstanceRef.current) return;
    
    // Give score bonus for skipping
    // Since onScoreUpdate expects a number, we'll simply add 10 to current score
    const currentScore = gameInstanceRef.current.getScore();
    onScoreUpdate(currentScore + 10);
    
    // Hide the upgrade screen and resume the game
    setShowUpgrades(false);
    
    // Resume game after short delay - but DON'T create a new game instance
    setTimeout(() => {
      if (gameInstanceRef.current && isActive) {
        console.log("Skipping upgrade and resuming with preserved state");
        // Set the game state to running without resetting everything
        gameInstanceRef.current.resumeAfterUpgrade();
      }
    }, 200);
  };

  // Initialize game when canvas is ready
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }
    
    // Set canvas size to match window
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Update game size if it exists
      if (gameInstanceRef.current) {
        gameInstanceRef.current.updateCanvasSize(canvas.width, canvas.height);
      }
    };
    
    // Set initial size
    updateCanvasSize();
    
    // Handle window resize
    window.addEventListener('resize', updateCanvasSize);
    
    // Create game instance
    gameInstanceRef.current = new Game(canvas, ctx, {
      onGameOver,
      onScoreUpdate,
      onUpgradeAvailable: handleUpgradeAvailable
    });
    
    return () => {
      console.log('GameContainer unmounting, cleaning up resources');
      window.removeEventListener('resize', updateCanvasSize);
      
      try {
        // Safely destroy game instance with error handling
        if (gameInstanceRef.current) {
          // First pause the game to stop any ongoing operations
          gameInstanceRef.current.pause();
          
          // Small delay before completely destroying to allow any pending operations to complete
          setTimeout(() => {
            try {
              if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy();
                gameInstanceRef.current = null;
                console.log('Game instance destroyed successfully');
              }
            } catch (err) {
              console.error('Error during delayed game destruction:', err);
            }
          }, 50);
        }
      } catch (err) {
        console.error('Error during game cleanup:', err);
        // Force cleanup even if there was an error
        gameInstanceRef.current = null;
      }
    };
  }, [canvasRef, onGameOver, onScoreUpdate]);

  // Control game state based on isActive prop
  useEffect(() => {
    if (!gameInstanceRef.current) return;
    
    if (isActive && !showUpgrades) {
      // Only start the game from scratch if not coming from upgrades
      console.log("Initial game activation - starting game");
      gameInstanceRef.current.start();
      
      // Play background music
      if (useAudio.getState().backgroundMusic && !useAudio.getState().isMuted) {
        useAudio.getState().backgroundMusic?.play().catch(e => console.log('Audio play prevented:', e));
      }
    } else if (!isActive) {
      console.log("Game deactivation - pausing");
      gameInstanceRef.current.pause();
      
      // Pause background music if not just showing upgrades
      if (!showUpgrades) {
        const backgroundMusic = useAudio.getState().backgroundMusic;
        if (backgroundMusic) {
          backgroundMusic.pause();
        }
      }
    }
  }, [isActive, showUpgrades]);

  // Auto-aim is now fully automatic, so we removed the keyboard event listener 
  // that was previously used to trigger auto-aim with spacebar

  return (
    <div className="w-full h-full relative">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full z-10"
      />
      {isActive && !showUpgrades && <GameUI />}
      
      {showUpgrades && (
        <UpgradeScreen 
          upgrades={availableUpgrades}
          onUpgradeSelected={handleUpgradeSelected}
          onSkip={handleSkipUpgrade}
        />
      )}
    </div>
  );
};

export default GameContainer;

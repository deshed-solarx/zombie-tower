import React, { useState, useEffect } from 'react';
import { Upgrade } from '../game/UpgradeSystem';

interface UpgradeScreenProps {
  upgrades: Upgrade[];
  onUpgradeSelected: (upgradeId: string) => void;
  onSkip: () => void;
}

const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ 
  upgrades, 
  onUpgradeSelected,
  onSkip
}) => {
  // Add state to track if buttons should be enabled
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  // Add state to track countdown
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
    // Start a 3-second timer before enabling buttons
    const timer = setTimeout(() => {
      setButtonsEnabled(true);
    }, 3000);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup
    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, []);
  
  if (upgrades.length === 0) {
    // If no upgrades available, skip automatically
    setTimeout(onSkip, 0);
    return null;
  }
  
  // Function to handle upgrade selection with button guard
  const handleUpgradeClick = (upgradeId: string) => {
    if (buttonsEnabled) {
      onUpgradeSelected(upgradeId);
    }
  };
  
  // Function to handle skip with button guard
  const handleSkipClick = () => {
    if (buttonsEnabled) {
      onSkip();
    }
  };
  
  return (
    <div className="upgrade-screen">
      <div className="upgrade-container">
        <h2 className="upgrade-title">
          Choose an Upgrade
          {!buttonsEnabled && (
            <div className="countdown">
              Available in {countdown}...
            </div>
          )}
        </h2>
        
        <div className="upgrade-options">
          {upgrades.map(upgrade => (
            <div 
              key={upgrade.id} 
              className={`upgrade-card ${!buttonsEnabled ? 'disabled' : ''}`}
              onClick={() => handleUpgradeClick(upgrade.id)}
            >
              <h3>{upgrade.name}</h3>
              <p className="upgrade-level">
                Level: {upgrade.currentLevel} / {upgrade.maxLevel}
              </p>
              <p className="upgrade-description">{upgrade.description}</p>
              <div className={`upgrade-button ${!buttonsEnabled ? 'disabled' : ''}`}>
                {buttonsEnabled ? 'Select' : 'Wait...'}
              </div>
            </div>
          ))}
        </div>
        
        <button 
          className={`skip-button ${!buttonsEnabled ? 'disabled' : ''}`} 
          onClick={handleSkipClick}
          disabled={!buttonsEnabled}
        >
          Skip (+10 points)
        </button>
      </div>
    </div>
  );
};

export default UpgradeScreen;
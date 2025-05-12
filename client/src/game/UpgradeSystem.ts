// Upgrade system for the zombie tower defense game
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  apply: (gameState: any) => void;
  // Flags to mark incompatible upgrades
  incompatibleWith?: string[];
  // Flag to mark if upgrade is hidden
  hidden?: boolean;
}

export class UpgradeSystem {
  private upgrades: Upgrade[];
  private onStateChange: (upgradesAvailable: boolean) => void;
  
  constructor(onStateChange: (upgradesAvailable: boolean) => void) {
    this.onStateChange = onStateChange;
    
    // Define available upgrades
    this.upgrades = [
      {
        id: 'bullet_bounce',
        name: 'Bullet Bounce',
        description: 'Bullets bounce off walls before disappearing',
        maxLevel: 5,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.bulletBounces = this.getUpgradeLevel('bullet_bounce');
          console.log('Applied bullet bounce upgrade', gameState.bulletBounces);
        }
      },
      {
        id: 'multi_shot',
        name: 'Multi-Shot',
        description: 'Shoot multiple bullets in a spread pattern',
        maxLevel: 5,
        currentLevel: 0,
        apply: (gameState: any) => {
          const level = this.getUpgradeLevel('multi_shot');
          gameState.bulletCount = 1 + level;
          
          // At level 3+, multi-shot disables the split upgrade
          if (level >= 3) {
            // Add to incompatibleWith list if it exists, or create a new one
            const multiShotUpgrade = this.upgrades.find(u => u.id === 'multi_shot');
            if (multiShotUpgrade) {
              multiShotUpgrade.incompatibleWith = multiShotUpgrade.incompatibleWith || [];
              if (!multiShotUpgrade.incompatibleWith.includes('split')) {
                multiShotUpgrade.incompatibleWith.push('split');
              }
            }
          }
          
          console.log('Applied multi-shot upgrade', gameState.bulletCount);
        }
      },
      {
        id: 'auto_aim',
        name: 'Auto-Aimer',
        description: 'Automatically targets and shoots at the nearest zombie (0.75s cooldown)',
        maxLevel: 1,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.autoAimEnabled = this.getUpgradeLevel('auto_aim') > 0;
          gameState.autoAimCooldown = 750; // 0.75 seconds in milliseconds
          console.log('Applied auto-aim upgrade', gameState.autoAimEnabled);
        }
      },
      // New upgrades
      {
        id: 'trickster',
        name: 'Trickster',
        description: 'Every bounce adds 20% damage to bullets',
        maxLevel: 4,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.tricksterLevel = this.getUpgradeLevel('trickster');
          gameState.damagePerBounce = 0.2 * gameState.tricksterLevel; // 20% per level
          console.log('Applied trickster upgrade', gameState.tricksterLevel);
        }
      },
      {
        id: 'ghost_bullets',
        name: 'Ghost Bullets',
        description: 'Bullets pierce through zombies (damage reduced by 10% per enemy)',
        maxLevel: 1,
        currentLevel: 0,
        incompatibleWith: ['bullet_bounce'],
        apply: (gameState: any) => {
          gameState.ghostBulletsEnabled = this.getUpgradeLevel('ghost_bullets') > 0;
          console.log('Applied ghost bullets upgrade', gameState.ghostBulletsEnabled);
        }
      },
      {
        id: 'bullet_time',
        name: 'Bullet Time',
        description: 'Bullets move 10x slower but deal 5x damage',
        maxLevel: 1,
        currentLevel: 0,
        incompatibleWith: ['hitscan'],
        apply: (gameState: any) => {
          gameState.bulletTimeEnabled = this.getUpgradeLevel('bullet_time') > 0;
          gameState.bulletSpeed = gameState.bulletTimeEnabled ? 
            gameState.baseBulletSpeed / 10 : gameState.baseBulletSpeed;
          gameState.bulletDamageMultiplier = gameState.bulletTimeEnabled ? 5 : 1;
          console.log('Applied bullet time upgrade', gameState.bulletTimeEnabled);
        }
      },
      {
        id: 'hitscan',
        name: 'Hitscan',
        description: 'Bullets move 3x faster and gain 20% speed and 15% damage per bounce',
        maxLevel: 1,
        currentLevel: 0,
        incompatibleWith: ['bullet_time'],
        apply: (gameState: any) => {
          gameState.hitscanEnabled = this.getUpgradeLevel('hitscan') > 0;
          gameState.bulletSpeed = gameState.hitscanEnabled ? 
            gameState.baseBulletSpeed * 3 : gameState.baseBulletSpeed;
          console.log('Applied hitscan upgrade', gameState.hitscanEnabled);
        }
      },
      // New upgrades
      {
        id: 'explosive',
        name: 'Explosive Rounds',
        description: 'Marked enemies explode after 1 second for 50% damage to nearby enemies',
        maxLevel: 3,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.explosiveEnabled = this.getUpgradeLevel('explosive') > 0;
          gameState.explosiveLevel = this.getUpgradeLevel('explosive');
          console.log('Applied explosive upgrade', gameState.explosiveLevel);
        }
      },
      {
        id: 'implosive',
        name: 'Implosive Rounds',
        description: 'Pulls nearby enemies when bullet hits an enemy (1.5x range per level)',
        maxLevel: 3,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.implosiveEnabled = this.getUpgradeLevel('implosive') > 0;
          gameState.implosiveLevel = this.getUpgradeLevel('implosive');
          console.log('Applied implosive upgrade', gameState.implosiveLevel);
        }
      },
      {
        id: 'split',
        name: 'Split Shot',
        description: 'When enemies are hit, shoot one disabled bullet at nearest enemy',
        maxLevel: 3,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.splitEnabled = this.getUpgradeLevel('split') > 0;
          gameState.splitLevel = this.getUpgradeLevel('split');
          console.log('Applied split upgrade', gameState.splitLevel);
        }
      },
      {
        id: 'aftermath',
        name: 'Aftermath',
        description: 'Marked enemies explode for 400% damage when they die',
        maxLevel: 1,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.aftermathEnabled = this.getUpgradeLevel('aftermath') > 0;
          console.log('Applied aftermath upgrade', gameState.aftermathEnabled);
        }
      },
      {
        id: 'critical_strike',
        name: 'Critical Strike',
        description: 'Marked enemies take 200% damage after 3 seconds',
        maxLevel: 2,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.criticalEnabled = this.getUpgradeLevel('critical_strike') > 0;
          gameState.criticalLevel = this.getUpgradeLevel('critical_strike');
          console.log('Applied critical strike upgrade', gameState.criticalLevel);
        }
      },
      {
        id: 'necromantic',
        name: 'Necromantic',
        description: 'Marked enemies summon a friendly skeleton when they die',
        maxLevel: 1,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.necromanticEnabled = this.getUpgradeLevel('necromantic') > 0;
          console.log('Applied necromantic upgrade', gameState.necromanticEnabled);
        }
      },
      {
        id: 'life_steal',
        name: 'Life Steal',
        description: 'Heal 0.5% HP per hit (max 2 hits per zombie)',
        maxLevel: 3,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.lifeStealEnabled = this.getUpgradeLevel('life_steal') > 0;
          gameState.lifeStealLevel = this.getUpgradeLevel('life_steal');
          console.log('Applied life steal upgrade', gameState.lifeStealLevel);
        }
      },
      {
        id: 'homing',
        name: 'Homing Bullets',
        description: 'Bullets curve toward enemies within a 10-degree arc in front of them',
        maxLevel: 1,
        currentLevel: 0,
        apply: (gameState: any) => {
          gameState.homingEnabled = this.getUpgradeLevel('homing') > 0;
          console.log('Applied homing upgrade', gameState.homingEnabled);
        }
      }
    ];
  }
  
  // Get a random selection of upgrades for the player to choose from
  public getUpgradesForSelection(): Upgrade[] {
    // Filter out maxed upgrades and incompatible upgrades
    let availableUpgrades = this.upgrades.filter(upgrade => {
      // Skip maxed out upgrades
      if (upgrade.currentLevel >= upgrade.maxLevel) {
        return false;
      }
      
      // Check for incompatibilities
      if (upgrade.incompatibleWith) {
        // If any incompatible upgrade is already active, skip this upgrade
        for (const incompatibleId of upgrade.incompatibleWith) {
          if (this.getUpgradeLevel(incompatibleId) > 0) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    // If no upgrades available, return empty array
    if (availableUpgrades.length === 0) {
      return [];
    }
    
    // Get only 2 random upgrades
    return this.shuffleArray(availableUpgrades).slice(0, Math.min(2, availableUpgrades.length));
  }
  
  // Apply the selected upgrade
  public applyUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    
    if (!upgrade) {
      console.error(`Upgrade ${upgradeId} not found`);
      return false;
    }
    
    if (upgrade.currentLevel >= upgrade.maxLevel) {
      console.warn(`Upgrade ${upgradeId} already at max level`);
      return false;
    }
    
    // Increase level
    upgrade.currentLevel++;
    console.log(`Applied upgrade ${upgrade.name} to level ${upgrade.currentLevel}`);
    
    // Notify about state change
    this.onStateChange(this.areUpgradesAvailable());
    
    return true;
  }
  
  // Apply all upgrades to the game state
  public applyAllUpgrades(gameState: any): void {
    this.upgrades.forEach(upgrade => {
      if (upgrade.currentLevel > 0) {
        upgrade.apply(gameState);
      }
    });
  }
  
  // Check if there are any upgrades available
  public areUpgradesAvailable(): boolean {
    // First check if there are any upgrades not at max level
    const notMaxed = this.upgrades.some(upgrade => upgrade.currentLevel < upgrade.maxLevel);
    
    if (!notMaxed) {
      return false; // No upgrades available at all
    }
    
    // Now filter taking into account incompatibilities
    const availableUpgrades = this.upgrades.filter(upgrade => {
      // Skip maxed out upgrades
      if (upgrade.currentLevel >= upgrade.maxLevel) {
        return false;
      }
      
      // Check for incompatibilities
      if (upgrade.incompatibleWith) {
        // If any incompatible upgrade is already active, skip this upgrade
        for (const incompatibleId of upgrade.incompatibleWith) {
          if (this.getUpgradeLevel(incompatibleId) > 0) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    // Return true only if we have at least one valid upgrade option
    return availableUpgrades.length > 0;
  }
  
  // Get the current level of an upgrade
  public getUpgradeLevel(upgradeId: string): number {
    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    return upgrade ? upgrade.currentLevel : 0;
  }
  
  // Get all upgrades for dev menu
  public getAllUpgrades(): Upgrade[] {
    return [...this.upgrades];
  }
  
  // Utility method to shuffle an array
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}
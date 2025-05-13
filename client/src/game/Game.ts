import { Tower } from './Tower';
import { Zombie, ZombieType, ZombieSpawnCallback } from './Zombie';
import { Bullet } from './Bullet';
import { Particle } from './Particle';
import { SoundManager } from './SoundManager';
import { useAudio } from '../lib/stores/useAudio';
import { UpgradeSystem, Upgrade } from './UpgradeSystem';

// Type definitions
interface GameOptions {
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
  onUpgradeAvailable: () => void;
  onGameWin?: () => void; // Optional callback for game win condition
}

// Interface for saved game state
interface SavedGameState {
  wave: number;
  score: number;
  zombiesKilled: number;
  nextWaveThreshold: number;
  waveCompleted: boolean;  // Track if wave was completed
  // Adding tracked upgrade properties
  bulletCount?: number;
  bulletBounces?: number;
  autoAimEnabled?: boolean;
  tricksterLevel?: number;
  damagePerBounce?: number;
  ghostBulletsEnabled?: boolean;
  bulletTimeEnabled?: boolean;
  hitscanEnabled?: boolean;
  bulletDamageMultiplier?: number;
  bulletSpeed?: number;
  // New upgrades - 2023 additions
  explosiveEnabled?: boolean;
  explosiveLevel?: number;
  implosiveEnabled?: boolean;
  implosiveLevel?: number;
  splitEnabled?: boolean;
  splitLevel?: number;
  aftermathEnabled?: boolean;
  criticalEnabled?: boolean;
  criticalLevel?: number;
  necromanticEnabled?: boolean;
  lifeStealEnabled?: boolean;
  lifeStealLevel?: number;
  homingEnabled?: boolean;
}

interface GameState {
  running: boolean;
  score: number;
  wave: number;
  zombiesKilled: number;
  timeSinceLastSpawn: number;
  nextWaveThreshold: number;
  waveCompleted: boolean;
  zombiesInWave: number;    // Number of zombies to spawn in current wave
  zombiesSpawned: number;   // Number of zombies spawned in current wave
  
  // Upgrade-related properties
  bulletCount: number;           // Number of bullets to shoot at once
  bulletBounces: number;         // Number of times bullets can bounce
  autoAimEnabled: boolean;       // Whether auto-aim is enabled
  autoAimCooldown: number;       // Cooldown time in ms for auto-aim (default: 750ms)
  lastAutoAimTime: number;       // Last time auto-aim was used
  
  // New upgrade properties
  tricksterLevel: number;        // Level of trickster upgrade (0-4)
  damagePerBounce: number;       // Damage increase per bounce (20% per trickster level)
  ghostBulletsEnabled: boolean;  // Whether ghost bullets are enabled
  bulletTimeEnabled: boolean;    // Whether bullet time is enabled
  hitscanEnabled: boolean;       // Whether hitscan is enabled
  bulletDamageMultiplier: number;// Multiplier for bullet damage (5x for bullet time)
  baseBulletSpeed: number;       // Base speed for bullets before modifiers
  bulletSpeed: number;           // Current speed for bullets after modifiers
  
  // New upgrades - 2023 additions
  explosiveEnabled: boolean;     // Whether explosive rounds are enabled
  explosiveLevel: number;        // Level of explosive upgrade (1-3)
  implosiveEnabled: boolean;     // Whether implosive rounds are enabled
  implosiveLevel: number;        // Level of implosive upgrade (1-3)
  splitEnabled: boolean;         // Whether split shot is enabled
  splitLevel: number;            // Level of split upgrade (1-3)
  aftermathEnabled: boolean;     // Whether aftermath is enabled
  criticalEnabled: boolean;      // Whether critical strike is enabled
  criticalLevel: number;         // Level of critical strike upgrade (1-2)
  necromanticEnabled: boolean;   // Whether necromantic is enabled
  lifeStealEnabled: boolean;     // Whether life steal is enabled
  lifeStealLevel: number;        // Level of life steal upgrade (1-3)
  homingEnabled: boolean;        // Whether homing bullets are enabled
}

// Debug logger function
function debug(component: string, message: string, data?: any) {
  const timestamp = new Date().toISOString().substr(11, 8);
  console.log(`[${timestamp}] [${component}] ${message}`, data || '');
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: GameOptions;
  
  private tower: Tower;
  private zombies: Zombie[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private soundManager: SoundManager;
  
  // Accessor methods for external use
  public getUpgradeSystem(): UpgradeSystem {
    return this.upgradeSystem;
  }
  
  public getScore(): number {
    return this.state.score;
  }
  
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  
  private state: GameState = {
    running: false,
    score: 0,
    wave: 1,
    zombiesKilled: 0,
    timeSinceLastSpawn: 0,
    nextWaveThreshold: 10, // Zombies to kill before next wave
    waveCompleted: false,
    zombiesInWave: 10,     // Initial zombies per wave
    zombiesSpawned: 0,     // Track zombies spawned
    
    // Initialize upgrade-related properties
    bulletCount: 1,
    bulletBounces: 0,
    autoAimEnabled: false,
    autoAimCooldown: 750,  // 0.75 second cooldown
    lastAutoAimTime: 0,    // Last time auto-aim was used
    
    // New upgrade properties
    tricksterLevel: 0,
    damagePerBounce: 0,
    ghostBulletsEnabled: false,
    bulletTimeEnabled: false,
    hitscanEnabled: false,
    bulletDamageMultiplier: 1,
    baseBulletSpeed: 600,
    bulletSpeed: 600,
    
    // New upgrades - 2023 additions
    explosiveEnabled: false,
    explosiveLevel: 0,
    implosiveEnabled: false,
    implosiveLevel: 0,
    splitEnabled: false,
    splitLevel: 0,
    aftermathEnabled: false,
    criticalEnabled: false,
    criticalLevel: 0,
    necromanticEnabled: false,
    lifeStealEnabled: false,
    lifeStealLevel: 0,
    homingEnabled: false
  };
  
  // Upgrade system
  private upgradeSystem: UpgradeSystem;
  
  // Game settings
  private readonly settings = {
    maxZombies: 20,           // Maximum zombies at once
    baseSpawnRate: 800,       // Base time between zombie spawns (ms) - reduced from 2000
    waveSpawnRateReduction: 100, // How much to reduce spawn time per wave
    minSpawnRate: 300,        // Minimum spawn time between zombies - reduced from 500
    scorePerKill: 10,         // Points per zombie kill
    waveScoreMultiplier: 0.5  // Score multiplier increase per wave
  };

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, options: GameOptions) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.options = options;
    
    // Create sound manager
    this.soundManager = new SoundManager(useAudio);
    
    // Create tower centered at bottom of screen
    this.tower = new Tower(
      canvas.width / 2, 
      canvas.height - 100, 
      60,  // Tower size
      100  // Tower health
    );
    
    // Initialize upgrade system
    this.upgradeSystem = new UpgradeSystem((upgradesAvailable) => {
      // When upgrades state changes, notify the game
      if (upgradesAvailable && this.state.waveCompleted) {
        // Only show upgrades if the wave is completed
        this.options.onUpgradeAvailable();
      }
    });
    
    // Set up click/touch event handlers
    this.setupEventListeners();
  }
  
  public updateCanvasSize(width: number, height: number): void {
    // Update tower position when canvas size changes
    this.tower.x = width / 2;
    this.tower.y = height - 100;
  }
  
  // Dev menu settings
  private devMenuOpen: boolean = false;
  private showHitboxes: boolean = false;
  private playerDataService: any = null; // Will be loaded dynamically
  
  private setupEventListeners(): void {
    // Mouse click handler
    this.canvas.addEventListener('click', this.handleClick);
    
    // Touch handler for mobile
    this.canvas.addEventListener('touchstart', this.handleTouch);
    
    // Keyboard handler for developer menu
    window.addEventListener('keydown', this.handleKeyDown);
    
    // Load PlayerDataService dynamically to avoid circular dependencies
    import('../services/PlayerDataService').then(module => {
      this.playerDataService = module.default;
      debug('Game', 'PlayerDataService loaded');
    }).catch(err => {
      debug('Game', 'Failed to load PlayerDataService', err);
    });
    
    // Listen for ranged zombie attacks
    window.addEventListener('zombie:ranged-attack', this.handleRangedZombieAttack as EventListener);
    
    // Listen for necromancer summon effects (for audio/visual effects)
    window.addEventListener('zombie:summon', this.handleZombieSummon as EventListener);
    
    // Listen for upgrade effect events
    window.addEventListener('zombie-explosion', this.handleZombieExplosion as EventListener);
    window.addEventListener('zombie-critical', this.handleZombieCritical as EventListener);
    window.addEventListener('zombie-necromantic', this.handleZombieNecromantic as EventListener);
    
    // Listen for zombie killed events (including those from friendly zombies)
    window.addEventListener('zombie-killed', this.handleZombieKilled as EventListener);
    
    // Create pause button
    this.createPauseButton();
    
    debug('Game', 'Event listeners attached');
  }
  
  // Create a pause button in the corner
  private createPauseButton(): void {
    // Check if button already exists
    if (document.getElementById('pause-button')) {
      return;
    }
    
    // Create button
    const pauseButton = document.createElement('button');
    pauseButton.id = 'pause-button';
    pauseButton.textContent = '⏸️';
    pauseButton.style.position = 'absolute';
    pauseButton.style.top = '10px';
    pauseButton.style.left = '10px';
    pauseButton.style.zIndex = '1000';
    pauseButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    pauseButton.style.color = 'white';
    pauseButton.style.border = 'none';
    pauseButton.style.borderRadius = '5px';
    pauseButton.style.padding = '8px 12px';
    pauseButton.style.cursor = 'pointer';
    pauseButton.style.fontSize = '18px';
    
    // Toggle pause state when clicked
    pauseButton.onclick = (event) => {
      event.stopPropagation(); // Prevent click from going through to canvas
      
      if (this.state.running) {
        this.pause();
        pauseButton.textContent = '▶️';
        
        // Show pause message
        const pauseMessage = document.createElement('div');
        pauseMessage.id = 'pause-message';
        pauseMessage.textContent = 'Game Paused';
        pauseMessage.style.position = 'absolute';
        pauseMessage.style.top = '50%';
        pauseMessage.style.left = '50%';
        pauseMessage.style.transform = 'translate(-50%, -50%)';
        pauseMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        pauseMessage.style.color = 'white';
        pauseMessage.style.padding = '15px 25px';
        pauseMessage.style.borderRadius = '10px';
        pauseMessage.style.zIndex = '999';
        pauseMessage.style.fontFamily = 'sans-serif';
        pauseMessage.style.fontSize = '24px';
        document.body.appendChild(pauseMessage);
      } else {
        // Remove pause message if it exists
        const pauseMessage = document.getElementById('pause-message');
        if (pauseMessage) {
          document.body.removeChild(pauseMessage);
        }
        
        pauseButton.textContent = '⏸️';
        this.resumeAfterUpgrade(); // Use the same resume logic as after upgrades
      }
    };
    
    document.body.appendChild(pauseButton);
  }
  
  // Handle ranged zombie attacks
  private handleRangedZombieAttack = (event: CustomEvent): void => {
    if (!this.state.running) return;
    
    const { damage, sourceX, sourceY, targetX, targetY } = event.detail;
    
    // Damage the tower directly
    this.tower.takeDamage(damage);
    
    // Create visual effect for the ranged attack
    this.createRangedAttackEffect(sourceX, sourceY, targetX, targetY);
    
    // Play hit sound
    this.soundManager.playHit();
  }
  
  // Handle necromancer summon effects
  private handleZombieSummon = (event: CustomEvent): void => {
    if (!this.state.running) return;
    
    const { sourceX, sourceY } = event.detail;
    
    // Create visual effect for summoning
    this.createSummonEffect(sourceX, sourceY);
  }
  
  // Handle explosive effect (regular or aftermath explosions)
  private handleZombieExplosion = (event: CustomEvent): void => {
    if (!this.state.running) return;
    
    const { x, y, damage, radius, source } = event.detail;
    
    // Create enhanced explosion particles
    const particleColor = source === 'aftermath' ? '#ff0000' : '#ff6600';
    const particleCount = source === 'aftermath' ? 15 : 12; // More particles for bigger visual effect
    
    // Create main explosion particles with explosion flag
    this.createHitParticles(x, y, particleCount, particleColor, true);
    
    // Create a secondary ring of particles with different color for visual effect
    const secondaryColor = source === 'aftermath' ? '#ffcc00' : '#ffaa00';
    this.createHitParticles(x, y, Math.floor(particleCount/2), secondaryColor, true);
    
    // Play hit sound
    this.soundManager.playHit();
    
    // Apply damage to nearby zombies
    this.zombies.forEach(zombie => {
      if (zombie.active && !zombie.friendly) { // Don't damage friendly zombies
        const dx = zombie.x - x;
        const dy = zombie.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
          // Damage falls off with distance
          const damageFactor = 1 - (distance / radius);
          const explosionDamage = damage * damageFactor;
          
          // Apply damage
          zombie.takeDamage(explosionDamage);
          
          // Create hit particles on affected zombies with smaller explosion effect
          this.createHitParticles(zombie.x, zombie.y, 3, particleColor, true);
        }
      }
    });
  }
  
  // Handle critical strike visual effect
  private handleZombieCritical = (event: CustomEvent): void => {
    if (!this.state.running) return;
    
    const { x, y, damage } = event.detail;
    
    // Create critical hit particles
    this.createHitParticles(x, y, 5, '#ffff00');
    
    // Play hit sound
    this.soundManager.playHit();
  }
  
  // Handle necromantic effect visual cue
  private handleZombieNecromantic = (event: CustomEvent): void => {
    if (!this.state.running) return;
    
    const { x, y } = event.detail;
    
    // Create necromantic particles
    this.createHitParticles(x, y, 5, '#9900ff');
    
    // Play appropriate sound
    this.soundManager.playZombieDeath();
  }
  
  // Handle zombie killed event (including from friendly zombies)
  private handleZombieKilled = (event: CustomEvent): void => {
    if (!this.state.running) return;
    
    const { x, y, fromFriendly, zombieType } = event.detail;
    
    // Increase score
    const scoreGain = Math.floor(
      this.settings.scorePerKill * 
      (1 + this.settings.waveScoreMultiplier * (this.state.wave - 1))
    );
    
    this.state.score += scoreGain;
    this.state.zombiesKilled++;
    
    debug('Zombie', 'Zombie killed by ' + (fromFriendly ? 'friendly zombie' : 'player'), {
      zombieType,
      x, 
      y,
      fromFriendly,
      zombiesKilled: this.state.zombiesKilled,
      nextWaveThreshold: this.state.nextWaveThreshold
    });
    
    // Update UI
    this.options.onScoreUpdate(this.state.score);
    
    // Create different particles based on who killed the zombie
    if (fromFriendly) {
      // Friendly zombie kill - green particles
      this.createHitParticles(x, y, 6, '#33ff55');
    } else {
      // Player kill - standard particles
      this.createHitParticles(x, y, 8, '#55aa55');
    }
    
    // Play zombie death sound
    this.soundManager.playZombieDeath();
    
    // Check for wave completion based on kill count
    const nextWaveThreshold = this.state.nextWaveThreshold;
    const zombiesKilled = this.state.zombiesKilled;
    
    if (zombiesKilled >= nextWaveThreshold) {
      debug('Zombie', 'Wave completion triggered', {
        zombiesKilled,
        threshold: nextWaveThreshold,
        currentWave: this.state.wave,
        killedByFriendly: fromFriendly
      });
      
      // Use a small timeout to ensure this happens after the current frame processing
      setTimeout(() => {
        try {
          if (this.state.running && !this.state.waveCompleted) {
            this.state.waveCompleted = true;
            
            // Log completion details
            debug('Wave', 'Wave completed', {
              wave: this.state.wave, 
              zombiesKilled: this.state.zombiesKilled, 
              threshold: this.state.nextWaveThreshold
            });
            
            if (this.state.wave >= 20) {
              // Player won the game after 20 waves
              this.gameWin();
            } else {
              // Trigger upgrade screen after short delay
              setTimeout(() => {
                if (this.state.running) {
                  // UpgradeSystem doesn't have a selectUpgradesForWave method
                  // Just check if upgrades are available
                  const upgradesAvailable = this.upgradeSystem.areUpgradesAvailable();
                  
                  // Save the game state before showing upgrades
                  // This is critical to ensure wave progression works correctly
                  this.saveGameState();
                  
                  // Notify parent component about available upgrades
                  this.options.onUpgradeAvailable();
                  
                  // Pause game until upgrade is selected
                  this.pause();
                }
              }, 500);
            }
          }
        } catch (err) {
          debug('Zombie', 'ERROR during wave completion', err);
        }
      }, 50);
    }
  }
  
  // Handle keyboard events for developer menu
  private handleKeyDown = (event: KeyboardEvent): void => {
    // 'i' key toggles developer menu
    if (event.key === 'i' || event.key === 'I') {
      this.toggleDevMenu();
    }
  }
  
  // Toggle the developer menu
  private toggleDevMenu(): void {
    this.devMenuOpen = !this.devMenuOpen;
    
    if (this.devMenuOpen) {
      this.createDevMenu();
    } else {
      this.removeDevMenu();
    }
  }
  
  // Create the developer menu
  private createDevMenu(): void {
    // Check if menu already exists
    if (document.getElementById('dev-menu')) {
      return;
    }
    
    // Create the menu container
    const menuContainer = document.createElement('div');
    menuContainer.id = 'dev-menu';
    menuContainer.style.position = 'absolute';
    menuContainer.style.top = '10px';
    menuContainer.style.right = '10px';
    menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    menuContainer.style.color = 'white';
    menuContainer.style.padding = '10px';
    menuContainer.style.borderRadius = '5px';
    menuContainer.style.zIndex = '1000';
    menuContainer.style.fontFamily = 'Arial, sans-serif';
    menuContainer.style.fontSize = '14px';
    menuContainer.style.maxHeight = '80vh';
    menuContainer.style.overflowY = 'auto';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Developer Menu';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#ff9900';
    menuContainer.appendChild(title);
    
    // Add score controls
    const scoreDiv = document.createElement('div');
    scoreDiv.style.marginBottom = '10px';
    
    const scoreLabel = document.createElement('label');
    scoreLabel.textContent = 'Score: ';
    scoreDiv.appendChild(scoreLabel);
    
    const scoreInput = document.createElement('input');
    scoreInput.type = 'number';
    scoreInput.value = this.state.score.toString();
    scoreInput.style.width = '100px';
    scoreInput.style.marginRight = '5px';
    scoreDiv.appendChild(scoreInput);
    
    const addScoreButton = document.createElement('button');
    addScoreButton.textContent = 'Set Score';
    addScoreButton.onclick = () => {
      const score = parseInt(scoreInput.value);
      if (!isNaN(score) && score >= 0) {
        this.state.score = score;
        debug('DevMenu', `Set score to ${score}`);
      }
    };
    scoreDiv.appendChild(addScoreButton);
    
    menuContainer.appendChild(scoreDiv);
    
    // Add spawn zombie controls
    const spawnDiv = document.createElement('div');
    spawnDiv.style.marginBottom = '10px';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Zombie Type: ';
    spawnDiv.appendChild(typeLabel);
    
    const typeSelect = document.createElement('select');
    typeSelect.style.marginRight = '5px';
    
    const zombieTypes = Object.values(ZombieType);
    zombieTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      typeSelect.appendChild(option);
    });
    
    spawnDiv.appendChild(typeSelect);
    
    const spawnButton = document.createElement('button');
    spawnButton.textContent = 'Spawn Zombie';
    spawnButton.onclick = () => {
      const selectedType = typeSelect.value as ZombieType;
      this.spawnZombie(selectedType);
      debug('DevMenu', `Spawned ${selectedType} zombie`);
    };
    spawnDiv.appendChild(spawnButton);
    
    menuContainer.appendChild(spawnDiv);
    
    // Add upgrade controls
    const upgradeDiv = document.createElement('div');
    upgradeDiv.style.marginBottom = '10px';
    
    const upgradeLabel = document.createElement('label');
    upgradeLabel.textContent = 'Apply Upgrade: ';
    upgradeDiv.appendChild(upgradeLabel);
    
    const upgradeSelect = document.createElement('select');
    upgradeSelect.style.marginRight = '5px';
    
    // Get all upgrades from the upgrade system
    const upgrades = this.upgradeSystem.getAllUpgrades();
    upgrades.forEach((upgrade: Upgrade) => {
      const option = document.createElement('option');
      option.value = upgrade.id;
      option.textContent = `${upgrade.name} (${upgrade.currentLevel}/${upgrade.maxLevel})`;
      upgradeSelect.appendChild(option);
    });
    
    upgradeDiv.appendChild(upgradeSelect);
    
    const applyUpgradeButton = document.createElement('button');
    applyUpgradeButton.textContent = 'Apply Upgrade';
    applyUpgradeButton.onclick = () => {
      const upgradeId = upgradeSelect.value;
      const applied = this.upgradeSystem.applyUpgrade(upgradeId);
      if (applied) {
        debug('DevMenu', `Applied upgrade: ${upgradeId}`);
        
        // Apply all upgrades to the game state
        this.upgradeSystem.applyAllUpgrades(this.state);
        
        // Update the select element to show new level
        const upgrades = this.upgradeSystem.getAllUpgrades();
        const selectedUpgrade = upgrades.find(u => u.id === upgradeId);
        
        if (selectedUpgrade) {
          // Find and update the option
          for (let i = 0; i < upgradeSelect.options.length; i++) {
            if (upgradeSelect.options[i].value === upgradeId) {
              upgradeSelect.options[i].textContent = 
                `${selectedUpgrade.name} (${selectedUpgrade.currentLevel}/${selectedUpgrade.maxLevel})`;
              break;
            }
          }
        }
      } else {
        debug('DevMenu', `Failed to apply upgrade: ${upgradeId} (Max level reached or incompatible)`);
      }
    };
    upgradeDiv.appendChild(applyUpgradeButton);
    
    menuContainer.appendChild(upgradeDiv);
    
    // Add wave controls
    const waveDiv = document.createElement('div');
    waveDiv.style.marginBottom = '10px';
    
    const waveLabel = document.createElement('label');
    waveLabel.textContent = 'Wave: ';
    waveDiv.appendChild(waveLabel);
    
    const waveInput = document.createElement('input');
    waveInput.type = 'number';
    waveInput.value = this.state.wave.toString();
    waveInput.min = '1';
    waveInput.max = '20';
    waveInput.style.width = '60px';
    waveInput.style.marginRight = '5px';
    waveDiv.appendChild(waveInput);
    
    const skipWaveButton = document.createElement('button');
    skipWaveButton.textContent = 'Skip to Wave';
    skipWaveButton.onclick = () => {
      const targetWave = parseInt(waveInput.value);
      if (!isNaN(targetWave) && targetWave >= 1 && targetWave <= 20) {
        // Set the wave to one less than target, as startNextWave will increment it
        this.state.wave = targetWave - 1;
        debug('DevMenu', `Skipping to wave ${targetWave}`);
        
        // Clear current zombies
        this.zombies = [];
        
        // Start the next wave
        if (this.state.running) {
          this.startNextWave();
        } else {
          this.state.running = true;
          this.startNextWave();
          this.state.running = false;
        }
      }
    };
    waveDiv.appendChild(skipWaveButton);
    
    menuContainer.appendChild(waveDiv);
    
    // Add hitbox toggle
    const hitboxDiv = document.createElement('div');
    hitboxDiv.style.marginBottom = '10px';
    
    const hitboxLabel = document.createElement('label');
    hitboxLabel.textContent = 'Show Hitboxes: ';
    hitboxDiv.appendChild(hitboxLabel);
    
    const hitboxCheckbox = document.createElement('input');
    hitboxCheckbox.type = 'checkbox';
    hitboxCheckbox.checked = this.showHitboxes;
    hitboxCheckbox.style.marginRight = '5px';
    hitboxCheckbox.onchange = () => {
      this.showHitboxes = hitboxCheckbox.checked;
      debug('DevMenu', `Show hitboxes: ${this.showHitboxes}`);
    };
    hitboxDiv.appendChild(hitboxCheckbox);
    
    menuContainer.appendChild(hitboxDiv);
    
    // Add player data controls if PlayerDataService is loaded
    if (this.playerDataService) {
      const playerDataDiv = document.createElement('div');
      playerDataDiv.style.marginBottom = '15px';
      playerDataDiv.style.borderTop = '1px solid #444';
      playerDataDiv.style.paddingTop = '10px';
      
      const playerDataTitle = document.createElement('h4');
      playerDataTitle.textContent = 'Player Data';
      playerDataTitle.style.margin = '0 0 8px 0';
      playerDataTitle.style.color = '#66ccff';
      playerDataDiv.appendChild(playerDataTitle);
      
      // Player ID display and change field
      const playerIdDiv = document.createElement('div');
      playerIdDiv.style.marginBottom = '8px';
      
      // Get current player ID
      const currentPlayerId = this.playerDataService.getPlayerId() || 'Loading...';
      
      const playerIdLabel = document.createElement('div');
      playerIdLabel.innerHTML = `Current ID: <span style="color:#66ccff;font-family:monospace;font-size:12px">${currentPlayerId}</span>`;
      playerIdLabel.style.marginBottom = '5px';
      playerIdDiv.appendChild(playerIdLabel);
      
      const playerIdInput = document.createElement('input');
      playerIdInput.type = 'text';
      playerIdInput.placeholder = 'New Player ID';
      playerIdInput.style.width = '140px';
      playerIdInput.style.marginRight = '5px';
      playerIdDiv.appendChild(playerIdInput);
      
      const changeIdButton = document.createElement('button');
      changeIdButton.textContent = 'Change ID';
      changeIdButton.onclick = async () => {
        const newId = playerIdInput.value.trim();
        if (newId) {
          try {
            debug('DevMenu', `Changing player ID to: ${newId}`);
            await this.playerDataService.changePlayerId(newId);
            
            // Update the display with new ID
            playerIdLabel.innerHTML = `Current ID: <span style="color:#66ccff;font-family:monospace;font-size:12px">${newId}</span>`;
            playerIdInput.value = '';
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.textContent = 'Player ID changed successfully!';
            successMsg.style.color = '#4CAF50';
            successMsg.style.fontSize = '12px';
            successMsg.style.marginTop = '5px';
            playerIdDiv.appendChild(successMsg);
            
            // Remove success message after 3 seconds
            setTimeout(() => {
              if (successMsg.parentNode === playerIdDiv) {
                playerIdDiv.removeChild(successMsg);
              }
            }, 3000);
          } catch (error) {
            console.error('Failed to change player ID:', error);
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.textContent = 'Failed to change player ID';
            errorMsg.style.color = '#f44336';
            errorMsg.style.fontSize = '12px';
            errorMsg.style.marginTop = '5px';
            playerIdDiv.appendChild(errorMsg);
            
            // Remove error message after 3 seconds
            setTimeout(() => {
              if (errorMsg.parentNode === playerIdDiv) {
                playerIdDiv.removeChild(errorMsg);
              }
            }, 3000);
          }
        }
      };
      playerIdDiv.appendChild(changeIdButton);
      playerDataDiv.appendChild(playerIdDiv);
      
      // Generate new random ID button
      const newRandomIdButton = document.createElement('button');
      newRandomIdButton.textContent = 'Generate Random ID';
      newRandomIdButton.style.marginBottom = '10px';
      newRandomIdButton.onclick = async () => {
        try {
          // Load uuid dynamically
          const { v4: uuidv4 } = await import('uuid');
          const randomId = uuidv4();
          playerIdInput.value = randomId;
        } catch (error) {
          console.error('Failed to generate UUID:', error);
          playerIdInput.value = 'player_' + Math.random().toString(36).substring(2, 10);
        }
      };
      playerDataDiv.appendChild(newRandomIdButton);
      
      // Coins display
      const coinsDisplayDiv = document.createElement('div');
      coinsDisplayDiv.style.marginBottom = '8px';
      
      const updateCoinsDisplay = () => {
        const currentCoins = this.playerDataService.getCoins();
        coinsDisplayDiv.innerHTML = `Coins: <span style="color:#ffcc00;font-weight:bold">${currentCoins}</span>`;
      };
      
      // Initial display
      updateCoinsDisplay();
      
      // Add coin controls
      const coinControlDiv = document.createElement('div');
      coinControlDiv.style.display = 'flex';
      coinControlDiv.style.alignItems = 'center';
      coinControlDiv.style.marginBottom = '8px';
      
      const coinInput = document.createElement('input');
      coinInput.type = 'number';
      coinInput.min = '0';
      coinInput.placeholder = 'Amount';
      coinInput.style.width = '80px';
      coinInput.style.marginRight = '5px';
      coinControlDiv.appendChild(coinInput);
      
      const addCoinsButton = document.createElement('button');
      addCoinsButton.textContent = 'Add';
      addCoinsButton.style.marginRight = '5px';
      addCoinsButton.onclick = async () => {
        const amount = parseInt(coinInput.value);
        if (!isNaN(amount) && amount > 0) {
          await this.playerDataService.updateCoins(amount);
          updateCoinsDisplay();
          coinInput.value = '';
        }
      };
      coinControlDiv.appendChild(addCoinsButton);
      
      const removeCoinsButton = document.createElement('button');
      removeCoinsButton.textContent = 'Remove';
      removeCoinsButton.onclick = async () => {
        const amount = parseInt(coinInput.value);
        if (!isNaN(amount) && amount > 0) {
          await this.playerDataService.updateCoins(-amount);
          updateCoinsDisplay();
          coinInput.value = '';
        }
      };
      coinControlDiv.appendChild(removeCoinsButton);
      
      playerDataDiv.appendChild(coinsDisplayDiv);
      playerDataDiv.appendChild(coinControlDiv);
      
      menuContainer.appendChild(playerDataDiv);
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '10px';
    closeButton.onclick = () => {
      this.toggleDevMenu();
    };
    menuContainer.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(menuContainer);
  }
  
  // Remove the developer menu
  private removeDevMenu(): void {
    const menu = document.getElementById('dev-menu');
    if (menu) {
      document.body.removeChild(menu);
    }
  }
  
  // Create a visual effect for ranged attacks
  private createRangedAttackEffect(sourceX: number, sourceY: number, targetX: number, targetY: number): void {
    // Direction vector from source to target
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Create particles along the path
    const numParticles = Math.min(10, Math.floor(distance / 20));
    for (let i = 0; i < numParticles; i++) {
      // Distribute particles along the path
      const progress = i / numParticles;
      const x = sourceX + dx * progress;
      const y = sourceY + dy * progress;
      
      // Create particle with red color for ranged attack
      const particle = new Particle(
        x,
        y,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        3 + Math.random() * 3,
        '#ff3333',
        0.5 + Math.random() * 0.5
      );
      
      this.particles.push(particle);
    }
  }
  
  // Create a visual effect for summoning
  private createSummonEffect(x: number, y: number): void {
    // Create a circular pattern of particles
    const numParticles = 12;
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      const speed = 30 + Math.random() * 20;
      
      // Create purple/magical particles in a circle
      const particle = new Particle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        4 + Math.random() * 4,
        '#8822aa',
        1 + Math.random() * 0.5
      );
      
      this.particles.push(particle);
    }
  }
  
  private handleClick = (event: MouseEvent): void => {
    if (!this.state.running) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.shootBullet(x, y);
  }
  
  private handleTouch = (event: TouchEvent): void => {
    if (!this.state.running) return;
    event.preventDefault();
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.shootBullet(x, y);
  }
  
  private shootBullet(targetX: number, targetY: number): void {
    // Calculate direction vector from tower to target
    const dx = targetX - this.tower.x;
    const dy = targetY - this.tower.y;
    
    // Normalize the direction vector
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    // Get bullet properties from game state
    const bulletCount = this.state.bulletCount;
    const bulletBounces = this.state.bulletBounces;
    const ghostBullets = this.state.ghostBulletsEnabled;
    const damagePerBounce = this.state.damagePerBounce;
    const bulletDamageMultiplier = this.state.bulletDamageMultiplier;
    const bulletSpeed = this.state.bulletSpeed;
    const homingEnabled = this.state.homingEnabled;
    
    // Create bullets based on bulletCount
    if (bulletCount === 1) {
      // Just shoot one bullet
      const bullet = new Bullet(
        this.tower.x,
        this.tower.y,
        normalizedDx,
        normalizedDy,
        10,  // bullet size
        bulletSpeed, // From state (varies based on bullet time or hitscan)
        bulletBounces, // number of bounces
        ghostBullets, // Whether this is a ghost bullet
        damagePerBounce, // Additional damage per bounce
        bulletDamageMultiplier, // Damage multiplier
        false, // disabled
        homingEnabled // homing bullets
      );
      
      this.bullets.push(bullet);
    } else {
      // First bullet - straight at target (no spread)
      const mainBullet = new Bullet(
        this.tower.x,
        this.tower.y,
        normalizedDx,
        normalizedDy,
        10,  // bullet size
        bulletSpeed, // From state
        bulletBounces, // number of bounces
        ghostBullets, // Whether this is a ghost bullet
        damagePerBounce, // Additional damage per bounce
        bulletDamageMultiplier, // Damage multiplier
        false, // disabled
        homingEnabled // homing bullets
      );
      
      this.bullets.push(mainBullet);
      
      // Add additional bullets with random spread
      if (bulletCount > 1) {
        // Shoot remaining bullets with spread
        for (let i = 1; i < bulletCount; i++) {
          // Random spread between -15 and 15 degrees for extra bullets
          const randomSpread = (Math.random() * 30 - 15) * (Math.PI / 180);
          
          // Calculate new direction with spread
          const baseAngle = Math.atan2(normalizedDy, normalizedDx);
          const newAngle = baseAngle + randomSpread;
          
          const spreadDx = Math.cos(newAngle);
          const spreadDy = Math.sin(newAngle);
          
          // Create bullet with spread direction
          const bullet = new Bullet(
            this.tower.x,
            this.tower.y,
            spreadDx,
            spreadDy,
            10, // bullet size
            bulletSpeed, // From state
            bulletBounces, // number of bounces
            ghostBullets, // Whether this is a ghost bullet
            damagePerBounce, // Additional damage per bounce
            bulletDamageMultiplier, // Damage multiplier
            false, // disabled
            homingEnabled // homing bullets
          );
          
          this.bullets.push(bullet);
        }
      }
    }
    
    this.soundManager.playShoot();
    
    // Debug the bullet properties
    debug('Bullets', 'Created bullets', {
      count: bulletCount,
      bounces: bulletBounces,
      ghost: ghostBullets,
      damagePerBounce,
      speed: bulletSpeed,
      damageMultiplier: bulletDamageMultiplier,
      homing: homingEnabled
    });
  }
  
  private findNearestZombie(): { x: number, y: number } | null {
    if (this.zombies.length === 0) {
      return null;
    }
    
    // First group zombies by priority
    const priorityGroups: { [key: number]: Zombie[] } = {};
    let highestPriority = -Infinity;
    
    // Organize zombies into priority groups
    for (const zombie of this.zombies) {
      // Get zombie priority, or default to 0
      const priority = zombie.autoAimPriority || 0;
      
      // Create priority group if it doesn't exist
      if (!priorityGroups[priority]) {
        priorityGroups[priority] = [];
      }
      
      // Add zombie to its priority group
      priorityGroups[priority].push(zombie);
      
      // Keep track of highest priority
      if (priority > highestPriority) {
        highestPriority = priority;
      }
    }
    
    // Get the group of zombies with highest priority
    const highestPriorityZombies = priorityGroups[highestPriority] || this.zombies;
    
    // Now find the closest zombie within the highest priority group
    let closestZombie = highestPriorityZombies[0];
    let closestDistance = Number.MAX_VALUE;
    
    for (const zombie of highestPriorityZombies) {
      const dx = zombie.x - this.tower.x;
      const dy = zombie.y - this.tower.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestZombie = zombie;
      }
    }
    
    // Debug which zombie type was chosen
    debug('Game', 'Auto-aim targeting', {
      zombieType: closestZombie.type,
      priority: closestZombie.autoAimPriority,
      distance: closestDistance
    });
    
    return { x: closestZombie.x, y: closestZombie.y };
  }
  
  // Method to handle auto-aim shooting (now runs automatically, not just from spacebar)
  public autoShoot(): void {
    if (!this.state.running || !this.state.autoAimEnabled) return;
    
    // Check if cooldown has elapsed
    const currentTime = performance.now();
    if (currentTime - this.state.lastAutoAimTime < this.state.autoAimCooldown) {
      // Only log on debug mode to prevent console spam
      if (false) {
        debug('Game', 'Auto-aim on cooldown', {
          elapsed: currentTime - this.state.lastAutoAimTime,
          cooldown: this.state.autoAimCooldown
        });
      }
      return;
    }
    
    // Find nearest zombie
    const target = this.findNearestZombie();
    if (target) {
      // Update last auto-aim time
      this.state.lastAutoAimTime = currentTime;
      
      // Shoot at the target
      this.shootBullet(target.x, target.y);
      
      debug('Game', 'Auto-aim fired', {
        targetX: target.x,
        targetY: target.y
      });
    }
  }
  
  // Track if this is the first start to handle upgrades properly
  private isFirstStart: boolean = true;
  
  // Start method can preserve state for resuming after an upgrade
  public start(preserveState: boolean = false): void {
    debug('Game', 'Starting game', { preserveState });
    
    if (this.state.running) {
      debug('Game', 'Ignoring start request - game already running');
      return;
    }
    
    // If preserveState is true, we're resuming after an upgrade
    if (preserveState) {
      // Just resume the game without resetting everything
      this.resumeAfterUpgrade();
      return;
    }
    
    // Save existing upgrade values before resetting
    const savedState = {
      wave: this.state.wave,
      score: this.state.score,
      bulletCount: this.state.bulletCount,
      bulletBounces: this.state.bulletBounces,
      autoAimEnabled: this.state.autoAimEnabled
    };
    
    // Reset game state
    this.state = {
      running: true,
      score: 0,
      wave: 1,
      zombiesKilled: 0,
      timeSinceLastSpawn: Number.MAX_VALUE, // Set to max to force immediate zombie spawn
      nextWaveThreshold: 10,
      waveCompleted: false,
      zombiesInWave: 10,     // Initial zombies per wave
      zombiesSpawned: 0,     // Track zombies spawned
      
      // Initialize upgrade-related properties
      bulletCount: 1,        // Start with 1 bullet
      bulletBounces: 0,      // Start with no bounces
      autoAimEnabled: false, // Start with auto-aim disabled
      autoAimCooldown: 750,  // 0.75 second cooldown
      lastAutoAimTime: 0,    // Last time auto-aim was used
      
      // New upgrade properties
      tricksterLevel: 0,
      damagePerBounce: 0,
      ghostBulletsEnabled: false,
      bulletTimeEnabled: false,
      hitscanEnabled: false,
      bulletDamageMultiplier: 1,
      baseBulletSpeed: 600,
      bulletSpeed: 600,
      
      // New upgrades - 2023 additions
      explosiveEnabled: false,
      explosiveLevel: 0,
      implosiveEnabled: false,
      implosiveLevel: 0,
      splitEnabled: false,
      splitLevel: 0,
      aftermathEnabled: false,
      criticalEnabled: false,
      criticalLevel: 0,
      necromanticEnabled: false,
      lifeStealEnabled: false,
      lifeStealLevel: 0,
      homingEnabled: false
    };
    
    debug('Game', 'Game state reset', this.state);
    
    // Reset entities
    this.zombies = [];
    this.bullets = [];
    this.particles = [];
    
    // Reset tower
    this.tower.reset();
    
    // Notify UI of initial state
    this.updateUI();
    
    // Start game loop
    this.lastFrameTime = performance.now();
    this.gameLoop();
    
    // Force-spawn a zombie immediately to start the game with action
    this.spawnZombie();
    debug('Game', 'Spawned initial zombie to start game');
    
    debug('Game', 'Game loop started');
  }
  
  public pause(): void {
    debug('Game', 'Pausing game');
    
    this.state.running = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      debug('Game', 'Animation frame cancelled');
    }
  }
  
  // Store game state before showing upgrade screen
  private savedGameState: SavedGameState | null = null;
  
  // Method to save game state before showing upgrade screen
  public saveGameState(): void {
    // Create a deep copy of important state properties as SavedGameState
    this.savedGameState = {
      wave: this.state.wave,
      score: this.state.score,
      zombiesKilled: this.state.zombiesKilled,
      nextWaveThreshold: this.state.nextWaveThreshold,
      waveCompleted: this.state.waveCompleted
    };
    
    // Save the current upgrade state as well
    if (this.savedGameState && this.state.bulletCount > 1) this.savedGameState.bulletCount = this.state.bulletCount;
    if (this.savedGameState && this.state.bulletBounces > 0) this.savedGameState.bulletBounces = this.state.bulletBounces;
    if (this.savedGameState && this.state.autoAimEnabled) this.savedGameState.autoAimEnabled = this.state.autoAimEnabled;
    
    // Save other upgrade states
    if (this.savedGameState && this.state.tricksterLevel > 0) {
      this.savedGameState.tricksterLevel = this.state.tricksterLevel;
      this.savedGameState.damagePerBounce = this.state.damagePerBounce;
    }
    
    if (this.savedGameState && this.state.ghostBulletsEnabled) this.savedGameState.ghostBulletsEnabled = true;
    if (this.savedGameState && this.state.bulletTimeEnabled) this.savedGameState.bulletTimeEnabled = true;
    if (this.savedGameState && this.state.hitscanEnabled) this.savedGameState.hitscanEnabled = true;
    
    // Save 2023 upgrade states
    if (this.savedGameState && this.state.explosiveEnabled) {
      this.savedGameState.explosiveEnabled = true;
      this.savedGameState.explosiveLevel = this.state.explosiveLevel;
    }
    
    if (this.savedGameState && this.state.implosiveEnabled) {
      this.savedGameState.implosiveEnabled = true;
      this.savedGameState.implosiveLevel = this.state.implosiveLevel;
    }
    
    if (this.savedGameState && this.state.splitEnabled) {
      this.savedGameState.splitEnabled = true;
      this.savedGameState.splitLevel = this.state.splitLevel;
    }
    
    if (this.savedGameState && this.state.aftermathEnabled) this.savedGameState.aftermathEnabled = true;
    if (this.savedGameState && this.state.criticalEnabled) {
      this.savedGameState.criticalEnabled = true;
      this.savedGameState.criticalLevel = this.state.criticalLevel;
    }
    
    if (this.savedGameState && this.state.necromanticEnabled) this.savedGameState.necromanticEnabled = true;
    if (this.savedGameState && this.state.lifeStealEnabled) {
      this.savedGameState.lifeStealEnabled = true;
      this.savedGameState.lifeStealLevel = this.state.lifeStealLevel;
    }
    
    if (this.savedGameState && this.state.homingEnabled) this.savedGameState.homingEnabled = true;
    
    debug('Game', 'Game state saved for upgrade transition', this.savedGameState);
  }
  
  // Resume after upgrade (don't reset state like start() does)
  public resumeAfterUpgrade(): void {
    debug('Game', 'Resuming after upgrade');
    
    // Make sure we cancel any previous animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Restore the saved game state if available
    if (this.savedGameState) {
      debug('Game', 'Restoring saved game state', this.savedGameState);
      
      // Restore wave, score, and other state
      this.state.wave = this.savedGameState.wave;
      this.state.score = this.savedGameState.score;
      
      // If wave was completed, move to the next wave
      if (this.savedGameState.waveCompleted) {
        debug('Game', 'Wave was completed, advancing to next wave');
        this.state.wave++; // Increment wave
        this.state.zombiesKilled = 0; // Reset for the new wave
        
        // Increase the next wave threshold (more zombies per wave)
        this.state.nextWaveThreshold = Math.ceil(this.savedGameState.nextWaveThreshold * 1.5);
        
        // Update wave UI
        this.updateUI();
        
        debug('Game', 'Advanced to wave ' + this.state.wave);
      } else {
        // Keep same wave, but reset zombies killed
        this.state.zombiesKilled = 0;
        this.state.nextWaveThreshold = this.savedGameState.nextWaveThreshold;
      }
      
      // Restore all upgrade states that were saved
      Object.entries(this.savedGameState).forEach(([key, value]) => {
        if (key !== 'wave' && key !== 'score' && key !== 'zombiesKilled' && 
            key !== 'nextWaveThreshold' && key !== 'waveCompleted') {
          // @ts-ignore - we know these properties exist
          this.state[key] = value;
        }
      });
      
      // Clear saved state to avoid reusing it
      this.savedGameState = null;
    } else {
      debug('Game', 'Warning: No saved game state to restore');
    }
    
    // Set the required state flags
    this.state.running = true; 
    this.state.waveCompleted = false;
    
    // IMPORTANT: Reset timeSinceLastSpawn to a high value to trigger immediate zombie spawning
    this.state.timeSinceLastSpawn = Number.MAX_VALUE;
    
    // Apply all upgrades again to ensure they're applied
    this.upgradeSystem.applyAllUpgrades(this.state);
    
    // Log the state we're resuming with
    debug('Game', 'Resuming with state', { 
      wave: this.state.wave,
      score: this.state.score,
      bulletCount: this.state.bulletCount,
      bulletBounces: this.state.bulletBounces,
      autoAimEnabled: this.state.autoAimEnabled
    });
    
    // Re-initialize the game loop
    this.lastFrameTime = performance.now();
    this.gameLoop();
    
    // Force-spawn a zombie immediately to ensure wave starts with action
    this.spawnZombie();
    debug('Game', 'Spawned initial zombie to start wave');
    
    debug('Game', 'Game loop resumed after upgrade');
  }
  
  public destroy(): void {
    debug('Game', 'Destroying game instance');
    
    this.pause();
    
    // Remove event listeners
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('touchstart', this.handleTouch);
    window.removeEventListener('keydown', this.handleKeyDown);
    
    // Remove custom event listeners for special zombie abilities
    window.removeEventListener('zombie:ranged-attack', this.handleRangedZombieAttack as EventListener);
    window.removeEventListener('zombie:summon', this.handleZombieSummon as EventListener);
    
    // Remove upgrade effect event listeners
    window.removeEventListener('zombie-explosion', this.handleZombieExplosion as EventListener);
    window.removeEventListener('zombie-critical', this.handleZombieCritical as EventListener);
    window.removeEventListener('zombie-necromantic', this.handleZombieNecromantic as EventListener);
    window.removeEventListener('zombie-killed', this.handleZombieKilled as EventListener);
    
    // Remove pause button if it exists
    const pauseButton = document.getElementById('pause-button');
    if (pauseButton) {
      document.body.removeChild(pauseButton);
    }
    
    // Remove pause message if it exists
    const pauseMessage = document.getElementById('pause-message');
    if (pauseMessage) {
      document.body.removeChild(pauseMessage);
    }
    
    // Remove victory message if it exists
    const winMessage = document.querySelector('.game-win-message');
    if (winMessage) {
      document.body.removeChild(winMessage);
    }
    
    // Remove developer menu if it exists
    this.removeDevMenu();
    
    debug('Game', 'Event listeners removed');
  }
  
  private gameLoop = (timestamp: number = 0): void => {
    if (!this.state.running) {
      debug('GameLoop', 'Game not running, skipping frame');
      return;
    }
    
    try {
      // Calculate time since last frame
      const deltaTime = timestamp - this.lastFrameTime;
      
      // Prevent huge time steps (e.g., after tab was inactive)
      const cappedDeltaTime = Math.min(deltaTime, 100); 
      
      // Debug every 60 frames (approximately once per second)
      if (Math.floor(timestamp / 1000) !== Math.floor(this.lastFrameTime / 1000)) {
        // Count only non-friendly zombies for game statistics
        const enemyZombieCount = this.zombies.filter(z => !z.friendly).length;
        
        debug('GameLoop', 'Stats', {
          fps: Math.round(1000 / deltaTime),
          zombies: enemyZombieCount,
          friendlyZombies: this.zombies.filter(z => z.friendly).length,
          bullets: this.bullets.length,
          particles: this.particles.length,
          wave: this.state.wave,
          score: this.state.score,
          towerHealth: this.tower.health
        });
      }
      
      this.lastFrameTime = timestamp;
      
      // Update and render
      this.update(cappedDeltaTime);
      this.render();
      
      // Check game state health
      if (this.zombies.length > 100) {
        debug('GameLoop', 'Too many zombies, pruning', this.zombies.length);
        this.zombies = this.zombies.slice(-50);
      }
      
      if (this.bullets.length > 200) {
        debug('GameLoop', 'Too many bullets, pruning', this.bullets.length);
        this.bullets = this.bullets.slice(-50);
      }
      
      if (this.particles.length > 500) {
        debug('GameLoop', 'Too many particles, pruning', this.particles.length);
        this.particles = this.particles.slice(-100);
      }
    } catch (error) {
      console.error('Error in game loop:', error);
      debug('GameLoop', 'CRITICAL ERROR - Attempting recovery', error);
      
      // Attempt to recover - reset entities but keep game running
      this.zombies = [];
      this.bullets = [];
      this.particles = [];
    }
    
    // Always schedule next frame, even if there was an error
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }
  
  private update(deltaTime: number): void {
    // Convert to seconds for physics calculations
    const dt = deltaTime / 1000;
    
    // Call autoShoot automatically if auto-aim is enabled
    // This replaces the need to press spacebar for auto-aim
    if (this.state.autoAimEnabled) {
      this.autoShoot();
    }
    
    // Spawn zombies based on time and wave
    this.state.timeSinceLastSpawn += deltaTime;
    
    const spawnRate = Math.max(
      this.settings.minSpawnRate,
      this.settings.baseSpawnRate - (this.state.wave - 1) * this.settings.waveSpawnRateReduction
    );
    
    if (
      this.state.timeSinceLastSpawn > spawnRate && 
      this.zombies.length < this.settings.maxZombies
    ) {
      this.spawnZombie();
      this.state.timeSinceLastSpawn = 0;
    }
    
    // Update towers
    this.tower.update(dt);
    
    // Update zombies
    this.zombies.forEach(zombie => {
      zombie.update(dt, this.tower.x, this.tower.y, this.zombies);
      
      // Check if zombie reached the tower - only if it's not a friendly zombie
      if (!zombie.friendly && zombie.isCollidingWith(this.tower)) {
        // Damage tower
        this.tower.takeDamage(zombie.damage);
        
        // Create hit particles - fewer, more subtle particles
        this.createHitParticles(zombie.x, zombie.y, 5, '#cc3333');
        
        // Play hit sound
        this.soundManager.playHit();
        
        // Remove zombie
        zombie.active = false;
      }
    });
    
    // Update bullets
    this.bullets.forEach(bullet => {
      // Pass canvas dimensions for bouncing logic and zombies for homing bullets
      bullet.update(dt, this.canvas.width, this.canvas.height, this.zombies);
      
      // Note: We don't need to check for out of bounds here anymore
      // as this is now handled in the Bullet.update method
      
      // Check bullet-zombie collisions
      for (const zombie of this.zombies) {
        if (bullet.isCollidingWith(zombie)) {
          // Calculate damage before applying to zombie
          let bulletDamage = bullet.damage;
          
          // For trickster bullets, add bonus damage based on bounces
          if (bullet.damagePerBounce > 0 && bullet.remainingBounces > 0) {
            // Calculate bonus damage as % of base damage
            const maxBounces = this.state.bulletBounces;
            const bouncesUsed = maxBounces - bullet.remainingBounces;
            const damageBonus = bouncesUsed * bullet.damagePerBounce;
            
            // Apply damage bonus
            bulletDamage *= (1 + damageBonus);
            
            debug('Bullets', 'Trickster damage bonus', {
              baseDamage: bullet.damage,
              bonusPercent: Math.round(damageBonus * 100),
              finalDamage: bulletDamage,
              bouncesUsed
            });
          }
          
          // Should the bullet bounce off the zombie, pass through, or be destroyed?
          // Consider both bullet properties and zombie properties (i.e., skeletons can't bounce bullets)
          const shouldBounce = bullet.remainingBounces > 0 && !bullet.ghostBullet && zombie.canBounce;
          const isGhost = bullet.ghostBullet && zombie.canPierce;
          
          // Apply upgrade effects before damaging zombie
          this.applyBulletUpgradeEffects(zombie, bullet, bulletDamage);
          
          // Damage zombie regardless of bounce/ghost status
          zombie.takeDamage(bulletDamage);
          
          // Create hit particles - with color based on bullet type
          let hitColor = '#ffcc00'; // Default yellow
          
          if (isGhost) {
            hitColor = '#00aaff'; // Blue for ghost bullets
          } else if (bullet.damageMultiplier > 1) {
            hitColor = '#aa00ff'; // Purple for bullet time
          } else if (bullet.speed > 1000) {
            hitColor = '#00ff88'; // Green for hitscan
          } else if (bullet.remainingBounces > 0) {
            hitColor = '#ffa500'; // Orange for bouncing bullets
          }
          
          this.createHitParticles(bullet.x, bullet.y, 3, hitColor);
          
          // Handle different bullet behaviors
          if (shouldBounce) {
            // Calculate bounce direction - reflect bullet direction
            const normalX = bullet.x - zombie.x;
            const normalY = bullet.y - zombie.y;
            
            // Normalize the normal vector
            const length = Math.sqrt(normalX * normalX + normalY * normalY);
            const nx = normalX / length;
            const ny = normalY / length;
            
            // Calculate dot product of velocity and normal
            const dot = bullet.dirX * nx + bullet.dirY * ny;
            
            // Calculate reflection direction
            bullet.dirX = bullet.dirX - 2 * dot * nx;
            bullet.dirY = bullet.dirY - 2 * dot * ny;
            
            // Decrement remaining bounces
            bullet.remainingBounces--;
            
            // Move bullet slightly away from zombie to prevent multiple collisions
            bullet.x += bullet.dirX * bullet.size;
            bullet.y += bullet.dirY * bullet.size;
            
            // Add more particles for bounce effect
            this.createHitParticles(bullet.x, bullet.y, 2, hitColor);
          } 
          else if (isGhost) {
            // Ghost bullets pass through - don't deactivate
            // The ghost bullet's damage is already reduced in the bullet's isCollidingWith method
            
            // Add ghostly particles
            this.createHitParticles(bullet.x, bullet.y, 2, '#80c8ff');
            
            // Log when we encounter special zombie types
            if (!zombie.canPierce) {
              debug('Bullets', 'Ghost bullet hitting non-pierceable zombie', {
                zombieType: zombie.type
              });
            }
          }
          else {
            // If no bounces left and not a ghost bullet, deactivate the bullet
            bullet.active = false;
          }
          
          // If zombie died
          if (!zombie.active) {
            try {
              // Store zombie position for effects before it's removed
              const zombieX = zombie.x;
              const zombieY = zombie.y;
              
              // Only count kills and increase score for enemy zombies
              // Score tracking is now handled by the zombie-killed event system
              // This avoids double-counting
              
              try {
                // Create death particles - fewer particles with a different color to avoid overwhelming the screen
                debug('Zombie', 'Creating death particles from bullet hit', { x: zombieX, y: zombieY, count: 8 });
                
                // IMPORTANT: Only create particles if coordinates are valid numbers
                if (isFinite(zombieX) && isFinite(zombieY)) {
                  this.createHitParticles(zombieX, zombieY, 8, '#55aa55');
                } else {
                  debug('Zombie', 'ERROR: Invalid zombie position, skipping particles', { x: zombieX, y: zombieY });
                }
              } catch (particleError) {
                debug('Zombie', 'ERROR creating particles', particleError);
              }
              
              // Play zombie death sound
              this.soundManager.playZombieDeath();
              
              // Note: Score updates, kill counting, and wave progression are now handled
              // by the zombie-killed event system to properly count kills from friendly zombies
            } catch (zombieDeathError) {
              // Catch all errors in zombie death handling to prevent game crashes
              debug('Zombie', 'CRITICAL ERROR in zombie death handler', zombieDeathError);
              console.error('Error handling zombie death:', zombieDeathError);
            }
          }
          
          // Only break the loop, we don't need to deactivate the bullet here
          // since we've already handled that in the shouldBounce condition
          break;
        }
      }
    });
    
    // Update particles
    this.particles.forEach(particle => {
      particle.update(dt);
    });
    
    // Clean up inactive entities
    this.bullets = this.bullets.filter(bullet => bullet.active);
    this.zombies = this.zombies.filter(zombie => zombie.active);
    this.particles = this.particles.filter(particle => particle.active);
    
    // Check for game over
    if (this.tower.health <= 0) {
      this.gameOver();
    }
    
    // Update UI
    this.updateUI();
  }
  
  private render(): void {
    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Render background (simple gradient)
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, '#1a2b3c');
      gradient.addColorStop(1, '#0a0a0a');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw a simple ground
      this.ctx.fillStyle = '#2c2c2c';
      this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
      
      // Safely render entities with error handling
      const safeRender = (entities: any[], renderMethod: string) => {
        for (let i = 0; i < entities.length; i++) {
          try {
            if (entities[i] && typeof entities[i][renderMethod] === 'function') {
              entities[i][renderMethod](this.ctx);
            }
          } catch (err) {
            console.error(`Error rendering ${renderMethod}:`, err);
            // Remove the problematic entity
            entities[i].active = false;
          }
        }
      };
      
      // Render particles (behind other entities)
      safeRender(this.particles, 'render');
      
      // Render bullets
      safeRender(this.bullets, 'render');
      
      // Render zombies
      safeRender(this.zombies, 'render');
      
      // Render tower (with try-catch since it's a critical element)
      try {
        this.tower.render(this.ctx);
      } catch (err) {
        console.error('Error rendering tower:', err);
      }
      
      // Add a small debug info in corner if needed
      if (false) { // Set to true to enable debug info
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Zombies: ${this.zombies.length}, Bullets: ${this.bullets.length}, Particles: ${this.particles.length}`, 10, 20);
      }
      
      // If hitboxes are enabled, draw them
      if (this.showHitboxes) {
        // Draw tower hitbox
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.tower.x, this.tower.y, this.tower.size, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw zombie hitboxes and effect areas
        this.zombies.forEach(zombie => {
          if (!zombie.active) return;
          
          // Regular hitbox
          this.ctx.strokeStyle = 'red';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(zombie.x, zombie.y, zombie.size, 0, Math.PI * 2);
          this.ctx.stroke();
          
          // Show explosive marker if active
          if (zombie.explosiveMarked) {
            const radius = 70 * zombie.explosiveLevel; // Scale with level (matches new explosion radius)
            this.ctx.strokeStyle = 'orange';
            this.ctx.globalAlpha = 0.5;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(zombie.x, zombie.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = 'orange';
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
          }
          
          // Show implosive marker if active
          if (zombie.implosiveMarked) {
            const radius = 120 * zombie.implosivePower; // Scale with power
            this.ctx.strokeStyle = 'purple';
            this.ctx.globalAlpha = 0.5;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(zombie.x, zombie.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = 'purple';
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
          }
          
          // Show aftermath marker if active
          if (zombie.aftermathMarked) {
            const radius = 150; // Matches the new aftermath explosion radius
            this.ctx.strokeStyle = 'red';
            this.ctx.globalAlpha = 0.5;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(zombie.x, zombie.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
          }
          
          // Show critical marker if active
          if (zombie.criticalMarked) {
            this.ctx.strokeStyle = 'yellow';
            this.ctx.setLineDash([5, 5]);
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(zombie.x, zombie.y, zombie.size * 1.5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
          }
        });
        
        // Draw bullet hitboxes
        this.bullets.forEach(bullet => {
          if (!bullet.active) return;
          
          // Regular hitbox
          this.ctx.strokeStyle = 'cyan';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
          this.ctx.stroke();
          
          // If bullet has homing capability, show detection arc
          if (bullet.homingEnabled) {
            // Calculate direction vector
            const dirLength = Math.sqrt(bullet.dirX * bullet.dirX + bullet.dirY * bullet.dirY);
            const normalizedDirX = bullet.dirX / dirLength;
            const normalizedDirY = bullet.dirY / dirLength;
            
            // Calculate perpendicular vector
            const perpX = -normalizedDirY;
            const perpY = normalizedDirX;
            
            // Draw homing detection area
            const homingRange = 600; // Detection range (tripled from 200)
            const angleRange = 20 * (Math.PI / 180); // 20 degrees in radians (doubled from 10)
            
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x, bullet.y);
            
            // Start angle (direction - angleRange)
            const startAngle = Math.atan2(normalizedDirY, normalizedDirX) - angleRange;
            const endAngle = Math.atan2(normalizedDirY, normalizedDirX) + angleRange;
            
            this.ctx.arc(bullet.x, bullet.y, homingRange, startAngle, endAngle);
            this.ctx.closePath();
            
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.stroke();
          }
        });
      }
    } catch (error) {
      console.error('Error in render:', error);
      // If the render method completely fails, we'll at least show a clear background
      // instead of leaving artifacts on screen
      this.ctx.fillStyle = '#1a2b3c';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  // Apply upgrade effects when a bullet hits a zombie
  private applyBulletUpgradeEffects(zombie: Zombie, bullet: Bullet, damage: number): void {
    // Explosive rounds
    if (this.state.explosiveEnabled) {
      // Allow stacking with other effects like critical strike
      zombie.explosiveMarked = true;
      zombie.explosiveTimer = 1.0; // 1 second delay
      zombie.explosiveDamage = damage;
      zombie.explosiveLevel = this.state.explosiveLevel;
      
      // Create visual indicator with more particles
      this.createHitParticles(zombie.x, zombie.y, 4, '#ff6600');
    }
    
    // Implosive rounds
    if (this.state.implosiveEnabled) {
      zombie.implosiveMarked = true;
      // Reduce implosive power to prevent too strong pulling
      zombie.implosivePower = this.state.implosiveLevel * 0.8; // 0.8x-2.4x range instead of 1.5x-4.5x
      
      // Trigger immediate implosion effect - pull nearby zombies toward this one
      const implosionRadius = 80 * zombie.implosivePower;
      const implosionPower = 30 * zombie.implosivePower; // Reduced from 50 to 30
      
      // Create implosion event
      const implosionEvent = new CustomEvent('zombie-implosion', {
        detail: {
          x: zombie.x,
          y: zombie.y,
          radius: implosionRadius,
          power: implosionPower
        }
      });
      window.dispatchEvent(implosionEvent);
      
      // Find and pull nearby zombies
      this.zombies.forEach(otherZombie => {
        if (otherZombie.id !== zombie.id && otherZombie.active) {
          const dx = zombie.x - otherZombie.x;
          const dy = zombie.y - otherZombie.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < implosionRadius) {
            // Calculate pull strength (stronger when closer)
            const pullFactor = 1 - (distance / implosionRadius);
            
            // Move the zombie toward the implosion center (reduced from 0.3 to 0.2)
            otherZombie.x += dx * pullFactor * 0.2; 
            otherZombie.y += dy * pullFactor * 0.2;
            
            // Create particle effect to show movement
            this.createHitParticles(otherZombie.x, otherZombie.y, 2, '#6600ff');
          }
        }
      });
    }
    
    // Split shot - shoot at a random nearby enemy
    if (this.state.splitEnabled && this.state.splitLevel > 0 && !bullet.disabled) {
      // Get a list of active zombies that aren't the one we just hit
      const eligibleZombies = this.zombies.filter(otherZombie => 
        otherZombie.id !== zombie.id && otherZombie.active
      );
      
      // If there are eligible zombies, choose one randomly
      if (eligibleZombies.length > 0) {
        // Pick a random zombie from the list
        const randomIndex = Math.floor(Math.random() * eligibleZombies.length);
        const targetZombie = eligibleZombies[randomIndex];
        
        // Direction to target zombie
        const dx = targetZombie.x - zombie.x;
        const dy = targetZombie.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Create a split bullet that travels directly to the target
        // It has reduced damage (2/3 of original)
        const splitBullet = new Bullet(
          zombie.x,
          zombie.y,
          dx / distance,
          dy / distance,
          bullet.size * 0.8,
          bullet.speed,
          0, // Number of bounces (none)
          false, // Not a ghost bullet
          0, // No damage per bounce
          1, // No damage multiplier
          true, // This is a disabled bullet (can't split/bounce/pierce)
          false // Not a homing bullet
        );
        
        // Set damage (2/3 of original)
        splitBullet.damage = bullet.damage * 0.67;
        
        // Add the bullet to the game
        this.bullets.push(splitBullet);
        
        // Visual effect
        this.createHitParticles(zombie.x, zombie.y, 2, '#ff00ff');
      }
    }
    
    // Aftermath - mark for explosion on death
    if (this.state.aftermathEnabled) {
      zombie.aftermathMarked = true;
      
      // Visual indicator with more particles
      this.createHitParticles(zombie.x, zombie.y, 5, '#ff0000');
    }
    
    // Critical strike - mark for delayed damage
    if (this.state.criticalEnabled) {
      // Allow stacking with explosive and other effects
      zombie.criticalMarked = true;
      zombie.criticalTimer = 3.0; // 3 second delay
      zombie.criticalLevel = this.state.criticalLevel;
      
      // Visual indicator
      this.createHitParticles(zombie.x, zombie.y, 3, '#ffff00');
    }
    
    // Necromantic - mark for friendly skeleton on death
    if (this.state.necromanticEnabled && !zombie.necromanticMarked) {
      zombie.necromanticMarked = true;
      
      // Visual indicator
      this.createHitParticles(zombie.x, zombie.y, 2, '#9900ff');
    }
    
    // Life steal - heal tower
    if (this.state.lifeStealEnabled && zombie.lifeStealHits < 2) {
      // Each hit heals 0.5% of tower max health per upgrade level
      const healAmount = this.tower.maxHealth * 0.005 * this.state.lifeStealLevel;
      
      // Heal the tower
      this.tower.health = Math.min(this.tower.maxHealth, this.tower.health + healAmount);
      
      // Count the hit
      zombie.lifeStealHits++;
      
      // Visual indicator
      this.createHitParticles(this.tower.x, this.tower.y, 2, '#00ff00');
    }
  }
  
  // Method to handle spawning new zombies
  private spawnZombie(typeOverride?: ZombieType, posX?: number, posY?: number, friendly?: boolean): Zombie | null {
    // Don't spawn if wave is completed - only pause for upgrade screen
    if (this.state.waveCompleted) {
      debug('Zombie', 'Prevented spawn during wave completion');
      return null;
    }
    
    // Unlimited zombies - no limit check
    // (Removed the check that prevented spawning more than zombiesInWave)
    
    // Calculate random position along the top or sides if not provided
    let x = posX;
    let y = posY;
    
    if (x === undefined || y === undefined) {
      const side = Math.floor(Math.random() * 3);  // 0: top, 1: left, 2: right
      
      switch (side) {
        case 0:  // Top
          x = Math.random() * this.canvas.width;
          y = -50;
          break;
        case 1:  // Left
          x = -50;
          y = Math.random() * (this.canvas.height - 200);
          break;
        case 2:  // Right
          x = this.canvas.width + 50;
          y = Math.random() * (this.canvas.height - 200);
          break;
        default:
          x = Math.random() * this.canvas.width;
          y = -50;
      }
    }
    
    // Determine which type of zombie to spawn
    let zombieType: ZombieType;
    
    if (typeOverride) {
      // Use provided type if specified (for summoned zombies)
      zombieType = typeOverride;
    } else {
      // Otherwise determine type based on wave and randomness
      const typeRoll = Math.random();
      const waveNumber = this.state.wave;
      
      if (waveNumber <= 2) {
        // First two waves: 100% Regular zombies
        zombieType = ZombieType.Regular;
      } else if (waveNumber <= 4) {
        // Waves 3-4: Introduce Fast zombies
        zombieType = typeRoll < 0.7 ? ZombieType.Regular : ZombieType.Fast;
      } else if (waveNumber <= 6) {
        // Waves 5-6: Introduce Tank zombies
        if (typeRoll < 0.6) {
          zombieType = ZombieType.Regular;
        } else if (typeRoll < 0.85) {
          zombieType = ZombieType.Fast;
        } else {
          zombieType = ZombieType.Tank;
        }
      } else if (waveNumber <= 8) {
        // Waves 7-8: Introduce Ranged zombies
        if (typeRoll < 0.5) {
          zombieType = ZombieType.Regular;
        } else if (typeRoll < 0.7) {
          zombieType = ZombieType.Fast;
        } else if (typeRoll < 0.85) {
          zombieType = ZombieType.Tank;
        } else {
          zombieType = ZombieType.Ranged;
        }
      } else if (waveNumber <= 10) {
        // Waves 9-10: Introduce Necromancers
        if (typeRoll < 0.4) {
          zombieType = ZombieType.Regular;
        } else if (typeRoll < 0.6) {
          zombieType = ZombieType.Fast;
        } else if (typeRoll < 0.75) {
          zombieType = ZombieType.Tank;
        } else if (typeRoll < 0.9) {
          zombieType = ZombieType.Ranged;
        } else {
          zombieType = ZombieType.Necromancer;
        }
      } else {
        // Wave 11+: All zombie types, including skeletons
        if (typeRoll < 0.3) {
          zombieType = ZombieType.Regular;
        } else if (typeRoll < 0.5) {
          zombieType = ZombieType.Fast;
        } else if (typeRoll < 0.65) {
          zombieType = ZombieType.Tank;
        } else if (typeRoll < 0.8) {
          zombieType = ZombieType.Ranged;
        } else if (typeRoll < 0.9) {
          zombieType = ZombieType.Necromancer;
        } else {
          zombieType = ZombieType.Skeleton;
        }
      }
    }
    
    // Set zombie stats based on type and wave
    const baseHealth = 30 + (this.state.wave - 1) * 10;
    const baseSpeed = 50 + (this.state.wave - 1) * 5;
    const baseDamage = 5 + (this.state.wave - 1);
    let size = 40;
    
    // Adjust stats based on zombie type
    let health = baseHealth;
    let speed = baseSpeed;
    let damage = baseDamage;
    
    // Type-specific adjustments
    switch (zombieType) {
      case ZombieType.Fast:
        // Fast zombies: Less health, faster speed
        health = Math.floor(baseHealth * 0.7);
        speed = Math.floor(baseSpeed * 1.5);
        damage = Math.floor(baseDamage * 0.8);
        break;
        
      case ZombieType.Tank:
        // Tank zombies: More health, slower speed, more damage
        health = Math.floor(baseHealth * 2);
        speed = Math.floor(baseSpeed * 0.6);
        damage = Math.floor(baseDamage * 1.5);
        size = 55; // Larger size
        break;
        
      case ZombieType.Ranged:
        // Ranged zombies: Less health, slower, but can attack from range
        health = Math.floor(baseHealth * 0.8);
        speed = Math.floor(baseSpeed * 0.7);
        damage = Math.floor(baseDamage * 0.7); // Base damage is lower but ranged attacks compensate
        break;
        
      case ZombieType.Necromancer:
        // Necromancers: Medium health, very slow, summon skeletons
        health = Math.floor(baseHealth * 1.2);
        speed = Math.floor(baseSpeed * 0.5);
        damage = Math.floor(baseDamage * 0.5); // Low direct damage
        break;
        
      case ZombieType.Skeleton:
        // Skeletons: Low health, medium speed, split on death
        health = Math.floor(baseHealth * 0.6);
        speed = baseSpeed;
        damage = Math.floor(baseDamage * 0.6);
        size = 35; // Smaller size
        break;
    }
    
    // Create a wrapper for the spawn callback that matches the ZombieSpawnCallback interface
    // This will be used for summoning new zombies and skeleton splitting
    const spawnCallback: ZombieSpawnCallback = (type: ZombieType, x: number, y: number, friendly: boolean = false) => {
      const newZombie = this.spawnZombie(type, x, y, friendly);
      
      // If this is a skeleton zombie that was created by splitting, mark it
      if (type === ZombieType.Skeleton) {
        // Mark skeleton as already split to prevent further splitting
        if (newZombie) {
          Zombie.splitSkeletons.add(newZombie.id);
        }
      }
    };
    
    // Create the zombie with the calculated stats and type
    const zombie = new Zombie(
      x as number, 
      y as number, 
      size, 
      health, 
      speed, 
      damage, 
      zombieType,
      // Pass the spawn callback for summoning/splitting abilities
      spawnCallback
    );
    
    // Set friendly flag if specified
    if (friendly) {
      zombie.friendly = true;
      debug('Zombie', `Created friendly ${zombieType} that will fight for the player!`);
    }
    
    this.zombies.push(zombie);
    
    // Track that we've spawned another zombie in this wave
    this.state.zombiesSpawned++;
    
    debug('Zombie', `Spawned ${zombieType} zombie ${this.state.zombiesSpawned}/∞ for wave ${this.state.wave}`);
    
    // Return the created zombie for additional processing
    return zombie;
  }
  
  private createHitParticles(x: number, y: number, count: number, color: string, isExplosion: boolean = false): void {
    try {
      debug('Particles', `Creating ${isExplosion ? 'explosion' : 'hit'} particles at (${x}, ${y})`, { count, color });
      
      // Immediately return if coordinates are invalid
      if (!isFinite(x) || !isFinite(y)) {
        debug('Particles', 'ERROR: Invalid coordinates for particles', { x, y });
        return;
      }
      
      // Dynamic limits based on particle type
      let maxParticlesPerHit = isExplosion ? 15 : 5; // More particles for explosions
      const particlesToCreate = Math.min(count, maxParticlesPerHit);
      
      // Hard cap on total particles
      const maxTotalParticles = 100; // Increased for better visual effects
      if (this.particles.length > maxTotalParticles) {
        debug('Particles', `Clearing old particles, total: ${this.particles.length}`);
        this.particles = [];
      }
      
      debug('Particles', `Creating ${isExplosion ? 'explosion' : ''} ${particlesToCreate} particles`);
      
      for (let i = 0; i < particlesToCreate; i++) {
        try {
          // Very simple randomization with strict bounds
          const angle = Math.random() * Math.PI * 2;
          
          // Explosion particles move faster and have more variance
          const speed = isExplosion 
            ? 50 + Math.random() * 80 // Faster for explosions (50-130)
            : 30 + Math.random() * 30; // Normal for hits (30-60)
          
          // Size and lifetime depend on whether it's an explosion or regular hit
          const size = isExplosion
            ? 2 + Math.random() * (4 + particlesToCreate/5)  // Larger size for explosions (2-6+)
            : 1 + Math.random() * 2;  // Regular size for hits (1-3)
            
          const lifetime = isExplosion
            ? 0.4 + Math.random() * 0.4  // Longer lifetime for explosions (0.4-0.8 seconds)
            : 0.2 + Math.random() * 0.2;  // Shorter for hits (0.2-0.4 seconds)
          
          const particle = new Particle(
            x,
            y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            size,
            color,
            lifetime
          );
          
          this.particles.push(particle);
        } catch (err) {
          debug('Particles', 'ERROR: Failed to create individual particle', err);
          // Continue with the loop if one particle fails
        }
      }
    } catch (err) {
      // Catch all possible errors
      debug('Particles', 'CRITICAL ERROR in particle creation', err);
      console.error('Failed to create particles:', err);
      
      // Clear all particles if something went wrong
      this.particles = [];
    }
  }
  
  private startNextWave(): void {
    debug('Wave', `Starting next wave - current wave: ${this.state.wave}, zombies killed: ${this.state.zombiesKilled}, threshold: ${this.state.nextWaveThreshold}`);
    
    // Add safeguard to prevent starting a new wave if the game is not running
    if (!this.state.running) {
      debug('Wave', 'ERROR: Attempted to start next wave while game is not running');
      console.warn('Attempted to start next wave while game is not running');
      return;
    }
    
    // Log the current state
    debug('Wave', 'Game state before wave change', { ...this.state });
    
    // Set waveCompleted to true to trigger upgrade screen
    this.state.waveCompleted = true;
    
    // Update wave data
    const oldWave = this.state.wave;
    this.state.wave++;
    this.state.zombiesKilled = 0;
    
    // Check for win condition - wave 20
    if (this.state.wave > 20) {
      this.gameWin();
      return;
    }
    
    // Calculate zombies for the next wave - increasing with wave number
    this.state.zombiesInWave = Math.floor(10 + (this.state.wave - 1) * 5);
    this.state.zombiesSpawned = 0;
    
    // Set threshold to match total zombies in wave
    this.state.nextWaveThreshold = this.state.zombiesInWave;
    
    // CRUCIAL: Save the game state AFTER incrementing the wave - this is the key fix
    this.saveGameState();
    
    debug('Wave', `Wave transitioned: ${oldWave} -> ${this.state.wave}, zombies in wave: ${this.state.zombiesInWave}`);
    
    // Clear all zombies and bullets when starting a new wave
    // to prevent any potential issues with references to old entities
    const zombieCount = this.zombies.length;
    this.zombies = [];
    this.bullets = [];
    debug('Wave', `Cleared ${zombieCount} zombies for new wave`);
    
    // Play wave sound
    this.soundManager.playWaveStart();
    
    // Show wave notification
    this.dispatchEvent('game:wave-update', { wave: this.state.wave });
    
    // Critical: Pause the game while showing upgrades - AFTER updating state
    this.pause();
    
    // Apply all upgrades to the game state
    this.upgradeSystem.applyAllUpgrades(this.state);
    
    // Check if upgrades are available and notify UI
    if (this.upgradeSystem.areUpgradesAvailable()) {
      debug('Wave', 'Showing upgrade screen');
      // Delay the upgrade screen slightly to ensure all state updates are complete
      setTimeout(() => {
        debug('Wave', 'Triggering upgrade screen after delay');
        this.options.onUpgradeAvailable();
      }, 100);
    } else {
      debug('Wave', 'No upgrades available, auto-skipping with score bonus');
      
      // Add score bonus for auto-skipping
      const currentScore = this.state.score;
      this.state.score += 10; // Fixed bonus for auto-skipping
      this.options.onScoreUpdate(this.state.score);
      
      debug('Wave', 'Auto-skipped upgrade screen, added bonus score', {
        oldScore: currentScore,
        newScore: this.state.score,
        bonus: 10
      });
      
      // If no upgrades available, go ahead and keep playing
      this.state.waveCompleted = false;
      this.state.running = true;
    }
    
    // Add additional debug logs
    debug('Wave', 'Game state after wave change', { 
      wave: this.state.wave,
      zombiesInWave: this.state.zombiesInWave,
      zombiesSpawned: this.state.zombiesSpawned,
      nextWaveThreshold: this.state.nextWaveThreshold,
      zombieCount: this.zombies.length,
      running: this.state.running,
      score: this.state.score,
      waveCompleted: this.state.waveCompleted,
      upgradesAvailable: this.upgradeSystem.areUpgradesAvailable()
    });
  }
  
  private gameWin(): void {
    debug('Game', 'Game win triggered', {
      score: this.state.score,
      wave: this.state.wave,
      zombiesKilled: this.state.zombiesKilled
    });
    
    this.state.running = false;
    
    // Cancel animation frame if it exists
    if (this.animationFrameId !== null) {
      debug('Game', 'Cancelling animation frame on game win');
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clear all entities
    this.zombies = [];
    this.bullets = [];
    this.particles = [];
    
    // Create celebratory particles
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.createHitParticles(x, y, 5, 
        ['#ffff00', '#00ff00', '#ff00ff', '#00ffff', '#ff0000'][Math.floor(Math.random() * 5)],
        true);
    }
    
    // Show win message
    const winMessage = document.createElement('div');
    winMessage.className = 'game-win-message';
    winMessage.innerHTML = `
      <h1>Victory!</h1>
      <p>You've survived 20 waves and won the game!</p>
      <p>Final Score: ${this.state.score}</p>
    `;
    winMessage.style.position = 'absolute';
    winMessage.style.top = '50%';
    winMessage.style.left = '50%';
    winMessage.style.transform = 'translate(-50%, -50%)';
    winMessage.style.backgroundColor = 'rgba(0,0,0,0.8)';
    winMessage.style.color = '#fff';
    winMessage.style.padding = '2rem';
    winMessage.style.borderRadius = '1rem';
    winMessage.style.textAlign = 'center';
    winMessage.style.zIndex = '100';
    winMessage.style.fontFamily = 'sans-serif';
    document.body.appendChild(winMessage);
    
    // Notify main app if callback exists
    if (this.options.onGameWin) {
      this.options.onGameWin();
    } else {
      // Use game over as fallback if onGameWin not provided
      this.options.onGameOver();
    }
    
    debug('Game', 'Game win sequence complete');
  }
  
  private gameOver(): void {
    debug('Game', 'Game over triggered', {
      score: this.state.score,
      wave: this.state.wave,
      zombiesKilled: this.state.zombiesKilled
    });
    
    this.state.running = false;
    
    // Cancel animation frame if it exists
    if (this.animationFrameId !== null) {
      debug('Game', 'Cancelling animation frame on game over');
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clear all entities
    this.zombies = [];
    this.bullets = [];
    this.particles = [];
    
    // Notify main app
    this.options.onGameOver();
    
    debug('Game', 'Game over sequence complete');
  }
  
  private updateUI(): void {
    // Update score
    this.dispatchEvent('game:score-update', { score: this.state.score });
    
    // Update health
    this.dispatchEvent('game:health-update', { health: this.tower.health });
    
    // Update wave
    this.dispatchEvent('game:wave-update', { wave: this.state.wave });
  }
  
  private dispatchEvent(name: string, detail: any): void {
    const event = new CustomEvent(name, { detail });
    window.dispatchEvent(event);
  }
}

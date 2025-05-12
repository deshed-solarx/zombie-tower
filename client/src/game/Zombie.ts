// Counter for generating unique zombie IDs
let nextZombieId = 1;

// Enum for zombie types
export enum ZombieType {
  Regular = 'regular',
  Fast = 'fast',
  Tank = 'tank',
  Ranged = 'ranged',
  Necromancer = 'necromancer',
  Skeleton = 'skeleton'
}

// Special zombie behavior constants
const RANGED_ATTACK_DISTANCE = 200; // How far the ranged zombie stops to attack
const NECROMANCER_SUMMON_DISTANCE = 250; // How far the necromancer stops to summon
const NECROMANCER_SUMMON_COOLDOWN = 5; // Seconds between summonings
const RANGED_ATTACK_COOLDOWN = 2; // Seconds between ranged attacks
const SKELETON_SPLIT_SIZE_FACTOR = 0.7; // How much smaller the split skeletons are
const SKELETON_SPLIT_HEALTH_FACTOR = 0.5; // How much health the split skeletons have

// Interface for zombie behavior callback
export interface ZombieSpawnCallback {
  (typeOverride: ZombieType, posX: number, posY: number, friendly?: boolean): void;
}

export class Zombie {
  public x: number;
  public y: number;
  public size: number;
  public health: number;
  public maxHealth: number;
  public speed: number;
  public damage: number;
  public active: boolean = true;
  public type: ZombieType;
  
  // Unique identifier for this zombie
  public readonly id: number;
  
  // Special behavior properties
  public autoAimPriority: number = 0; // Higher = targeted first by auto-aim
  public canBounce: boolean = true; // Whether bullets can bounce off this zombie
  public canPierce: boolean = true; // Whether ghost bullets can pierce this zombie
  public friendly: boolean = false; // Whether this zombie is friendly (helps the player)
  
  // Upgrade effect trackers
  public explosiveMarked: boolean = false;      // Whether zombie is marked for explosion
  public explosiveTimer: number = 0;            // Timer until explosion triggers
  public explosiveDamage: number = 0;           // Stored damage value for explosion
  public explosiveLevel: number = 0;            // Level of explosive upgrade
  
  public implosiveMarked: boolean = false;      // Whether zombie pulls others when hit
  public implosivePower: number = 0;            // Power of implosion (level dependent)
  
  public aftermathMarked: boolean = false;      // Whether zombie explodes on death
  
  public criticalMarked: boolean = false;       // Whether zombie takes critical damage
  public criticalTimer: number = 0;             // Timer until critical damage triggers
  public criticalLevel: number = 0;             // Level of critical strike
  
  public necromanticMarked: boolean = false;    // Whether zombie summons skeleton on death
  
  public lifeStealHits: number = 0;             // Counter for life steal hits
  
  // For special behavior tracking
  private attackCooldown: number = 0;
  private attackRange: number = 0;
  private specialActionTimer: number = 0;
  private spawnCallback: ZombieSpawnCallback | null = null;
  
  private readonly zombieImage: HTMLImageElement;
  private isLoaded: boolean = false;
  private frameIndex: number = 0;
  private frameTimer: number = 0;
  private readonly frameDuration: number = 0.2; // seconds per frame
  
  constructor(
    x: number, 
    y: number, 
    size: number, 
    health: number, 
    speed: number, 
    damage: number, 
    type: ZombieType = ZombieType.Regular,
    spawnCallback: ZombieSpawnCallback | null = null
  ) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.damage = damage;
    this.type = type;
    this.spawnCallback = spawnCallback;
    
    // Configure special properties based on type
    this.configureTypeSpecificProperties();
    
    // Assign unique ID to this zombie
    this.id = nextZombieId++;
    
    // Load zombie image
    this.zombieImage = new Image();
    this.zombieImage.src = this.createZombieSVG();
    this.zombieImage.onload = () => {
      this.isLoaded = true;
    };
  }
  
  private configureTypeSpecificProperties(): void {
    switch (this.type) {
      case ZombieType.Fast:
        // Fast zombies are already fast with low health, nothing special to add
        break;
        
      case ZombieType.Tank:
        // Tank zombies are already slow with high health, nothing special to add
        break;
        
      case ZombieType.Ranged:
        // Ranged zombies stop at a distance and shoot
        this.attackRange = RANGED_ATTACK_DISTANCE;
        this.attackCooldown = RANGED_ATTACK_COOLDOWN;
        this.autoAimPriority = 1; // Target these first
        break;
        
      case ZombieType.Necromancer:
        // Necromancers stop at a distance and summon
        this.attackRange = NECROMANCER_SUMMON_DISTANCE;
        this.attackCooldown = NECROMANCER_SUMMON_COOLDOWN;
        this.autoAimPriority = -1; // Target these last
        break;
        
      case ZombieType.Skeleton:
        // Skeletons split when killed, handled in takeDamage
        this.canBounce = false;
        this.canPierce = false;
        break;
        
      default: // Regular zombies
        break;
    }
  }
  
  public update(dt: number, targetX: number, targetY: number, enemyZombies?: Zombie[]): void {
    // If this is a friendly zombie, it should target other zombies instead of the tower
    let actualTargetX = targetX;
    let actualTargetY = targetY;
    
    if (enemyZombies && enemyZombies.length > 0) {
      if (this.friendly) {
        // Friendly zombies target enemy zombies
        let closestDistance = Infinity;
        let closestEnemy = null;
        
        for (const enemy of enemyZombies) {
          // Skip inactive zombies and other friendly zombies
          if (!enemy.active || enemy.friendly) continue;
          
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
          }
        }
        
        if (closestEnemy) {
          actualTargetX = closestEnemy.x;
          actualTargetY = closestEnemy.y;
          
          // If close enough to the enemy, attack it
          if (closestDistance < this.size) {
            // Damage the enemy zombie, marking it as coming from a friendly zombie
            closestEnemy.takeDamage(this.damage * dt, true);
          }
        }
      } else {
        // Enemy zombies always target the tower, ignoring friendly zombies
        // This is a change from previous behavior where they would target nearby friendly zombies
        
        // Code below is kept but commented out as reference
        /*
        // Enemy zombies can target friendly zombies if they're closer than the tower
        let closestFriendly = null;
        let closestFriendlyDistance = Infinity;
        
        // Calculate distance to tower
        const dxTower = targetX - this.x;
        const dyTower = targetY - this.y;
        const distanceToTower = Math.sqrt(dxTower * dxTower + dyTower * dyTower);
        
        // Look for nearby friendly zombies
        for (const friendly of enemyZombies) {
          // Only consider active friendly zombies
          if (!friendly.active || !friendly.friendly) continue;
          
          const dx = friendly.x - this.x;
          const dy = friendly.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only target friendly zombies that are closer than the tower
          if (distance < distanceToTower && distance < closestFriendlyDistance) {
            closestFriendlyDistance = distance;
            closestFriendly = friendly;
          }
        }
        
        if (closestFriendly) {
          actualTargetX = closestFriendly.x;
          actualTargetY = closestFriendly.y;
          
          // If close enough to the friendly zombie, attack it
          if (closestFriendlyDistance < this.size) {
            // Damage the friendly zombie
            closestFriendly.takeDamage(this.damage * dt);
          }
        }
        */
        
        // Always target the tower
        actualTargetX = targetX;
        actualTargetY = targetY;
      }
    }
    
    // Calculate distance to target
    const dx = actualTargetX - this.x;
    const dy = actualTargetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction
    const dirX = distance > 0 ? dx / distance : 0;
    const dirY = distance > 0 ? dy / distance : 0;
    
    // Update special action timer
    this.specialActionTimer += dt;
    
    // Handle upgrade effects
    this.updateUpgradeEffects(dt);
    
    // Type-specific behavior - only for non-friendly zombies
    if (!this.friendly) {
      if (this.type === ZombieType.Ranged && distance <= this.attackRange) {
        // Ranged zombies stop at attack range and shoot
        if (this.specialActionTimer >= this.attackCooldown) {
          this.specialActionTimer = 0;
          this.performRangedAttack(targetX, targetY);
        }
      } 
      else if (this.type === ZombieType.Necromancer && distance <= this.attackRange) {
        // Necromancers stop at summon range and summon skeletons
        if (this.specialActionTimer >= this.attackCooldown) {
          this.specialActionTimer = 0;
          this.summonSkeletons();
        }
      }
      else {
        // Move zombie if not in attack range or not a special type
        this.x += dirX * this.speed * dt;
        this.y += dirY * this.speed * dt;
      }
    } else {
      // Friendly zombies always move toward their target (other zombies)
      this.x += dirX * this.speed * dt;
      this.y += dirY * this.speed * dt;
    }
    
    // Update animation
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % 2; // 2 frames of animation
    }
  }
  
  private performRangedAttack(targetX: number, targetY: number): void {
    // This would normally create a projectile
    // Since we're keeping this simple, we'll just log it and
    // the Game class will handle damage to tower directly
    console.log(`[${this.type}] Performing ranged attack`);
    
    // The actual projectile creation will be handled by the Game class
    const attackEvent = new CustomEvent('zombie:ranged-attack', {
      detail: {
        zombieId: this.id,
        damage: this.damage,
        sourceX: this.x,
        sourceY: this.y,
        targetX,
        targetY
      }
    });
    window.dispatchEvent(attackEvent);
  }
  
  private summonSkeletons(): void {
    // Check if we have a callback to spawn new zombies
    if (!this.spawnCallback) {
      console.warn('Necromancer tried to summon skeletons but no spawn callback was provided');
      return;
    }
    
    console.log(`[${this.type}] Summoning skeletons`);
    
    // Spawn 2 skeletons near the necromancer
    const spawnRadius = this.size * 1.5;
    const angles = [0, Math.PI]; // One on each side
    
    for (let i = 0; i < angles.length; i++) {
      const angle = angles[i];
      const spawnX = this.x + Math.cos(angle) * spawnRadius;
      const spawnY = this.y + Math.sin(angle) * spawnRadius;
      
      // Use the callback to create the skeleton
      this.spawnCallback(ZombieType.Skeleton, spawnX, spawnY);
    }
    
    // Dispatch event for visual effects/sound
    const summonEvent = new CustomEvent('zombie:summon', {
      detail: {
        zombieId: this.id,
        sourceX: this.x,
        sourceY: this.y
      }
    });
    window.dispatchEvent(summonEvent);
  }
  
  public render(ctx: CanvasRenderingContext2D): void {
    // Draw friendly indicator first (behind the zombie)
    if (this.friendly) {
      ctx.save();
      
      // Draw a glowing circle behind friendly zombies
      const gradient = ctx.createRadialGradient(
        this.x, this.y, this.size * 0.4, 
        this.x, this.y, this.size * 0.7
      );
      gradient.addColorStop(0, 'rgba(100, 255, 150, 0.5)');
      gradient.addColorStop(1, 'rgba(100, 255, 150, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    // Draw zombie with image if loaded
    if (this.isLoaded) {
      // Determine direction (simple flip based on movement)
      const flipHorizontal = this.x > ctx.canvas.width / 2;
      
      ctx.save();
      
      // Apply flip if needed
      if (flipHorizontal) {
        ctx.translate(this.x * 2, 0);
        ctx.scale(-1, 1);
      }
      
      // Draw the zombie
      ctx.drawImage(
        this.zombieImage,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size
      );
      
      ctx.restore();
    } else {
      // Fallback if image not loaded - use color based on type
      ctx.fillStyle = this.getZombieColor();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw health bar
    const healthBarWidth = this.size;
    const healthBarHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(
      this.x - healthBarWidth / 2,
      this.y - this.size / 2 - 10,
      healthBarWidth,
      healthBarHeight
    );
    
    // Health
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      this.x - healthBarWidth / 2,
      this.y - this.size / 2 - 10,
      healthBarWidth * healthPercent,
      healthBarHeight
    );
    
    // Indicate special zombies with an icon above them
    if (this.type !== ZombieType.Regular && this.type !== ZombieType.Fast) {
      this.drawSpecialZombieIndicator(ctx);
    }
  }
  
  // Draw a simple icon based on zombie type
  private drawSpecialZombieIndicator(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Position above health bar
    const iconY = this.y - this.size / 2 - 18;
    
    switch (this.type) {
      case ZombieType.Tank:
        // Shield icon
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.arc(this.x, iconY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#DDDDDD';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, iconY, 4, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case ZombieType.Ranged:
        // Crosshair icon
        ctx.strokeStyle = '#FF3333';
        ctx.lineWidth = 1.5;
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(this.x, iconY, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Cross in the middle
        ctx.beginPath();
        ctx.moveTo(this.x - 3, iconY);
        ctx.lineTo(this.x + 3, iconY);
        ctx.moveTo(this.x, iconY - 3);
        ctx.lineTo(this.x, iconY + 3);
        ctx.stroke();
        break;
        
      case ZombieType.Necromancer:
        // Star icon
        ctx.fillStyle = '#AA55DD';
        this.drawStar(ctx, this.x, iconY, 5, 6, 3);
        break;
        
      case ZombieType.Skeleton:
        // Bone icon
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        
        // Draw simple bone shape
        ctx.beginPath();
        ctx.moveTo(this.x - 4, iconY - 3);
        ctx.lineTo(this.x + 4, iconY + 3);
        ctx.moveTo(this.x - 4, iconY + 3);
        ctx.lineTo(this.x + 4, iconY - 3);
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }
  
  // Helper to draw a star shape
  private drawStar(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    outerRadius: number, 
    points: number, 
    innerRadius: number
  ): void {
    ctx.beginPath();
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / points;
      ctx.lineTo(
        x + radius * Math.sin(angle),
        y + radius * Math.cos(angle)
      );
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  public takeDamage(amount: number, fromFriendly: boolean = false): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      
      // Dispatch a zombie-killed event to update the kill count regardless of what killed the zombie
      // Only for enemy zombies (don't count friendly zombie deaths)
      if (!this.friendly) {
        // Create a custom event for the kill, including whether it was by a friendly zombie
        const killedEvent = new CustomEvent('zombie-killed', {
          detail: {
            x: this.x,
            y: this.y,
            fromFriendly: fromFriendly,
            zombieType: this.type
          }
        });
        window.dispatchEvent(killedEvent);
      }
      
      // Special behavior for skeletons: split on death
      if (this.type === ZombieType.Skeleton && this.spawnCallback) {
        this.splitSkeleton();
      }
      
      // Handle aftermath explosion on death
      if (this.aftermathMarked && this.spawnCallback) {
        // Create custom event for the aftermath explosion
        const explosionEvent = new CustomEvent('zombie-explosion', {
          detail: {
            x: this.x,
            y: this.y,
            damage: amount * 6, // 600% of the killing damage (increased from 400%)
            radius: 150, // Increased radius from 100
            source: 'aftermath'
          }
        });
        window.dispatchEvent(explosionEvent);
      }
      
      // Handle necromantic effect (summon friendly skeleton on death)
      if (this.necromanticMarked && this.spawnCallback) {
        // Summon a friendly skeleton at this position
        const necromanticEvent = new CustomEvent('zombie-necromantic', {
          detail: {
            x: this.x,
            y: this.y,
            friendly: true
          }
        });
        window.dispatchEvent(necromanticEvent);
        
        // Use spawn callback to create the skeleton
        // The friendly flag will be set in the Game.spawnZombie method
        this.spawnCallback(ZombieType.Skeleton, this.x, this.y, true);
      }
    }
  }
  
  // Handle timers and effects from upgrades
  private updateUpgradeEffects(dt: number): void {
    // Handle explosive rounds timer
    if (this.explosiveMarked && this.explosiveTimer > 0) {
      this.explosiveTimer -= dt;
      
      // If timer expired, trigger explosion
      if (this.explosiveTimer <= 0) {
        // Create custom event for the explosion
        const explosionEvent = new CustomEvent('zombie-explosion', {
          detail: {
            x: this.x,
            y: this.y,
            damage: this.explosiveDamage * 0.8, // 80% of the original damage (increased from 50%)
            radius: 70 * this.explosiveLevel, // Increased radius (from 50 to 70 per level)
            source: 'explosive'
          }
        });
        window.dispatchEvent(explosionEvent);
        
        // Reset explosive marker
        this.explosiveMarked = false;
      }
    }
    
    // Handle critical strike timer
    if (this.criticalMarked && this.criticalTimer > 0) {
      this.criticalTimer -= dt;
      
      // If timer expired, apply critical damage
      if (this.criticalTimer <= 0) {
        // Apply critical damage (200% of base)
        const criticalDamage = 20 * this.criticalLevel; // 10-20 damage
        this.takeDamage(criticalDamage);
        
        // Create custom event for visual effect
        const criticalEvent = new CustomEvent('zombie-critical', {
          detail: {
            x: this.x,
            y: this.y,
            damage: criticalDamage
          }
        });
        window.dispatchEvent(criticalEvent);
        
        // Reset critical marker
        this.criticalMarked = false;
      }
    }
  }
  
  // Add a static set to track which skeletons are already split (by size)
  public static splitSkeletons: Set<number> = new Set();
  
  private splitSkeleton(): void {
    // Only split if not too small already and we have a callback
    if (this.size < 15 || !this.spawnCallback) return;
    
    // Skip if this is already a split skeleton (smaller than standard size)
    if (Zombie.splitSkeletons.has(this.id)) {
      console.log(`Skeleton ${this.id} already split, not splitting again`);
      return;
    }
    
    // Create two smaller skeletons
    const newSize = this.size * SKELETON_SPLIT_SIZE_FACTOR;
    const newHealth = this.maxHealth * SKELETON_SPLIT_HEALTH_FACTOR;
    const spreadDistance = this.size / 2;
    
    // Spawn two smaller skeletons on either side
    const angles = [Math.PI / 4, -Math.PI / 4]; // Spread them diagonally
    
    for (let i = 0; i < 2; i++) {
      const angle = angles[i];
      const spawnX = this.x + Math.cos(angle) * spreadDistance;
      const spawnY = this.y + Math.sin(angle) * spreadDistance;
      
      // Use callback to spawn new skeletons - these will be marked as already split
      this.spawnCallback(ZombieType.Skeleton, spawnX, spawnY);
    }
  }
  
  public isCollidingWith(entity: { x: number, y: number, size: number }): boolean {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (this.size / 2 + entity.size / 2) * 0.8; // 0.8 for more forgiving collision
  }
  
  // Get color based on zombie type
  private getZombieColor(): string {
    // If this is a friendly zombie, use a different color scheme
    if (this.friendly) {
      switch (this.type) {
        case ZombieType.Regular:
          return '#33FFaa'; // Bright teal
        case ZombieType.Fast:
          return '#00ccFF'; // Bright cyan
        case ZombieType.Tank:
          return '#33cc33'; // Brighter green
        case ZombieType.Ranged:
          return '#FF9933'; // Orange
        case ZombieType.Necromancer:
          return '#cc66FF'; // Brighter purple
        case ZombieType.Skeleton:
          return '#99FFFF'; // Light cyan
        default:
          return '#33FFaa'; // Bright teal
      }
    } else {
      // Regular enemy colors
      switch (this.type) {
        case ZombieType.Regular:
          return '#5A8A5A'; // Green
        case ZombieType.Fast:
          return '#5555FF'; // Blue
        case ZombieType.Tank:
          return '#006600'; // Darker green
        case ZombieType.Ranged:
          return '#FF3333'; // Red
        case ZombieType.Necromancer:
          return '#8822AA'; // Purple
        case ZombieType.Skeleton:
          return '#DDDDDD'; // White/Light gray
        default:
          return '#5A8A5A'; // Default green
      }
    }
  }
  
  // SVG string representation of a zombie based on type
  private createZombieSVG(): string {
    // Choose color based on zombie type
    const mainColor = this.getZombieColor();
    const secondaryColor = this.getSecondaryColor();
    
    // Adjust size for tank zombies
    const sizeMultiplier = this.type === ZombieType.Tank ? 1.2 : 1;
    const headRadius = 20 * sizeMultiplier;
    const bodyRx = 20 * sizeMultiplier;
    const bodyRy = 30 * sizeMultiplier;
    
    // Base SVG with type-specific modifications
    let svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <!-- Zombie body -->
        <ellipse cx="50" cy="65" rx="${bodyRx}" ry="${bodyRy}" fill="${mainColor}" />
        
        <!-- Head -->
        <circle cx="50" cy="30" r="${headRadius}" fill="${secondaryColor}" />
    `;
    
    // Type-specific details
    switch (this.type) {
      case ZombieType.Regular:
        // Regular zombie has standard eyes and mouth
        svgString += `
          <!-- Eyes -->
          <circle cx="42" cy="25" r="5" fill="#E6E6E6" />
          <circle cx="58" cy="25" r="5" fill="#E6E6E6" />
          <circle cx="42" cy="25" r="2" fill="#990000" />
          <circle cx="58" cy="25" r="2" fill="#990000" />
          
          <!-- Mouth -->
          <path d="M40,40 Q50,50 60,40" stroke="#660000" stroke-width="2" fill="none" />
        `;
        break;
        
      case ZombieType.Fast:
        // Fast zombie has sharper, more angular features
        svgString += `
          <!-- Eyes -->
          <ellipse cx="42" cy="25" rx="4" ry="5" fill="#E6E6E6" />
          <ellipse cx="58" cy="25" rx="4" ry="5" fill="#E6E6E6" />
          <ellipse cx="42" cy="25" rx="1.5" ry="2.5" fill="#000099" />
          <ellipse cx="58" cy="25" rx="1.5" ry="2.5" fill="#000099" />
          
          <!-- Mouth -->
          <path d="M40,40 Q50,45 60,40" stroke="#000066" stroke-width="1" fill="none" />
          
          <!-- Speed Lines -->
          <path d="M20,20 L35,25" stroke="#AAAAFF" stroke-width="1" />
          <path d="M20,30 L35,30" stroke="#AAAAFF" stroke-width="1" />
          <path d="M20,40 L35,35" stroke="#AAAAFF" stroke-width="1" />
        `;
        break;
        
      case ZombieType.Tank:
        // Tank zombie has thicker limbs and armor-like features
        svgString += `
          <!-- Eyes -->
          <circle cx="42" cy="25" r="4" fill="#E6E6E6" />
          <circle cx="58" cy="25" r="4" fill="#E6E6E6" />
          <circle cx="42" cy="25" r="2" fill="#003300" />
          <circle cx="58" cy="25" r="2" fill="#003300" />
          
          <!-- Mouth -->
          <path d="M40,40 Q50,50 60,40" stroke="#003300" stroke-width="3" fill="none" />
          
          <!-- Armor plate -->
          <rect x="40" y="50" width="20" height="25" rx="2" fill="#004400" />
        `;
        break;
        
      case ZombieType.Ranged:
        // Ranged zombie has targeting eyes and a projectile
        svgString += `
          <!-- Eyes -->
          <circle cx="42" cy="25" r="5" fill="#FFDDDD" />
          <circle cx="58" cy="25" r="5" fill="#FFDDDD" />
          <circle cx="42" cy="25" r="2" fill="#FF0000" />
          <circle cx="58" cy="25" r="2" fill="#FF0000" />
          
          <!-- Targeting reticle -->
          <circle cx="50" cy="15" r="8" stroke="#FF0000" stroke-width="1" fill="none" />
          <line x1="50" y1="11" x2="50" y2="19" stroke="#FF0000" stroke-width="1" />
          <line x1="46" y1="15" x2="54" y2="15" stroke="#FF0000" stroke-width="1" />
          
          <!-- Mouth -->
          <path d="M40,40 Q50,45 60,40" stroke="#660000" stroke-width="2" fill="none" />
          
          <!-- Projectile in hand -->
          <circle cx="25" cy="55" r="4" fill="#FF6666" />
        `;
        break;
        
      case ZombieType.Necromancer:
        // Necromancer zombie has magical symbols and staff
        svgString += `
          <!-- Eyes -->
          <circle cx="42" cy="25" r="5" fill="#DDBBEE" />
          <circle cx="58" cy="25" r="5" fill="#DDBBEE" />
          <circle cx="42" cy="25" r="2" fill="#6600CC" />
          <circle cx="58" cy="25" r="2" fill="#6600CC" />
          
          <!-- Mouth -->
          <path d="M40,40 Q50,45 60,40" stroke="#6600CC" stroke-width="2" fill="none" />
          
          <!-- Magical aura -->
          <circle cx="50" cy="30" r="25" stroke="#AA55DD" stroke-width="1" fill="none" opacity="0.5" />
          
          <!-- Staff -->
          <line x1="25" y1="45" x2="25" y2="80" stroke="#553377" stroke-width="3" />
          <circle cx="25" cy="45" r="5" fill="#AA88CC" />
        `;
        break;
        
      case ZombieType.Skeleton:
        // Skeleton zombie has bone-like features
        svgString += `
          <!-- Eyes -->
          <circle cx="42" cy="25" r="4" fill="#111111" />
          <circle cx="58" cy="25" r="4" fill="#111111" />
          
          <!-- Mouth -->
          <path d="M40,38 L45,42 L50,38 L55,42 L60,38" stroke="#333333" stroke-width="1" fill="none" />
          
          <!-- Rib cage pattern -->
          <line x1="45" y1="50" x2="55" y2="50" stroke="#AAAAAA" stroke-width="1" />
          <line x1="45" y1="55" x2="55" y2="55" stroke="#AAAAAA" stroke-width="1" />
          <line x1="45" y1="60" x2="55" y2="60" stroke="#AAAAAA" stroke-width="1" />
          <line x1="45" y1="65" x2="55" y2="65" stroke="#AAAAAA" stroke-width="1" />
          <line x1="45" y1="70" x2="55" y2="70" stroke="#AAAAAA" stroke-width="1" />
        `;
        break;
    }
    
    // Add limbs based on type
    if (this.type === ZombieType.Tank) {
      // Tank has thicker limbs
      svgString += `
        <!-- Arms -->
        <rect x="25" y="50" width="12" height="25" rx="6" fill="${secondaryColor}" transform="rotate(20, 30, 50)" />
        <rect x="65" y="50" width="12" height="25" rx="6" fill="${secondaryColor}" transform="rotate(-20, 70, 50)" />
        
        <!-- Legs -->
        <rect x="40" y="90" width="10" height="20" rx="5" fill="${mainColor}" transform="rotate(15, 40, 90)" />
        <rect x="55" y="90" width="10" height="20" rx="5" fill="${mainColor}" transform="rotate(-15, 60, 90)" />
      `;
    } else if (this.type === ZombieType.Fast) {
      // Fast has thinner limbs
      svgString += `
        <!-- Arms -->
        <rect x="27" y="50" width="7" height="25" rx="3" fill="${secondaryColor}" transform="rotate(30, 30, 50)" />
        <rect x="67" y="50" width="7" height="25" rx="3" fill="${secondaryColor}" transform="rotate(-30, 70, 50)" />
        
        <!-- Legs -->
        <rect x="40" y="90" width="6" height="22" rx="3" fill="${mainColor}" transform="rotate(25, 40, 90)" />
        <rect x="55" y="90" width="6" height="22" rx="3" fill="${mainColor}" transform="rotate(-25, 60, 90)" />
      `;
    } else if (this.type === ZombieType.Skeleton) {
      // Skeleton has bone-like limbs
      svgString += `
        <!-- Arms -->
        <line x1="30" y1="50" x2="25" y2="70" stroke="${secondaryColor}" stroke-width="3" />
        <circle cx="25" cy="70" r="3" fill="${secondaryColor}" />
        <line x1="70" y1="50" x2="75" y2="70" stroke="${secondaryColor}" stroke-width="3" />
        <circle cx="75" cy="70" r="3" fill="${secondaryColor}" />
        
        <!-- Legs -->
        <line x1="40" y1="90" x2="35" y2="110" stroke="${mainColor}" stroke-width="3" />
        <circle cx="35" cy="110" r="3" fill="${mainColor}" />
        <line x1="60" y1="90" x2="65" y2="110" stroke="${mainColor}" stroke-width="3" />
        <circle cx="65" cy="110" r="3" fill="${mainColor}" />
      `;
    } else {
      // Default limbs for other types
      svgString += `
        <!-- Arms -->
        <rect x="25" y="50" width="10" height="25" rx="5" fill="${secondaryColor}" transform="rotate(20, 30, 50)" />
        <rect x="65" y="50" width="10" height="25" rx="5" fill="${secondaryColor}" transform="rotate(-20, 70, 50)" />
        
        <!-- Legs -->
        <rect x="40" y="90" width="8" height="20" rx="4" fill="${mainColor}" transform="rotate(15, 40, 90)" />
        <rect x="55" y="90" width="8" height="20" rx="4" fill="${mainColor}" transform="rotate(-15, 60, 90)" />
      `;
    }
    
    // Close the SVG
    svgString += `
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  }
  
  // Get secondary color for zombie parts
  private getSecondaryColor(): string {
    // If this is a friendly zombie, use a different color scheme
    if (this.friendly) {
      switch (this.type) {
        case ZombieType.Regular:
          return '#22CC88'; // Darker teal
        case ZombieType.Fast:
          return '#00AADD'; // Darker cyan
        case ZombieType.Tank:
          return '#22AA22'; // Darker bright green
        case ZombieType.Ranged:
          return '#EE8822'; // Darker orange
        case ZombieType.Necromancer:
          return '#BB44EE'; // Darker bright purple
        case ZombieType.Skeleton:
          return '#77DDDD'; // Darker light cyan
        default:
          return '#22CC88'; // Darker teal
      }
    } else {
      // Regular enemy colors
      switch (this.type) {
        case ZombieType.Regular:
          return '#5A8A5A'; // Same green
        case ZombieType.Fast:
          return '#4444EE'; // Slightly darker blue
        case ZombieType.Tank:
          return '#004D00'; // Darker green
        case ZombieType.Ranged:
          return '#DD2222'; // Slightly darker red
        case ZombieType.Necromancer:
          return '#661199'; // Darker purple
        case ZombieType.Skeleton:
          return '#BBBBBB'; // Slightly darker gray
        default:
          return '#5A8A5A'; // Default green
      }
    }
  }
}
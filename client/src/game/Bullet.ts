export class Bullet {
  public x: number;
  public y: number;
  public dirX: number;
  public dirY: number;
  public size: number;
  public speed: number;
  public baseSpeed: number = 0; // Store original speed for hitscan scaling
  public damage: number = 10;
  public active: boolean = true;
  public disabled: boolean = false; // Flag for bullets from split that can't create more splits
  
  // Upgrade-related properties
  public remainingBounces: number = 0;
  public ghostBullet: boolean = false;  // Whether this is a ghost bullet (passes through enemies)
  public hitCounter: number = 0;        // Count of enemies hit by ghost bullet
  public damagePerBounce: number = 0;   // Additional damage per bounce (trickster upgrade)
  public damageMultiplier: number = 1;  // Damage multiplier for bullet time
  public homingEnabled: boolean = false; // Whether bullet homes toward enemies
  public hitEntities: Set<number> = new Set(); // Set of entity IDs hit by this bullet
  
  // For tracking collisions to prevent hitting the same entity twice
  private lastHitEntityId: number | null = null;
  
  constructor(
    x: number, 
    y: number, 
    dirX: number, 
    dirY: number, 
    size: number, 
    speed: number,
    bounces: number = 0,
    ghostBullet: boolean = false,
    damagePerBounce: number = 0,
    damageMultiplier: number = 1,
    disabled: boolean = false,
    homingEnabled: boolean = false
  ) {
    this.x = x;
    this.y = y;
    this.dirX = dirX;
    this.dirY = dirY;
    this.size = size;
    this.speed = speed;
    this.baseSpeed = speed; // Store original speed for hitscan scaling
    this.remainingBounces = bounces;
    this.ghostBullet = ghostBullet;
    this.damagePerBounce = damagePerBounce;
    this.damageMultiplier = damageMultiplier;
    this.disabled = disabled;
    this.homingEnabled = homingEnabled;
    
    // Ghost bullets can still bounce off walls, but pass through zombies
    // (Removed code that was preventing ghost bullets from bouncing)
    
    // Apply damage multiplier effect
    if (this.damageMultiplier !== 1) {
      this.damage *= this.damageMultiplier;
    }
  }
  
  public update(dt: number, canvasWidth: number, canvasHeight: number, zombies?: Array<{x: number, y: number, active: boolean, id?: number}>): void {
    // Apply homing behavior if enabled and zombies are provided
    if (this.homingEnabled && zombies && zombies.length > 0) {
      this.applyHomingBehavior(zombies);
    }
    
    // Move bullet in direction
    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt;
    
    // Handle bouncing if the bullet has remaining bounces
    if (this.remainingBounces > 0) {
      // Check if the bullet hits a boundary
      let bounced = false;
      
      // Check left and right boundaries
      if (this.x < 0 || this.x > canvasWidth) {
        this.dirX *= -1; // Reverse horizontal direction
        bounced = true;
        // Adjust position to prevent getting stuck in the boundary
        this.x = this.x < 0 ? 0 : canvasWidth;
      }
      
      // Check top and bottom boundaries
      if (this.y < 0 || this.y > canvasHeight) {
        this.dirY *= -1; // Reverse vertical direction
        bounced = true;
        // Adjust position to prevent getting stuck in the boundary
        this.y = this.y < 0 ? 0 : canvasHeight;
      }
      
      if (bounced) {
        this.remainingBounces--;
        // Reset lastHitEntityId after bouncing to allow hitting the same entity again
        this.lastHitEntityId = null;
        // Clear hit entities set after bouncing (for ghost bullets)
        this.hitEntities.clear();
        
        // If this is a hitscan bullet, increase speed and damage with each bounce
        if (this.speed > this.baseSpeed) {
          // Increase speed by 20% per bounce
          this.speed *= 1.2;
          
          // Increase damage by 15% per bounce
          this.damage *= 1.15;
        }
      }
    } else {
      // If no remaining bounces, check if out of bounds to deactivate
      if (
        this.x < -50 || 
        this.x > canvasWidth + 50 || 
        this.y < -50 || 
        this.y > canvasHeight + 50
      ) {
        this.active = false;
      }
    }
  }
  
  // New method to handle homing behavior
  private applyHomingBehavior(zombies: Array<{x: number, y: number, active: boolean, id?: number, friendly?: boolean}>): void {
    // Find closest zombie in front of the bullet within a narrow angle
    const homingRange = 600; // Detection range (tripled from 200)
    const angleRange = 20 * (Math.PI / 180); // 20 degrees in radians (doubled from 10)
    
    // Normalize the current direction
    const dirLength = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
    const normalizedDirX = this.dirX / dirLength;
    const normalizedDirY = this.dirY / dirLength;
    
    // Current bullet direction angle
    const currentAngle = Math.atan2(normalizedDirY, normalizedDirX);
    
    let closestZombie = null;
    let closestDistance = homingRange;
    
    for (const zombie of zombies) {
      if (!zombie.active) continue;
      
      // Skip friendly zombies for homing targeting
      if (zombie.friendly) continue;
      
      // Calculate vector to zombie
      const toZombieX = zombie.x - this.x;
      const toZombieY = zombie.y - this.y;
      
      // Calculate distance to zombie
      const distanceToZombie = Math.sqrt(toZombieX * toZombieX + toZombieY * toZombieY);
      
      // Skip if out of range
      if (distanceToZombie > homingRange) continue;
      
      // Calculate angle to zombie
      const zombieAngle = Math.atan2(toZombieY, toZombieX);
      
      // Calculate angle difference (normalized to -PI to PI)
      let angleDiff = zombieAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // Check if zombie is within the detection angle
      if (Math.abs(angleDiff) <= angleRange && distanceToZombie < closestDistance) {
        closestZombie = zombie;
        closestDistance = distanceToZombie;
      }
    }
    
    // If a target is found, adjust direction slightly towards it
    if (closestZombie) {
      // Calculate normalized vector to zombie
      const toZombieX = closestZombie.x - this.x;
      const toZombieY = closestZombie.y - this.y;
      const zombieDistance = Math.sqrt(toZombieX * toZombieX + toZombieY * toZombieY);
      
      const normalizedToZombieX = toZombieX / zombieDistance;
      const normalizedToZombieY = toZombieY / zombieDistance;
      
      // Interpolate between current direction and direction to zombie (20% homing strength)
      const homingStrength = 0.2;
      
      this.dirX = (1 - homingStrength) * normalizedDirX + homingStrength * normalizedToZombieX;
      this.dirY = (1 - homingStrength) * normalizedDirY + homingStrength * normalizedToZombieY;
      
      // Renormalize direction vector
      const newDirLength = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
      this.dirX /= newDirLength;
      this.dirY /= newDirLength;
    }
  }
  
  public render(ctx: CanvasRenderingContext2D): void {
    try {
      // Determine base color based on bullet type
      let bulletColor = '#ffcc00'; // Default yellow
      
      if (this.ghostBullet) {
        // Ghost bullets are blue with transparency
        bulletColor = '#00aaff';
      } else if (this.damageMultiplier > 1) {
        // Bullet time bullets are purple
        bulletColor = '#aa00ff';
      } else if (this.speed > 1000) {
        // Hitscan bullets are bright green
        bulletColor = '#00ff88';
      } else if (this.homingEnabled) {
        // Homing bullets are red-orange
        bulletColor = '#ff5500';
      } else if (this.remainingBounces > 0) {
        // Bouncing bullets are orange with intensity based on bounce count
        bulletColor = `rgb(255, ${150 + this.remainingBounces * 20}, 0)`;
      }
      
      // Draw bullet core
      ctx.fillStyle = bulletColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw a glow effect
      const gradient = ctx.createRadialGradient(
        this.x, this.y, this.size / 4,
        this.x, this.y, this.size * 0.8
      );
      
      const alpha = this.ghostBullet ? 0.3 : 0.5; // More transparent for ghost bullets
      
      // Extract RGB components for gradient effects
      const rgbMatch = bulletColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      let r = 255, g = 255, b = 0; // Default values
      
      if (rgbMatch) {
        r = parseInt(rgbMatch[1], 16);
        g = parseInt(rgbMatch[2], 16);
        b = parseInt(rgbMatch[3], 16);
      }
      
      const color1 = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      const color2 = `rgba(${r}, ${g}, ${b}, 0)`;
      
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw a bullet trail - adjust length based on speed
      const trailLength = this.speed > 1000 ? 3.0 : (this.speed < 400 ? 0.8 : 1.5);
      
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      ctx.lineWidth = this.size / 3;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x - this.dirX * this.size * trailLength,
        this.y - this.dirY * this.size * trailLength
      );
      ctx.stroke();
      
      // Special visual effects for different bullet types
      if (this.ghostBullet) {
        // Add ghost effect - pulsing outer ring
        ctx.strokeStyle = `rgba(0, 170, 255, ${0.3 + 0.2 * Math.sin(Date.now() / 200)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      } 
      else if (this.homingEnabled) {
        // Homing effect - dashed circular guide
        ctx.strokeStyle = 'rgba(255, 85, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]); // Create dashed line
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line
      }
      else if (this.damageMultiplier > 1) {
        // Bullet time effect - motion blur streaks
        ctx.strokeStyle = 'rgba(170, 0, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(
            this.x - this.dirX * i * 3, 
            this.y - this.dirY * i * 3, 
            this.size * (0.6 - i * 0.1), 
            0, Math.PI * 2
          );
          ctx.stroke();
        }
      }
      else if (this.speed > 1000) {
        // Hitscan effect - laser-like appearance
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x - this.dirX * this.size * 5,
          this.y - this.dirY * this.size * 5
        );
        ctx.stroke();
      }
      
      // Add an indicator for bounce count if there are bounces remaining
      if (this.remainingBounces > 0) {
        ctx.fillStyle = 'white';
        ctx.font = `${this.size / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.remainingBounces}`, this.x, this.y);
      }
      
      // Add damage indicator for trickster bullets with bonus damage
      if (this.damagePerBounce > 0 && !this.ghostBullet) {
        const damageBonus = Math.floor(this.damagePerBounce * 100);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `${this.size / 3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${damageBonus}%`, this.x, this.y + this.size * 0.6);
      }
    } catch (err) {
      console.error('Error rendering bullet:', err);
    }
  }
  
  public isCollidingWith(entity: { x: number, y: number, size: number, id?: number, friendly?: boolean }): boolean {
    // Bullets should always pass through friendly zombies
    if (entity.friendly) return false;
    // Exit early if no ID is provided
    if (!entity.id) {
      return this.checkSimpleCollision(entity);
    }
    
    // For non-ghost bullets: prevent hitting the same entity again
    if (!this.ghostBullet && entity.id === this.lastHitEntityId) {
      return false;
    }
    
    // For ghost bullets: prevent hitting the same entity multiple times
    if (this.ghostBullet && this.hitEntities.has(entity.id)) {
      return false;
    }
    
    // Check actual collision
    const isColliding = this.checkSimpleCollision(entity);
    
    if (isColliding) {
      // For ghost bullets, add to hit set but allow bullet to continue
      if (this.ghostBullet) {
        this.hitEntities.add(entity.id);
        this.hitCounter++;
        this.lastHitEntityId = entity.id;
        
        // Reduce damage by 10% for each entity hit (0.9^hit_count)
        this.damage *= Math.pow(0.9, this.hitCounter);
      } 
      // For regular bullets, just mark as hit
      else {
        this.lastHitEntityId = entity.id;
      }
    }
    
    return isColliding;
  }
  
  private checkSimpleCollision(entity: { x: number, y: number, size: number }): boolean {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.size / 2 + entity.size / 2);
  }
}

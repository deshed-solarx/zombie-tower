export class Tower {
  public x: number;
  public y: number;
  public size: number;
  public health: number;
  public maxHealth: number;
  
  constructor(x: number, y: number, size: number, health: number) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.health = health;
    this.maxHealth = health;
    
    // No image loading - we'll draw directly to avoid loading issues
    console.log("Tower created at", x, y, "with size", size);
  }
  
  public update(dt: number): void {
    // Tower doesn't move or have complex behavior right now
  }
  
  public render(ctx: CanvasRenderingContext2D): void {
    // Draw tower base (circle)
    ctx.fillStyle = '#555555';
    ctx.beginPath();
    ctx.arc(this.x, this.y + this.size * 0.4, this.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw tower body (always use the direct drawing approach instead of SVG)
    // Base
    ctx.fillStyle = '#777777';
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size / 3, 
      this.size,
      this.size / 1.5
    );
    
    // Mid section
    ctx.fillStyle = '#888888';
    ctx.fillRect(
      this.x - this.size * 0.4,
      this.y - this.size * 0.8, 
      this.size * 0.8,
      this.size / 2
    );
    
    // Top section
    ctx.fillStyle = '#999999';
    ctx.fillRect(
      this.x - this.size * 0.3,
      this.y - this.size * 1.1, 
      this.size * 0.6,
      this.size / 3
    );
    
    // Cannon
    ctx.fillStyle = '#444444';
    ctx.fillRect(
      this.x - this.size / 6,
      this.y - this.size * 1.5,
      this.size / 3,
      this.size * 0.8
    );
    
    // Windows - base level
    ctx.fillStyle = '#333333';
    ctx.fillRect(
      this.x - this.size * 0.3,
      this.y - this.size / 6, 
      this.size * 0.2,
      this.size / 5
    );
    ctx.fillRect(
      this.x + this.size * 0.1,
      this.y - this.size / 6, 
      this.size * 0.2,
      this.size / 5
    );
    
    // Windows - mid level
    ctx.fillRect(
      this.x - this.size * 0.25,
      this.y - this.size * 0.7, 
      this.size * 0.15,
      this.size / 6
    );
    ctx.fillRect(
      this.x + this.size * 0.1,
      this.y - this.size * 0.7, 
      this.size * 0.15,
      this.size / 6
    );
    
    // Draw health bar
    const healthBarWidth = this.size * 2;
    const healthBarHeight = 8;
    const healthPercent = this.health / this.maxHealth;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(
      this.x - healthBarWidth / 2,
      this.y + this.size * 0.8,
      healthBarWidth,
      healthBarHeight
    );
    
    // Health
    let healthColor;
    if (healthPercent > 0.6) healthColor = '#00ff00';
    else if (healthPercent > 0.3) healthColor = '#ffff00';
    else healthColor = '#ff0000';
    
    ctx.fillStyle = healthColor;
    ctx.fillRect(
      this.x - healthBarWidth / 2,
      this.y + this.size * 0.8,
      healthBarWidth * healthPercent,
      healthBarHeight
    );
  }
  
  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }
  
  public reset(): void {
    this.health = this.maxHealth;
  }
}

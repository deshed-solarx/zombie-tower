export class Tower {
  public x: number;
  public y: number;
  public size: number;
  public health: number;
  public maxHealth: number;
  
  private readonly towerImage: HTMLImageElement;
  private isLoaded: boolean = false;
  
  constructor(x: number, y: number, size: number, health: number) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.health = health;
    this.maxHealth = health;
    
    // Load tower image
    this.towerImage = new Image();
    this.towerImage.src = this.createTowerSVG();
    this.towerImage.onload = () => {
      this.isLoaded = true;
    };
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
    
    // Draw tower with image if loaded
    if (this.isLoaded) {
      ctx.drawImage(
        this.towerImage,
        this.x - this.size,
        this.y - this.size * 1.2,
        this.size * 2,
        this.size * 2
      );
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = '#888888';
      ctx.fillRect(
        this.x - this.size / 2,
        this.y - this.size, 
        this.size,
        this.size
      );
      
      // Draw cannon
      ctx.fillStyle = '#444444';
      ctx.fillRect(
        this.x - this.size / 6,
        this.y - this.size * 1.2,
        this.size / 3,
        this.size * 0.8
      );
    }
    
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
  
  // SVG string representation of the tower
  private createTowerSVG(): string {
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <!-- Tower base -->
        <rect x="30" y="60" width="40" height="30" fill="#777" />
        
        <!-- Tower mid section -->
        <rect x="35" y="40" width="30" height="20" fill="#888" />
        
        <!-- Tower top -->
        <rect x="40" y="25" width="20" height="15" fill="#999" />
        
        <!-- Cannon -->
        <rect x="45" y="10" width="10" height="25" fill="#444" />
        
        <!-- Windows -->
        <rect x="40" y="65" width="8" height="10" fill="#333" />
        <rect x="52" y="65" width="8" height="10" fill="#333" />
        <rect x="40" y="45" width="7" height="7" fill="#333" />
        <rect x="53" y="45" width="7" height="7" fill="#333" />
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  }
}

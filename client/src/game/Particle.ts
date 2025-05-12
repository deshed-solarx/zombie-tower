// Simplified Particle class with better error handling
export class Particle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public size: number;
  public color: string;
  public lifetime: number;
  public age: number = 0;
  public active: boolean = true;
  
  constructor(x: number, y: number, vx: number, vy: number, size: number, color: string, lifetime: number) {
    // Validate inputs
    this.x = isFinite(x) ? x : 0;
    this.y = isFinite(y) ? y : 0;
    this.vx = isFinite(vx) ? vx : 0;
    this.vy = isFinite(vy) ? vy : 0;
    this.size = isFinite(size) && size > 0 ? size : 1;
    this.color = color || '#ffffff';
    this.lifetime = isFinite(lifetime) && lifetime > 0 ? lifetime : 1;
  }
  
  public update(dt: number): void {
    try {
      // Ensure dt is valid
      if (!isFinite(dt) || dt <= 0) return;
      
      // Move particle
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      
      // Simplified physics - no gravity, just light friction
      this.vx *= 0.98;
      this.vy *= 0.98;
      
      // Age the particle
      this.age += dt;
      if (this.age >= this.lifetime) {
        this.active = false;
      }
    } catch (err) {
      // If anything goes wrong, just deactivate the particle
      console.error('Error updating particle:', err);
      this.active = false;
    }
  }
  
  public render(ctx: CanvasRenderingContext2D): void {
    try {
      if (!ctx) return;
      
      // Calculate opacity based on age (with safety checks)
      const ageRatio = this.age / this.lifetime;
      const baseOpacity = Math.max(0, Math.min(0.9, 1 - ageRatio)); // Increased from 0.7 to 0.9
      
      // Deactivate nearly invisible particles
      if (baseOpacity < 0.1) {
        this.active = false;
        return;
      }
      
      // Use a smaller size that fades out
      const size = this.size * (1 - ageRatio * 0.3); // Slower size reduction (0.5 to 0.3)
      
      // For larger particles (likely explosions), add a glow effect
      if (this.size > 3 && this.lifetime > 0.3) {
        // Add a glow effect with shadow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = size * 2;
        
        // First draw a larger, more transparent outer glow
        ctx.globalAlpha = baseOpacity * 0.4;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw the main particle
      ctx.shadowBlur = 0; // Turn off shadow for the main particle
      ctx.globalAlpha = baseOpacity;
      ctx.fillStyle = this.color;
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset context state
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    } catch (err) {
      console.error('Error rendering particle:', err);
      this.active = false;
    }
  }
}

import { UseAudioStore } from "../lib/stores/useAudio";

export class SoundManager {
  private audioStore: UseAudioStore;
  
  // Sound effect cache for optimization
  private shootSound: HTMLAudioElement | null = null;
  private hitSound: HTMLAudioElement | null = null;
  private zombieDeathSound: HTMLAudioElement | null = null;
  private waveStartSound: HTMLAudioElement | null = null;
  
  constructor(audioStore: UseAudioStore) {
    this.audioStore = audioStore;
    
    // Pre-create synthetic audio effects to avoid recreating them on each play
    this.createSoundEffects();
  }
  
  private createSoundEffects(): void {
    // These will be created on demand when needed
  }
  
  public playShoot(): void {
    if (this.audioStore.getState().isMuted) return;
    
    // Create shoot sound if not already created
    if (!this.shootSound) {
      this.shootSound = new Audio(); 
      
      // For now, use the same hit sound from the audio store
      // but with different volume/pitch
      const hitSound = this.audioStore.getState().hitSound;
      if (hitSound) {
        this.shootSound.src = hitSound.src;
        this.shootSound.volume = 0.2;
        this.shootSound.playbackRate = 1.5;
      }
    }
    
    // Play the sound (clone it to allow overlapping sounds)
    if (this.shootSound) {
      const sound = this.shootSound.cloneNode() as HTMLAudioElement;
      sound.volume = 0.2;
      sound.play().catch(e => console.log('Audio play prevented:', e));
    }
  }
  
  public playHit(): void {
    // Use hit sound from audio store
    this.audioStore.getState().playHit();
  }
  
  public playZombieDeath(): void {
    if (this.audioStore.getState().isMuted) return;
    
    // Use success sound for zombie death
    this.audioStore.getState().playSuccess();
  }
  
  public playWaveStart(): void {
    if (this.audioStore.getState().isMuted) return;
    
    // Create wave start sound if not already created
    if (!this.waveStartSound) {
      this.waveStartSound = new Audio();
      
      // Use success sound but with different pitch
      const successSound = this.audioStore.getState().successSound;
      if (successSound) {
        this.waveStartSound.src = successSound.src;
        this.waveStartSound.volume = 0.5;
        this.waveStartSound.playbackRate = 0.8;
      }
    }
    
    // Play the sound
    if (this.waveStartSound) {
      this.waveStartSound.currentTime = 0;
      this.waveStartSound.play().catch(e => console.log('Audio play prevented:', e));
    }
  }
}

// PlayerDataService.ts - Client service for managing player data

import { v4 as uuidv4 } from 'uuid';

export interface PlayerData {
  id?: number;
  playerId: string;
  displayName?: string;
  coins: number;
  permUpgrades: Record<string, any>;
  lastSeen?: string;
  createdAt?: string;
}

// URLs for API endpoints
const API_URL = '/api/player-data';

class PlayerDataService {
  private static instance: PlayerDataService;
  private playerData: PlayerData | null = null;
  private isLoading: boolean = false;
  private cookieName: string = 'player_id';
  
  // Singleton pattern
  public static getInstance(): PlayerDataService {
    if (!PlayerDataService.instance) {
      PlayerDataService.instance = new PlayerDataService();
    }
    return PlayerDataService.instance;
  }
  
  private constructor() {
    // Initialize player data on service creation
    this.initializePlayer();
  }
  
  // Initialize by loading player data
  private async initializePlayer(): Promise<void> {
    this.isLoading = true;
    try {
      // Get player ID from cookie, or generate a new one
      const playerId = this.getPlayerIdFromCookie() || this.generateNewPlayerId();
      
      // Fetch player data from API
      await this.fetchPlayerData(playerId);
    } catch (error) {
      console.error('Failed to initialize player data:', error);
      
      // If API fails, create a local fallback
      if (!this.playerData) {
        const playerId = this.getPlayerIdFromCookie() || this.generateNewPlayerId();
        this.playerData = {
          playerId,
          coins: 0,
          permUpgrades: {}
        };
      }
    } finally {
      this.isLoading = false;
    }
  }
  
  // Get player ID from cookie
  private getPlayerIdFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
  
  // Set player ID cookie
  private setPlayerIdCookie(playerId: string): void {
    // Set cookie to expire in 1 year
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    document.cookie = `${this.cookieName}=${encodeURIComponent(playerId)};expires=${expiryDate.toUTCString()};path=/;SameSite=Lax`;
  }
  
  // Generate a new player ID and save to cookie
  private generateNewPlayerId(): string {
    const newPlayerId = uuidv4();
    this.setPlayerIdCookie(newPlayerId);
    return newPlayerId;
  }
  
  // Fetch player data from API
  private async fetchPlayerData(playerId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}?playerId=${playerId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        this.playerData = data.player;
        console.log('Player data loaded:', this.playerData);
      } else {
        throw new Error(data.message || 'Failed to load player data');
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
      throw error;
    }
  }
  
  // Get current player data
  public async getPlayerData(): Promise<PlayerData> {
    // If data is still loading, wait
    if (this.isLoading) {
      await new Promise<void>(resolve => {
        const checkLoading = () => {
          if (!this.isLoading) {
            resolve();
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }
    
    // If no data available, initialize
    if (!this.playerData) {
      await this.initializePlayer();
    }
    
    // If still no data after initialization, create default data
    if (!this.playerData) {
      const playerId = this.getPlayerIdFromCookie() || this.generateNewPlayerId();
      this.playerData = {
        playerId,
        coins: 0,
        permUpgrades: {}
      };
    }
    
    return this.playerData;
  }
  
  // Update player data (locally and on server)
  public async updatePlayerData(updates: Partial<Omit<PlayerData, 'playerId'>>): Promise<PlayerData> {
    // If no data available, initialize
    if (!this.playerData) {
      await this.initializePlayer();
      
      // If still no data after initialization, create default data
      if (!this.playerData) {
        const playerId = this.getPlayerIdFromCookie() || this.generateNewPlayerId();
        this.playerData = {
          playerId,
          coins: 0,
          permUpgrades: {}
        };
      }
    }
    
    try {
      // Update locally first for responsive UI
      this.playerData = {
        ...this.playerData,
        ...updates
      };
      
      // Then send to server
      const response = await fetch(`${API_URL}?playerId=${this.playerData.playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update with the server response
        this.playerData = data.player;
      } else {
        throw new Error(data.message || 'Failed to update player data');
      }
      
      return this.playerData;
    } catch (error) {
      console.error('Error updating player data:', error);
      // Return the locally updated data even if server update fails
      return this.playerData;
    }
  }
  
  // Change player ID (for developer menu)
  public async changePlayerId(newPlayerId: string): Promise<PlayerData> {
    try {
      // Create a new player with the specified ID
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: newPlayerId,
          // Copy existing data if available
          displayName: this.playerData?.displayName,
          coins: this.playerData?.coins || 0,
          permUpgrades: this.playerData?.permUpgrades || {}
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update cookie with new ID
        this.setPlayerIdCookie(newPlayerId);
        
        // Update local data
        this.playerData = data.player;
        return this.playerData;
      } else {
        // If player already exists, just load that player's data
        if (response.status === 409) {
          await this.fetchPlayerData(newPlayerId);
          this.setPlayerIdCookie(newPlayerId);
          return this.playerData!;
        }
        
        throw new Error(data.message || 'Failed to change player ID');
      }
    } catch (error) {
      console.error('Error changing player ID:', error);
      throw error;
    }
  }
  
  // Get player ID
  public getPlayerId(): string | null {
    return this.playerData?.playerId || null;
  }
  
  // Get coins
  public getCoins(): number {
    return this.playerData?.coins || 0;
  }
  
  // Update coins
  public async updateCoins(amount: number): Promise<number> {
    const currentCoins = this.getCoins();
    const newCoins = Math.max(0, currentCoins + amount);
    
    await this.updatePlayerData({ coins: newCoins });
    return newCoins;
  }
  
  // Set a specific perm upgrade
  public async setPermUpgrade(key: string, value: any): Promise<void> {
    if (!this.playerData) {
      await this.initializePlayer();
    }
    
    const updatedUpgrades = {
      ...this.playerData!.permUpgrades,
      [key]: value
    };
    
    await this.updatePlayerData({ permUpgrades: updatedUpgrades });
  }
  
  // Get a specific perm upgrade
  public async getPermUpgrade(key: string): Promise<any> {
    if (!this.playerData) {
      await this.initializePlayer();
    }
    
    return this.playerData!.permUpgrades[key] || null;
  }
  
  // Check if data is loaded
  public isDataLoaded(): boolean {
    return !this.isLoading && this.playerData !== null;
  }
}

// Export singleton instance
export default PlayerDataService.getInstance();
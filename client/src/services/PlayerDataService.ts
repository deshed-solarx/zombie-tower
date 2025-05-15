// Service for handling player data
export interface PlayerData {
  id: number;
  playerId: string;
  displayName: string;
  coins: number;
  permUpgrades: Record<string, any>;
  lastSeen: string;
  createdAt: string;
}

// Base API URL - automatically detects if we're in development or production
const API_BASE_URL = import.meta.env.PROD 
  ? '/api' 
  : import.meta.env.DEV 
    ? 'http://localhost:5000/api'
    : '/api';

// Generate a random player ID if one doesn't exist
export function getOrCreatePlayerId(): string {
  const existingId = localStorage.getItem('playerId');
  
  if (existingId) {
    return existingId;
  }
  
  // Generate a new unique ID
  const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  localStorage.setItem('playerId', newId);
  
  return newId;
}

// Get player data from the server
export async function getPlayerData(playerId: string): Promise<PlayerData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/player-data?playerId=${encodeURIComponent(playerId)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch player data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch player data');
    }
    
    return data.player || null;
  } catch (error) {
    console.error('Error fetching player data:', error);
    return null;
  }
}

// Update player data on the server
export async function updatePlayerData(
  playerId: string, 
  updates: { coins?: number; permUpgrades?: Record<string, any> }
): Promise<PlayerData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/player-data?playerId=${encodeURIComponent(playerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update player data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update player data');
    }
    
    return data.player || null;
  } catch (error) {
    console.error('Error updating player data:', error);
    return null;
  }
}
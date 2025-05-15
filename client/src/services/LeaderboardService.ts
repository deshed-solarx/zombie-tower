// Service for handling leaderboard data
export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  waveReached: number;
  date: string | null;
}

// Base API URL - automatically detects if we're in development or production
const API_BASE_URL = import.meta.env.PROD 
  ? '/api' 
  : import.meta.env.DEV 
    ? 'http://localhost:5000/api'
    : '/api';

// Get top scores from the leaderboard
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch leaderboard data');
    }
    
    return data.leaderboard || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Add a new high score to the leaderboard
export async function addHighScore(entry: {
  playerName: string;
  score: number;
  waveReached?: number;
}): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add high score: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to add high score');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding high score:', error);
    return false;
  }
}
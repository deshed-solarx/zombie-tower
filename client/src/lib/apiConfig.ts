// API configuration for different environments

// For Vercel deployment - look for a specific domain pattern or URL param
const isVercelDeployment = 
  typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel') || 
   window.location.hostname.endsWith('.app') ||
   new URLSearchParams(window.location.search).has('vercel'));

// Base API URL - use Vercel's serverless functions API routes
export const API_BASE_URL = '/api';

// For static deployments, we'll provide client-side game state management
export const isStaticMode = true;

// Class to manage game data locally (for static deployments)
class LocalGameStorage {
  getItem(key: string) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error getting data from storage:', e);
      return null;
    }
  }

  setItem(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving data to storage:', e);
      return false;
    }
  }

  getHighScores() {
    return this.getItem('highScores') || [];
  }

  saveScore(score: number, playerName = 'Player') {
    const highScores = this.getHighScores();
    const newScore = { 
      score, 
      playerName, 
      date: new Date().toISOString() 
    };
    
    highScores.push(newScore);
    highScores.sort((a: any, b: any) => b.score - a.score);
    
    // Keep only top 10 scores
    const topScores = highScores.slice(0, 10);
    this.setItem('highScores', topScores);
    
    return topScores;
  }
}

// Export the storage instance
export const gameStorage = new LocalGameStorage();

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    isVercelDeployment,
    API_BASE_URL,
    isStaticMode
  });
}
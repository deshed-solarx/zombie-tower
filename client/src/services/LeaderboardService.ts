interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  waveReached: number;
  date: string | null;
}

interface LeaderboardResponse {
  success: boolean;
  scores?: LeaderboardEntry[];
  message?: string;
}

interface SubmitScoreResponse {
  success: boolean;
  message?: string;
  scoreId?: string;
}

class LeaderboardService {
  private static instance: LeaderboardService;
  private isEnabled: boolean = false;
  
  // Singleton pattern
  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }
  
  constructor() {
    // Check if the leaderboard API is available
    this.checkAvailability();
  }
  
  private async checkAvailability(): Promise<void> {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      this.isEnabled = data.success;
      
      if (!data.success) {
        console.log("Leaderboard service is not available:", data.message);
      } else {
        console.log("Leaderboard service is available and working");
      }
    } catch (error) {
      console.error("Failed to connect to leaderboard service:", error);
      this.isEnabled = false;
    }
  }
  
  public async getTopScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!this.isEnabled) {
      console.log("Leaderboard service is not available");
      return [];
    }
    
    try {
      const response = await fetch(`/api/leaderboard?limit=${limit}`);
      const data: LeaderboardResponse = await response.json();
      
      if (data.success && data.scores) {
        return data.scores;
      } else {
        console.error("Failed to fetch leaderboard:", data.message);
        return [];
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }
  
  public async submitScore(playerName: string, score: number, waveReached: number): Promise<boolean> {
    if (!this.isEnabled) {
      console.log("Leaderboard service is not available, score not submitted");
      return false;
    }
    
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          score,
          waveReached
        }),
      });
      
      const data: SubmitScoreResponse = await response.json();
      
      if (data.success) {
        console.log("Score submitted successfully:", data.scoreId);
        return true;
      } else {
        console.error("Failed to submit score:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Error submitting score:", error);
      return false;
    }
  }
  
  public isLeaderboardEnabled(): boolean {
    return this.isEnabled;
  }
  
  // Force a refresh of the availability check
  public async refreshAvailability(): Promise<boolean> {
    await this.checkAvailability();
    return this.isEnabled;
  }
}

export default LeaderboardService.getInstance();
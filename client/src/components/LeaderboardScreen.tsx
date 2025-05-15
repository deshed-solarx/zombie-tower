import React, { useState, useEffect } from 'react';
import { getLeaderboard, LeaderboardEntry } from '../services/LeaderboardService';

interface LeaderboardScreenProps {
  onClose: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, []);
  
  // Format date to be more readable
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-card p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Global Leaderboard</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mb-4"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive bg-opacity-20 text-destructive-foreground p-4 rounded text-center">
            {error}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-xl mb-4">No high scores yet!</p>
            <p className="text-muted-foreground">Be the first to get on the leaderboard by playing the game.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">Player</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Wave</th>
                  <th className="text-left p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr 
                    key={entry.id} 
                    className={`border-b border-border ${index < 3 ? 'bg-muted bg-opacity-30' : ''}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center">
                        {index === 0 && (
                          <span className="text-yellow-500 mr-2">🏆</span>
                        )}
                        {index === 1 && (
                          <span className="text-gray-400 mr-2">🥈</span>
                        )}
                        {index === 2 && (
                          <span className="text-amber-700 mr-2">🥉</span>
                        )}
                        {index > 2 && (
                          <span className="mr-2">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold">{entry.playerName}</td>
                    <td className="p-3 text-primary font-bold">{entry.score.toLocaleString()}</td>
                    <td className="p-3">{entry.waveReached}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(entry.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded font-semibold hover:bg-secondary/90"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
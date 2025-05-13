import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  waveReached: number;
  date: string | null;
}

interface LeaderboardScreenProps {
  onClose: () => void;
}

const LeaderboardScreen = ({ onClose }: LeaderboardScreenProps) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        
        if (data.success) {
          setScores(data.scores);
        } else {
          setError(data.message || 'Failed to load leaderboard');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to connect to the leaderboard service');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Format date to a readable string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      <div className="max-w-md w-full bg-black/90 rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">Leaderboard</h1>
          <Button 
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full h-8 w-8 flex items-center justify-center"
          >
            ✕
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-yellow-400 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-300">Loading high scores...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 p-4 rounded-lg text-center">
            <p className="text-red-300">{error}</p>
            <p className="text-sm text-gray-400 mt-2">
              Notion integration may not be configured.
            </p>
          </div>
        ) : (
          <>
            {scores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300">No high scores yet. Be the first!</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Player</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Wave</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {scores.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-200">#{index + 1}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-200">{entry.playerName}</div>
                          <div className="text-xs text-gray-400">{formatDate(entry.date)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-yellow-400">{entry.score.toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm text-green-400">{entry.waveReached}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="mt-6 text-center">
          <Button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg text-lg font-semibold transition"
          >
            Back to Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
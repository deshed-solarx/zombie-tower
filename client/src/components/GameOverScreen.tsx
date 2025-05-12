import { Button } from './ui/button';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

const GameOverScreen = ({ score, onRestart }: GameOverScreenProps) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      <div className="max-w-md w-full bg-black/90 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-2">Game Over</h1>
        
        <p className="text-gray-300 mb-6">
          Your tower has been destroyed by the zombie horde!
        </p>
        
        <div className="mb-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Final Score</h2>
          <p className="text-5xl font-bold text-yellow-400">{score}</p>
        </div>
        
        <Button 
          onClick={onRestart}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg text-xl font-bold transition"
        >
          Play Again
        </Button>
      </div>
    </div>
  );
};

export default GameOverScreen;

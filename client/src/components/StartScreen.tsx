import { Button } from './ui/button';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      <div className="max-w-md w-full bg-black/90 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Zombie Tower Defense</h1>
        
        <p className="text-lg text-gray-300 mb-6">
          Defend your tower from waves of zombies! Click anywhere on the screen to shoot.
        </p>
        
        <div className="mb-8 bg-gray-800 rounded-lg p-4 text-left">
          <h2 className="text-xl font-semibold text-white mb-2">How to Play:</h2>
          <ul className="text-gray-300 space-y-2">
            <li>• Click to shoot at zombies</li>
            <li>• Each killed zombie gives you points</li>
            <li>• Zombies damage your tower when they reach it</li>
            <li>• Survive as long as possible!</li>
          </ul>
        </div>
        
        <Button 
          onClick={onStart}
          className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg text-xl font-bold transition"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
};

export default StartScreen;

import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-card rounded-lg shadow-lg p-6 border border-border">
        <h1 className="text-4xl font-bold text-primary text-center mb-6">Zombie Tower Defense</h1>
        <p className="text-xl mb-4 text-center">Game is Loading...</p>
        
        <div className="flex justify-center my-6">
          <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
        
        <p className="text-muted-foreground text-center italic">Please wait while we prepare your zombie-slaying experience!</p>
        
        <div className="flex justify-center mt-6">
          <button
            className="bg-primary text-primary-foreground px-6 py-2 rounded font-semibold hover:bg-primary/90 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
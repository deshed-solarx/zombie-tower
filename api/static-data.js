// Static game data for Vercel deployment
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Game data that would normally come from the database
  const gameData = {
    stats: {
      totalGamesPlayed: 12542,
      zombiesKilled: 1832749,
      averageScore: 3587,
      topPlayer: "ZombieMaster99"
    },
    upgrades: [
      {
        id: "multi-shot",
        name: "Multi-Shot",
        description: "Shoot multiple bullets at once",
        levels: 5,
        currentLevel: 0
      },
      {
        id: "bounce",
        name: "Bouncing Bullets",
        description: "Bullets bounce off the walls",
        levels: 3,
        currentLevel: 0
      },
      {
        id: "auto-aim",
        name: "Auto-Aim",
        description: "Automatically target the nearest zombie",
        levels: 1,
        currentLevel: 0
      },
      {
        id: "trickster",
        name: "Trickster",
        description: "Bullets deal more damage after each bounce",
        levels: 4,
        currentLevel: 0
      },
      {
        id: "ghost-bullets",
        name: "Ghost Bullets",
        description: "Bullets pass through zombies",
        levels: 1,
        currentLevel: 0
      },
      {
        id: "bullet-time",
        name: "Bullet Time",
        description: "Slow down time, increasing bullet damage",
        levels: 1,
        currentLevel: 0
      },
      {
        id: "hitscan",
        name: "Hitscan",
        description: "Bullets instantly hit their target",
        levels: 1,
        currentLevel: 0
      },
      {
        id: "explosive",
        name: "Explosive Rounds",
        description: "Bullets explode on impact",
        levels: 3,
        currentLevel: 0
      },
      {
        id: "implosive",
        name: "Implosive Rounds",
        description: "Bullets pull zombies toward impact",
        levels: 3,
        currentLevel: 0
      },
      {
        id: "split",
        name: "Split Shot",
        description: "Bullets split into multiple bullets on impact",
        levels: 3,
        currentLevel: 0
      },
      {
        id: "aftermath",
        name: "Aftermath",
        description: "Zombies explode when killed",
        levels: 1,
        currentLevel: 0
      },
      {
        id: "critical",
        name: "Critical Strike",
        description: "Chance to deal critical damage",
        levels: 2,
        currentLevel: 0
      },
      {
        id: "necromantic",
        name: "Necromantic",
        description: "Zombies have a chance to fight for you when killed",
        levels: 1,
        currentLevel: 0
      },
      {
        id: "lifesteal",
        name: "Life Steal",
        description: "Regain health when killing zombies",
        levels: 3,
        currentLevel: 0
      },
      {
        id: "homing",
        name: "Homing Bullets",
        description: "Bullets home in on enemies",
        levels: 1,
        currentLevel: 0
      }
    ],
    leaderboard: [
      { name: "ZombieMaster99", score: 12450 },
      { name: "BrainSlayer", score: 10325 },
      { name: "DeadShot", score: 9876 },
      { name: "LastStand", score: 8765 },
      { name: "SurvivorElite", score: 7654 },
      { name: "TowerDefender", score: 6543 },
      { name: "ZombieHunter", score: 5432 },
      { name: "WaveSlayer", score: 4321 },
      { name: "HeadshotKing", score: 3210 },
      { name: "FortDefender", score: 2109 }
    ]
  };
  
  // Special response based on query parameters
  const query = req.query || {};
  
  if (query.type === 'leaderboard') {
    return res.status(200).json({ leaderboard: gameData.leaderboard });
  } else if (query.type === 'upgrades') {
    return res.status(200).json({ upgrades: gameData.upgrades });
  } else if (query.type === 'stats') {
    return res.status(200).json({ stats: gameData.stats });
  }
  
  // Default: return the full game data
  res.status(200).json({
    status: 'success',
    data: gameData,
    serverTime: new Date().toISOString(),
    isStaticData: true
  });
}
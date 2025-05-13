import { users, type User, type InsertUser, players, type Player, type InsertPlayer } from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 as uuidv4 } from "uuid";

// Create a PostgreSQL client
const client = postgres(process.env.DATABASE_URL || "");
export const db = drizzle(client);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Player methods
  getPlayerById(playerId: string): Promise<Player | undefined>;
  createPlayer(playerData?: Partial<InsertPlayer>): Promise<Player>;
  updatePlayer(playerId: string, data: Partial<Omit<InsertPlayer, "playerId">>): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
}

export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).limit(1);
      return result.find(user => user.username === username);
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createUser:', error);
      throw error;
    }
  }
  
  // Player methods
  async getPlayerById(playerId: string): Promise<Player | undefined> {
    try {
      const result = await db.select().from(players);
      return result.find(player => player.playerId === playerId);
    } catch (error) {
      console.error('Database error in getPlayerById:', error);
      return undefined;
    }
  }
  
  async createPlayer(playerData?: Partial<InsertPlayer>): Promise<Player> {
    try {
      const now = new Date().toISOString();
      const newPlayerId = playerData?.playerId || uuidv4();
      
      const newPlayer: InsertPlayer = {
        playerId: newPlayerId,
        displayName: playerData?.displayName || `Player_${newPlayerId.substr(0, 6)}`,
        coins: playerData?.coins || 0,
        permUpgrades: playerData?.permUpgrades || {},
        lastSeen: now,
        createdAt: now
      };
      
      const result = await db.insert(players).values(newPlayer).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createPlayer:', error);
      throw error;
    }
  }
  
  async updatePlayer(playerId: string, data: Partial<Omit<InsertPlayer, "playerId">>): Promise<Player | undefined> {
    try {
      // Always update lastSeen when updating player
      const updateData = {
        ...data,
        lastSeen: new Date().toISOString()
      };
      
      // First, get the player to update
      const playerToUpdate = await this.getPlayerById(playerId);
      if (!playerToUpdate) return undefined;
      
      // Then update the player
      const result = await db.update(players)
        .set(updateData)
        .returning();
      
      // Find and return the updated player
      return result.find(player => player.playerId === playerId);
    } catch (error) {
      console.error('Database error in updatePlayer:', error);
      return undefined;
    }
  }
  
  async getAllPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }
}

// Fallback in-memory storage if database connection fails
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private playerMap: Map<string, Player>;
  currentId: number;
  currentPlayerId: number;

  constructor() {
    this.users = new Map();
    this.playerMap = new Map();
    this.currentId = 1;
    this.currentPlayerId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getPlayerById(playerId: string): Promise<Player | undefined> {
    return this.playerMap.get(playerId);
  }
  
  async createPlayer(playerData?: Partial<InsertPlayer>): Promise<Player> {
    const now = new Date().toISOString();
    const id = this.currentPlayerId++;
    const newPlayerId = playerData?.playerId || uuidv4();
    
    const newPlayer: Player = {
      id,
      playerId: newPlayerId,
      displayName: playerData?.displayName || `Player_${newPlayerId.substr(0, 6)}`,
      coins: playerData?.coins || 0,
      permUpgrades: playerData?.permUpgrades || {},
      lastSeen: now,
      createdAt: now
    };
    
    this.playerMap.set(newPlayerId, newPlayer);
    return newPlayer;
  }
  
  async updatePlayer(playerId: string, data: Partial<Omit<InsertPlayer, "playerId">>): Promise<Player | undefined> {
    const player = this.playerMap.get(playerId);
    if (!player) return undefined;
    
    const updatedPlayer: Player = {
      ...player,
      ...data,
      lastSeen: new Date().toISOString()
    };
    
    this.playerMap.set(playerId, updatedPlayer);
    return updatedPlayer;
  }
  
  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.playerMap.values());
  }
}

// Use PostgreSQL storage, but fall back to memory storage if there's an issue
let storage: IStorage;

try {
  storage = new PostgresStorage();
  console.log("Using PostgreSQL for storage");
} catch (error) {
  console.error("Failed to initialize PostgreSQL storage:", error);
  console.log("Falling back to in-memory storage");
  storage = new MemStorage();
}

export { storage };

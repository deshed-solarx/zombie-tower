import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Player data table to store game progression
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull().unique(),
  displayName: text("display_name"),
  coins: integer("coins").default(0),
  permUpgrades: jsonb("perm_upgrades").default({}).notNull(),
  lastSeen: text("last_seen").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  playerId: true,
  displayName: true,
  coins: true,
  permUpgrades: true,
  lastSeen: true,
  createdAt: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

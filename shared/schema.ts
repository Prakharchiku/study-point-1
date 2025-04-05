import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  duration: integer("duration").notNull(), // in seconds
  coinsEarned: integer("coins_earned").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  currency: integer("currency").notNull().default(0),
  totalStudyTime: integer("total_study_time").notNull().default(0), // in seconds
  todayStudyTime: integer("today_study_time").notNull().default(0), // in seconds
  totalSessions: integer("total_sessions").notNull().default(0),
  breaksTaken: integer("breaks_taken").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
});

export const breaks = pgTable("breaks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  cost: integer("cost").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).pick({
  userId: true,
  duration: true, 
  coinsEarned: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  currency: true,
  totalStudyTime: true,
  todayStudyTime: true,
  totalSessions: true,
  breaksTaken: true,
  streakDays: true,
  level: true,
  experience: true,
});

export const insertBreakSchema = createInsertSchema(breaks).pick({
  name: true,
  description: true,
  duration: true,
  cost: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessions.$inferSelect;

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

export type InsertBreak = z.infer<typeof insertBreakSchema>;
export type Break = typeof breaks.$inferSelect;

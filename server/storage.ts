import { 
  users, type User, type InsertUser,
  studySessions, type StudySession, type InsertStudySession,
  userStats, type UserStats, type InsertUserStats,
  breaks, type Break, type InsertBreak
} from "@shared/schema";

import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Study sessions methods
  getStudySessions(userId: number): Promise<StudySession[]>;
  createStudySession(session: InsertStudySession): Promise<StudySession>;

  // User stats methods
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats>;

  // Break methods
  getBreaks(): Promise<Break[]>;
  getBreak(id: number): Promise<Break | undefined>;
  createBreak(breakItem: InsertBreak): Promise<Break>;

  // Session store
  sessionStore: session.Store;
}

import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private studySessions: Map<number, StudySession>;
  private userStats: Map<number, UserStats>;
  private userId: number;
  private sessionId: number;
  private statsId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.studySessions = new Map();
    this.userStats = new Map();
    this.userId = 1;
    this.sessionId = 1;
    this.statsId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // Break methods - completely disabled for MemStorage
  async getBreaks(): Promise<Break[]> {
    return [];
  }

  async getBreak(id: number): Promise<Break | undefined> {
    return undefined;
  }

  async createBreak(breakData: InsertBreak): Promise<Break> {
    throw new Error("Break creation not supported in MemStorage");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Study sessions methods
  async getStudySessions(userId: number): Promise<StudySession[]> {
    return Array.from(this.studySessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const id = this.sessionId++;
    const date = new Date();
    const session: StudySession = { ...insertSession, id, date };
    this.studySessions.set(id, session);
    return session;
  }

  // User stats methods
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find(
      (stats) => stats.userId === userId,
    );
  }

  async createUserStats(insertStats: InsertUserStats): Promise<UserStats> {
    const id = this.statsId++;
    const lastStudyDate = new Date();
    const stats: UserStats = { 
      ...insertStats, 
      id,
      currency: insertStats.currency ?? 0,
      totalStudyTime: insertStats.totalStudyTime ?? 0,
      todayStudyTime: insertStats.todayStudyTime ?? 0,
      totalSessions: insertStats.totalSessions ?? 0,
      breaksTaken: insertStats.breaksTaken ?? 0,
      streakDays: insertStats.streakDays ?? 0,
      lastStudyDate: insertStats.lastStudyDate ?? lastStudyDate,
      level: insertStats.level ?? 1,
      experience: insertStats.experience ?? 0
    };
    this.userStats.set(id, stats);
    return stats;
  }

  async updateUserStats(userId: number, updatedStats: Partial<InsertUserStats>): Promise<UserStats> {
    let stats = await this.getUserStats(userId);

    if (!stats) {
      stats = await this.createUserStats({ 
        userId, 
        currency: 0, 
        totalStudyTime: 0, 
        todayStudyTime: 0, 
        totalSessions: 0, 
        breaksTaken: 0, 
        streakDays: 0,
        lastStudyDate: new Date(),
        level: 1,
        experience: 0
      });
    }

    const updatedUserStats: UserStats = { 
      ...stats, 
      ...updatedStats 
    };

    this.userStats.set(stats.id, updatedUserStats);
    return updatedUserStats;
  }
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    this.initializeDefaultBreaks();
  }

  private async initializeDefaultBreaks() {
    await db.delete(breaks); // Clear existing breaks first

    const defaultBreaks = [
      { 
        name: "Study Time: 25 minutes", 
        description: "5-minute break - Based on the Pomodoro Technique; keeps your brain fresh and focused.", 
        duration: 5, 
        cost: 50
      },
      { 
        name: "Study Time: 50 minutes", 
        description: "10-minute break - Helps maintain high mental performance before fatigue kicks in.", 
        duration: 10, 
        cost: 100
      },
      { 
        name: "Study Time: 90 minutes", 
        description: "15-20 minute break - Follows the brain's ultradian rhythm, where focus naturally dips.", 
        duration: 20, 
        cost: 200
      },
      { 
        name: "Study Time: 2 hours", 
        description: "30-minute break - Gives your brain and body time to reset; helps prevent cognitive overload.", 
        duration: 30, 
        cost: 300
      },
      { 
        name: "Study Time: 3-4 hours", 
        description: "1-hour long break - Extended rest for full recovery; allows for proper meal, walk, or nap.", 
        duration: 60, 
        cost: 600
      }
    ];

    for (const breakData of defaultBreaks) {
      await this.createBreak(breakData);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Study sessions methods
  async getStudySessions(userId: number): Promise<StudySession[]> {
    return await db.select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.date));
  }

  async createStudySession(insertSession: InsertStudySession): Promise<StudySession> {
    const [session] = await db.insert(studySessions).values(insertSession).returning();
    return session;
  }

  // User stats methods
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async createUserStats(insertStats: InsertUserStats): Promise<UserStats> {
    const [stats] = await db.insert(userStats).values(insertStats).returning();
    return stats;
  }

  async updateUserStats(userId: number, updatedStats: Partial<InsertUserStats>): Promise<UserStats> {
    let stats = await this.getUserStats(userId);

    if (!stats) {
      stats = await this.createUserStats({ 
        userId, 
        currency: 0, 
        totalStudyTime: 0, 
        todayStudyTime: 0, 
        totalSessions: 0, 
        breaksTaken: 0, 
        streakDays: 0,
        lastStudyDate: new Date(),
        level: 1,
        experience: 0
      });
    }

    const [updatedUserStats] = await db
      .update(userStats)
      .set(updatedStats)
      .where(eq(userStats.id, stats.id))
      .returning();

    return updatedUserStats;
  }

  // Break methods
  async getBreaks(): Promise<Break[]> {
    return await db.select().from(breaks);
  }

  async getBreak(id: number): Promise<Break | undefined> {
    const [breakItem] = await db.select().from(breaks).where(eq(breaks.id, id));
    return breakItem;
  }

  async createBreak(insertBreak: InsertBreak): Promise<Break> {
    const [breakItem] = await db.insert(breaks).values(insertBreak).returning();
    return breakItem;
  }
}

export const storage = new DatabaseStorage();
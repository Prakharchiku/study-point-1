import { 
  users, type User, type InsertUser,
  studySessions, type StudySession, type InsertStudySession,
  userStats, type UserStats, type InsertUserStats,
  breaks, type Break, type InsertBreak
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private studySessions: Map<number, StudySession>;
  private userStats: Map<number, UserStats>;
  private breaks: Map<number, Break>;
  
  private userId: number;
  private sessionId: number;
  private statsId: number;
  private breakId: number;

  constructor() {
    this.users = new Map();
    this.studySessions = new Map();
    this.userStats = new Map();
    this.breaks = new Map();
    
    this.userId = 1;
    this.sessionId = 1;
    this.statsId = 1;
    this.breakId = 1;
    
    // Initialize with default break options
    this.initializeBreaks();
  }

  private initializeBreaks() {
    // Adjusted to encourage 25-30 minutes of study for a 5-minute break
    // With earnRate of 10 coins per minute, 25 minutes = 250 coins
    const defaultBreaks: InsertBreak[] = [
      { name: "5 Minute Break", description: "A quick refresher", duration: 5, cost: 250 }, // Requires ~25 min of study
      { name: "10 Minute Break", description: "Time for a snack", duration: 10, cost: 300 }, // Requires 30 min of study
      { name: "20 Minute Break", description: "Proper rest time", duration: 20, cost: 450 }, // Requires 45 min of study
      { name: "30 Minute Break", description: "Extended relaxation", duration: 30, cost: 600 } // Requires 60 min of study
    ];
    
    defaultBreaks.forEach(breakItem => this.createBreak(breakItem));
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
    const user: User = { ...insertUser, id };
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
    // Set default values for all required fields
    const stats: UserStats = { 
      ...insertStats, 
      id,
      currency: insertStats.currency ?? 0,
      totalStudyTime: insertStats.totalStudyTime ?? 0,
      todayStudyTime: insertStats.todayStudyTime ?? 0,
      totalSessions: insertStats.totalSessions ?? 0,
      breaksTaken: insertStats.breaksTaken ?? 0,
      streakDays: insertStats.streakDays ?? 0,
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
        streakDays: 0 
      });
    }
    
    const updatedUserStats: UserStats = { 
      ...stats, 
      ...updatedStats 
    };
    
    this.userStats.set(stats.id, updatedUserStats);
    return updatedUserStats;
  }
  
  // Break methods
  async getBreaks(): Promise<Break[]> {
    return Array.from(this.breaks.values());
  }
  
  async getBreak(id: number): Promise<Break | undefined> {
    return this.breaks.get(id);
  }
  
  async createBreak(insertBreak: InsertBreak): Promise<Break> {
    const id = this.breakId++;
    const breakItem: Break = { ...insertBreak, id };
    this.breaks.set(id, breakItem);
    return breakItem;
  }
}

export const storage = new MemStorage();

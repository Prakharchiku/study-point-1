import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudySessionSchema, insertUserStatsSchema, User } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);

  // Auth middleware for protected routes
  const ensureAuthenticated = (req: Request, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };

  // Get all available breaks
  app.get('/api/breaks', async (req, res) => {
    const breaks = await storage.getBreaks();
    res.json(breaks);
  });

  // Get user stats
  app.get("/api/stats/:userId", ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      let stats = await storage.getUserStats(userId);

      if (!stats) {
        // Create default stats for user if they don't exist
        stats = await storage.createUserStats({
          userId,
          currency: 100, // Give users some starting currency
          totalStudyTime: 0,
          todayStudyTime: 0,
          totalSessions: 0,
          breaksTaken: 0,
          streakDays: 0,
          level: 1,
          experience: 0
        });
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user statistics" });
    }
  });

  // Get user study sessions
  app.get("/api/sessions/:userId", ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const sessions = await storage.getStudySessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve study sessions" });
    }
  });

  // Function to calculate level and experience based on study time
  const calculateLevelAndExp = (currentLevel: number, currentExp: number, newExp: number) => {
    // XP required for each level: level * 1000
    let totalExp = currentExp + newExp;
    let level = currentLevel;

    // Check if user levels up
    while (totalExp >= level * 1000) {
      totalExp -= level * 1000;
      level += 1;
    }

    return { level, experience: totalExp };
  };

  // Create a new study session
  app.post("/api/sessions", ensureAuthenticated, async (req, res) => {
    try {
      const sessionData = insertStudySessionSchema.parse(req.body);
      const session = await storage.createStudySession(sessionData);

      // Update user stats
      const userId = sessionData.userId;
      let stats = await storage.getUserStats(userId);

      // Calculate experience gained (1 exp per second of study)
      const expGained = sessionData.duration;
      const { level, experience } = calculateLevelAndExp(
        stats?.level || 1,
        stats?.experience || 0,
        expGained
      );

      const updatedStats = {
        totalStudyTime: (stats?.totalStudyTime || 0) + sessionData.duration,
        todayStudyTime: (stats?.todayStudyTime || 0) + sessionData.duration,
        totalSessions: (stats?.totalSessions || 0) + 1,
        currency: (stats?.currency || 0) + sessionData.coinsEarned,
        level,
        experience
      };

      await storage.updateUserStats(userId, updatedStats);

      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create study session" });
    }
  });

  // Update user stats (for purchasing breaks)
  app.patch("/api/stats/:userId", ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Validate only the fields that are being updated
      const updateSchema = insertUserStatsSchema.partial();
      const updateData = updateSchema.parse(req.body);

      const stats = await storage.updateUserStats(userId, updateData);
      res.json(stats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid stats data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
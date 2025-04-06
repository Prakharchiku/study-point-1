import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'study-session-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register route
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword
      });

      // Create initial user stats
      await storage.createUserStats({
        userId: user.id,
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

      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Login failed" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Middleware to check if user is authenticated
  app.use("/api/protected/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  });

  // Update streak based on current date
  app.post("/api/protected/update-streak", async (req, res, next) => {
    try {
      const userId = (req.user as SelectUser).id;
      const userStats = await storage.getUserStats(userId);
      
      if (!userStats) {
        return res.status(404).json({ error: "User stats not found" });
      }
      
      const now = new Date();
      const lastStudyDate = userStats.lastStudyDate;
      
      // Convert dates to same timezone (UTC) for comparison
      const nowDate = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ));
      
      const lastDate = new Date(Date.UTC(
        lastStudyDate.getFullYear(),
        lastStudyDate.getMonth(),
        lastStudyDate.getDate()
      ));
      
      // Calculate difference in days
      const diffTime = Math.abs(nowDate.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let newStreakDays = userStats.streakDays;
      let streakUpdated = false;
      
      // If it's the same day, do nothing
      if (diffDays === 0) {
        return res.json({ 
          streakDays: newStreakDays,
          streakUpdated
        });
      }
      
      // If it's the next day, increase streak
      if (diffDays === 1 && nowDate > lastDate) {
        newStreakDays += 1;
        streakUpdated = true;
      } 
      // If more than one day has passed, reset streak to 1
      else if (diffDays > 1) {
        newStreakDays = 1;
        streakUpdated = true;
      }
      
      // Update user stats with new streak count and last study date
      const updatedStats = await storage.updateUserStats(userId, {
        streakDays: newStreakDays,
        lastStudyDate: new Date()
      });
      
      res.json({
        streakDays: updatedStats.streakDays,
        streakUpdated
      });
    } catch (error) {
      next(error);
    }
  });
}
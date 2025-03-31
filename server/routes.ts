import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";

// Import controllers
import { 
  registerUser, 
  loginUser, 
  socialLogin, 
  logout, 
  getCurrentUser 
} from "./controllers/auth";

import {
  isAuthenticated,
  getUserVideos,
  getVideo,
  createVideo,
  deleteVideo,
  getSubscriptionPlans
} from "./controllers/videos";

import {
  getUserSubscription,
  upgradeSubscription,
  cancelSubscription
} from "./controllers/subscriptions";

import {
  isAdmin,
  getDashboardStats,
  getAllUsers,
  getAllVideos,
  updateUserRole,
  banUser
} from "./controllers/admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create memory store for sessions
  const MemorySessionStore = MemoryStore(session);
  
  // Configure sessions
  app.use(session({
    secret: "vidai-secret-key", // In production, this should be an environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Auth routes
  app.post("/api/auth/register", registerUser);
  app.post("/api/auth/login", loginUser);
  app.post("/api/auth/social-login", socialLogin);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);
  
  // Video routes
  app.get("/api/videos", isAuthenticated, getUserVideos);
  app.get("/api/videos/:id", getVideo);
  app.post("/api/videos", isAuthenticated, createVideo);
  app.delete("/api/videos/:id", isAuthenticated, deleteVideo);
  
  // Subscription routes
  app.get("/api/subscription-plans", getSubscriptionPlans);
  app.get("/api/user/subscription", isAuthenticated, getUserSubscription);
  app.post("/api/user/subscription/upgrade", isAuthenticated, upgradeSubscription);
  app.post("/api/user/subscription/cancel", isAuthenticated, cancelSubscription);
  
  // Admin routes
  app.get("/api/admin/stats", isAuthenticated, isAdmin, getDashboardStats);
  app.get("/api/admin/users", isAuthenticated, isAdmin, getAllUsers);
  app.get("/api/admin/videos", isAuthenticated, isAdmin, getAllVideos);
  app.put("/api/admin/users/:id/role", isAuthenticated, isAdmin, updateUserRole);
  app.post("/api/admin/users/:id/ban", isAuthenticated, isAdmin, banUser);
  
  const httpServer = createServer(app);
  
  return httpServer;
}

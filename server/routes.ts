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

import {
  generateVideoScenes,
  generateSceneImage,
  createVideo as createAIVideo,
  checkVideoStatus,
  enhanceScenes
} from "./controllers/ai";

import {
  getAllApiConfigs,
  updateApiConfig,
  getApiConfigByName
} from "./controllers/api-config";

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
  
  // AI Video Generation routes
  app.post("/api/ai/generate-scenes", isAuthenticated, generateVideoScenes);
  app.post("/api/ai/generate-image", isAuthenticated, generateSceneImage);
  app.post("/api/ai/create-video", isAuthenticated, createAIVideo);
  app.get("/api/ai/video-status/:videoId", isAuthenticated, checkVideoStatus);
  app.post("/api/ai/enhance-scenes", isAuthenticated, enhanceScenes);
  
  // Stok içerik API'leri kaldırıldı
  
  // API Yapılandırma Rotaları
  app.get("/api/admin/api-configs", isAuthenticated, isAdmin, getAllApiConfigs);
  app.get("/api/admin/api-configs/:name", isAuthenticated, isAdmin, getApiConfigByName);
  app.put("/api/admin/api-configs", isAuthenticated, isAdmin, updateApiConfig);
  
  const httpServer = createServer(app);
  
  return httpServer;
}

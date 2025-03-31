// api/index.js - Vercel serverless function for the API
import express from 'express';
import { registerRoutes } from '../server/routes.js';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Setup Express app
const app = express();
const MemorySessionStore = MemoryStore(session);

// Configure session
app.use(
  session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new MemorySessionStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'super-secret-key',
  })
);

// Set up middleware
app.use(express.json());

// Register API routes
registerRoutes(app);

// Error handling
app.use((err, _req, res, _next) => {
  console.error('API Error:', err);
  res.status(500).json({
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Export serverless function handler
export default app;
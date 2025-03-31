import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  displayName: text("display_name"),
  authProvider: text("auth_provider"),
  providerId: text("provider_id"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).partial({
  password: true,
  authProvider: true,
  providerId: true,
  profileImageUrl: true,
});

// Subscription plans schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  priceMonthly: integer("price_monthly").notNull(),
  dailyVideoLimit: integer("daily_video_limit").notNull(),
  durationLimit: integer("duration_limit").notNull(), // in seconds
  resolution: text("resolution").notNull(),
  hasWatermark: boolean("has_watermark").notNull(),
  customAiModels: boolean("custom_ai_models").notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
});

// Subscriptions schema (user subscriptions)
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  active: boolean("active").default(true).notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
});

// Videos schema
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  originalText: text("original_text").notNull(),
  format: text("format").notNull(), // youtube_shorts, tiktok, instagram, standard_16_9
  duration: integer("duration").notNull(), // in seconds
  resolution: text("resolution").notNull(),
  status: text("status").default("processing").notNull(), // processing, completed, failed
  aiModel: text("ai_model"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sections: jsonb("sections"),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  status: true,
  videoUrl: true,
  thumbnailUrl: true,
  createdAt: true,
});

// Daily usage tracking
export const dailyUsage = pgTable("daily_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  videosCreated: integer("videos_created").default(0).notNull(),
});

export const insertDailyUsageSchema = createInsertSchema(dailyUsage).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type DailyUsage = typeof dailyUsage.$inferSelect;
export type InsertDailyUsage = z.infer<typeof insertDailyUsageSchema>;

import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertVideoSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Bu işlem için giriş yapmalısınız" });
  }
  next();
}

// Get all videos for the current user
export async function getUserVideos(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Bu işlem için giriş yapmalısınız" });
    }
    
    const videos = await storage.getUserVideos(userId);
    return res.status(200).json(videos);
  } catch (error) {
    return res.status(500).json({ message: "Videolar alınırken bir hata oluştu" });
  }
}

// Get a single video by ID
export async function getVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const videoId = parseInt(id, 10);
    
    if (isNaN(videoId)) {
      return res.status(400).json({ message: "Geçersiz video ID" });
    }
    
    const video = await storage.getVideo(videoId);
    
    if (!video) {
      return res.status(404).json({ message: "Video bulunamadı" });
    }
    
    // Check if the video belongs to the current user or user is admin
    const userId = req.session.userId;
    const user = userId ? await storage.getUser(userId) : null;
    
    if (!userId || (video.userId !== userId && user?.role !== "admin")) {
      return res.status(403).json({ message: "Bu videoyu görüntüleme yetkiniz yok" });
    }
    
    return res.status(200).json(video);
  } catch (error) {
    return res.status(500).json({ message: "Video alınırken bir hata oluştu" });
  }
}

// Create a new video
export async function createVideo(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Bu işlem için giriş yapmalısınız" });
    }
    
    // Get user's subscription and plan
    const user = await storage.getUser(userId);
    const subscription = await storage.getUserSubscription(userId);
    
    if (!subscription) {
      return res.status(403).json({ message: "Aktif bir aboneliğiniz yok" });
    }
    
    const plan = await storage.getSubscriptionPlan(subscription.planId);
    
    if (!plan) {
      return res.status(500).json({ message: "Abonelik planı bulunamadı" });
    }
    
    // Check if user has reached daily limit
    const today = new Date();
    const dailyUsage = await storage.getDailyUsage(userId, today);
    
    if (dailyUsage && dailyUsage.videosCreated >= plan.dailyVideoLimit) {
      return res.status(403).json({ 
        message: `Günlük video limitiniz doldu. Limitiniz: ${plan.dailyVideoLimit} video/gün`,
      });
    }
    
    // Parse and validate input
    const videoData = insertVideoSchema.parse(req.body);
    
    // Check if video duration is within plan limits
    if (videoData.duration > plan.durationLimit) {
      return res.status(403).json({ 
        message: `Video süreniz abonelik planınızın limitini aşıyor. Limitiniz: ${plan.durationLimit / 60} dakika`,
      });
    }
    
    // Check if resolution is allowed for the plan
    if (videoData.resolution !== plan.resolution) {
      return res.status(403).json({ 
        message: `Bu çözünürlük (${videoData.resolution}) abonelik planınızda mevcut değil. Planınızın çözünürlüğü: ${plan.resolution}`,
      });
    }
    
    // Create video with user ID
    const video = await storage.createVideo({
      ...videoData,
      userId,
    });
    
    // Increment daily usage
    await storage.incrementDailyUsage(userId);
    
    // In a real app, we would start a background job to process the video here
    // For demo purposes, we'll update the video status after a short delay
    setTimeout(async () => {
      const videoUrl = `https://example.com/videos/${video.id}.mp4`;
      const thumbnailUrl = `https://example.com/thumbnails/${video.id}.jpg`;
      
      await storage.updateVideo(video.id, {
        status: "completed",
        videoUrl,
        thumbnailUrl,
      });
    }, 5000);
    
    return res.status(201).json(video);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    
    return res.status(500).json({ message: "Video oluşturulurken bir hata oluştu" });
  }
}

// Delete a video
export async function deleteVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const videoId = parseInt(id, 10);
    
    if (isNaN(videoId)) {
      return res.status(400).json({ message: "Geçersiz video ID" });
    }
    
    const video = await storage.getVideo(videoId);
    
    if (!video) {
      return res.status(404).json({ message: "Video bulunamadı" });
    }
    
    // Check if the video belongs to the current user or user is admin
    const userId = req.session.userId;
    const user = userId ? await storage.getUser(userId) : null;
    
    if (!userId || (video.userId !== userId && user?.role !== "admin")) {
      return res.status(403).json({ message: "Bu videoyu silme yetkiniz yok" });
    }
    
    const success = await storage.deleteVideo(videoId);
    
    if (!success) {
      return res.status(500).json({ message: "Video silinirken bir hata oluştu" });
    }
    
    return res.status(200).json({ message: "Video başarıyla silindi" });
  } catch (error) {
    return res.status(500).json({ message: "Video silinirken bir hata oluştu" });
  }
}

// Get all subscription plans
export async function getSubscriptionPlans(req: Request, res: Response) {
  try {
    const plans = await storage.getAllSubscriptionPlans();
    return res.status(200).json(plans);
  } catch (error) {
    return res.status(500).json({ message: "Abonelik planları alınırken bir hata oluştu" });
  }
}

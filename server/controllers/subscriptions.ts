import type { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Schema for upgrading subscription
const upgradeSubscriptionSchema = z.object({
  planId: z.number().int().positive(),
});

// Get current user's subscription details
export async function getUserSubscription(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Bu işlem için giriş yapmalısınız" });
    }
    
    const subscription = await storage.getUserSubscription(userId);
    
    if (!subscription) {
      return res.status(404).json({ message: "Aktif abonelik bulunamadı" });
    }
    
    const plan = await storage.getSubscriptionPlan(subscription.planId);
    
    if (!plan) {
      return res.status(500).json({ message: "Abonelik planı bulunamadı" });
    }
    
    return res.status(200).json({
      subscription,
      plan,
    });
  } catch (error) {
    return res.status(500).json({ message: "Abonelik bilgileri alınırken bir hata oluştu" });
  }
}

// Upgrade user's subscription
export async function upgradeSubscription(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Bu işlem için giriş yapmalısınız" });
    }
    
    const { planId } = upgradeSubscriptionSchema.parse(req.body);
    
    // Get the new plan
    const newPlan = await storage.getSubscriptionPlan(planId);
    
    if (!newPlan) {
      return res.status(404).json({ message: "Geçersiz abonelik planı" });
    }
    
    // Get current subscription
    const currentSubscription = await storage.getUserSubscription(userId);
    
    if (currentSubscription) {
      // If already subscribed to this plan, return error
      if (currentSubscription.planId === planId) {
        return res.status(400).json({ message: "Zaten bu abonelik planını kullanıyorsunuz" });
      }
      
      // Update existing subscription
      const updatedSubscription = await storage.updateSubscription(currentSubscription.id, {
        planId,
        startDate: new Date(),
      });
      
      return res.status(200).json({
        subscription: updatedSubscription,
        plan: newPlan,
        message: `Aboneliğiniz ${newPlan.name} planına yükseltildi`,
      });
    } else {
      // Create new subscription
      const subscription = await storage.createSubscription({
        userId,
        planId,
        startDate: new Date(),
        active: true,
      });
      
      return res.status(201).json({
        subscription,
        plan: newPlan,
        message: `${newPlan.name} planına başarıyla abone oldunuz`,
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(error).message });
    }
    
    return res.status(500).json({ message: "Abonelik yükseltme işlemi sırasında bir hata oluştu" });
  }
}

// Cancel user's subscription
export async function cancelSubscription(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Bu işlem için giriş yapmalısınız" });
    }
    
    const subscription = await storage.getUserSubscription(userId);
    
    if (!subscription) {
      return res.status(404).json({ message: "Aktif abonelik bulunamadı" });
    }
    
    // Check if it's a free plan, which cannot be canceled
    const plan = await storage.getSubscriptionPlan(subscription.planId);
    
    if (plan?.priceMonthly === 0) {
      return res.status(400).json({ message: "Ücretsiz plan iptal edilemez" });
    }
    
    // Get the free plan
    const freePlan = (await storage.getAllSubscriptionPlans())[0];
    
    if (!freePlan) {
      return res.status(500).json({ message: "Ücretsiz plan bulunamadı" });
    }
    
    // Downgrade to free plan
    const updatedSubscription = await storage.updateSubscription(subscription.id, {
      planId: freePlan.id,
      startDate: new Date(),
    });
    
    return res.status(200).json({
      subscription: updatedSubscription,
      plan: freePlan,
      message: "Aboneliğiniz iptal edildi ve ücretsiz plana geçirildi",
    });
  } catch (error) {
    return res.status(500).json({ message: "Abonelik iptal işlemi sırasında bir hata oluştu" });
  }
}

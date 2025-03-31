import { Request, Response } from "express";
import { storage } from "../storage";
import { summarizeWithGrok, analyzeImageWithGrok } from "../services/grok";

/**
 * Metin özeti oluşturma endpoint'i (Grok ile)
 */
export async function summarizeText(req: Request, res: Response) {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Özetlenecek metin gereklidir" });
    }
    
    // Oturum kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }
    
    // Kullanıcı aboneliğini kontrol et
    const userId = req.session.userId;
    const userSubscription = await storage.getUserSubscription(userId);
    let subscriptionPlan = null;
    
    if (userSubscription) {
      subscriptionPlan = await storage.getSubscriptionPlan(userSubscription.planId);
    }
    
    // Business plan kontrolü - xAI/Grok özellikleri sadece Business planında olsun
    const isBusinessPlan = subscriptionPlan && subscriptionPlan.name === "Business";
    if (!isBusinessPlan) {
      return res.status(403).json({ 
        error: "Grok ile metin özeti oluşturma özelliği sadece Business plan aboneleri için kullanılabilir",
        upgradePlans: await storage.getAllSubscriptionPlans()
      });
    }
    
    // Grok API ile metin özeti oluştur
    const summary = await summarizeWithGrok(text);
    
    res.json({
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      model: "grok-2-1212"
    });
  } catch (error: any) {
    console.error("Grok text summarization error:", error);
    res.status(500).json({ error: error.message || "Metin özeti oluşturulurken bir hata oluştu" });
  }
}

/**
 * Görsel analizi endpoint'i (Grok ile)
 */
export async function analyzeImage(req: Request, res: Response) {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Analiz edilecek görsel (base64 formatında) gereklidir" });
    }
    
    // Oturum kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }
    
    // Kullanıcı aboneliğini kontrol et
    const userId = req.session.userId;
    const userSubscription = await storage.getUserSubscription(userId);
    let subscriptionPlan = null;
    
    if (userSubscription) {
      subscriptionPlan = await storage.getSubscriptionPlan(userSubscription.planId);
    }
    
    // Business plan kontrolü - xAI/Grok özellikleri sadece Business planında olsun
    const isBusinessPlan = subscriptionPlan && subscriptionPlan.name === "Business";
    if (!isBusinessPlan) {
      return res.status(403).json({ 
        error: "Grok ile görsel analizi özelliği sadece Business plan aboneleri için kullanılabilir",
        upgradePlans: await storage.getAllSubscriptionPlans()
      });
    }
    
    // Grok Vision API ile görsel analizi
    const analysis = await analyzeImageWithGrok(imageBase64);
    
    res.json({
      analysis,
      model: "grok-2-vision-1212"
    });
  } catch (error: any) {
    console.error("Grok image analysis error:", error);
    res.status(500).json({ error: error.message || "Görsel analizi yapılırken bir hata oluştu" });
  }
}
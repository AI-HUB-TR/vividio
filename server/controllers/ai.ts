import { Request, Response } from "express";
import { 
  generateScenes, 
  generateImageForScene, 
  simulateVideoProcessing, 
  checkVideoProcessingStatus,
  enhanceSceneContent
} from "../services/ai";
import { storage } from "../storage";
import { insertVideoSchema } from "@shared/schema";

// Sahne oluşturma endpoint'i
export async function generateVideoScenes(req: Request, res: Response) {
  try {
    const { text, sceneCount = 5 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Metin içeriği gereklidir" });
    }
    
    // Kullanıcının günlük kullanım sınırını kontrol et
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }
    
    const userId = req.session.userId;
    
    // Kullanıcı ve plan bilgilerini al
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }
    
    // Günlük kullanımı artır ve kontrol et
    const dailyUsage = await storage.incrementDailyUsage(userId);
    const userSubscription = await storage.getUserSubscription(userId);
    let subscriptionPlan = null;
    
    if (userSubscription) {
      subscriptionPlan = await storage.getSubscriptionPlan(userSubscription.planId);
    }
    
    // Günlük limit kontrolü (ücretsiz kullanıcılar için 2, diğerleri için planlarına göre)
    const dailyLimit = subscriptionPlan?.dailyVideoLimit || 2;
    if (dailyUsage.videosCreated > dailyLimit) {
      return res.status(403).json({ 
        error: "Günlük video oluşturma limitinize ulaştınız", 
        limit: dailyLimit,
        count: dailyUsage.videosCreated 
      });
    }
    
    // AI ile sahneleri oluştur
    const scenes = await generateScenes(text, Math.min(sceneCount, 10));
    
    // Başarılı yanıt
    res.json({ 
      scenes,
      dailyUsage: {
        count: dailyUsage.videosCreated,
        limit: dailyLimit
      }
    });
  } catch (error: any) {
    console.error("Generate scenes error:", error);
    res.status(500).json({ error: error.message || "Sahneler oluşturulurken bir hata oluştu" });
  }
}

// Sahne için görsel oluşturma endpoint'i
export async function generateSceneImage(req: Request, res: Response) {
  try {
    const { description, style = "realistic, cinematic" } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: "Görsel açıklaması gereklidir" });
    }
    
    // Oturum kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }
    
    // AI ile görseli oluştur
    const imageUrl = await generateImageForScene(description, style);
    
    // Başarılı yanıt
    res.json({ imageUrl });
  } catch (error: any) {
    console.error("Generate image error:", error);
    res.status(500).json({ error: error.message || "Görsel oluşturulurken bir hata oluştu" });
  }
}

// Video oluşturma endpoint'i
export async function createVideo(req: Request, res: Response) {
  try {
    const { 
      title, 
      scenes, 
      format = "standard_16_9", 
      resolution = "720p", 
      duration = 60,
      aiModel = "stable_diffusion_xl" 
    } = req.body;
    
    // Gerekli alan kontrolü
    if (!title || !scenes || !scenes.length) {
      return res.status(400).json({ error: "Başlık ve en az bir sahne gereklidir" });
    }
    
    // Oturum kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }
    
    const userId = req.session.userId;
    
    // Kullanıcı aboneliğini kontrol et (özellikle çözünürlük ve süre limitleri için)
    const userSubscription = await storage.getUserSubscription(userId);
    let subscriptionPlan = null;
    
    if (userSubscription) {
      subscriptionPlan = await storage.getSubscriptionPlan(userSubscription.planId);
    }
    
    // Plan limitleri kontrolü
    const maxDuration = subscriptionPlan?.durationLimit || 60; // Varsayılan 1 dakika
    const allowedResolution = subscriptionPlan?.resolution || "720p";
    
    if (duration > maxDuration) {
      return res.status(403).json({ 
        error: `Video süresi, abonelik planınızın izin verdiği maksimum süreyi (${maxDuration} saniye) aşıyor` 
      });
    }
    
    // Gelişmiş çözünürlükler için plan kontrolü
    if ((resolution === "1080p" && allowedResolution === "720p") || 
        (resolution === "4K" && allowedResolution !== "4K")) {
      return res.status(403).json({ 
        error: `${resolution} çözünürlüğü için daha yüksek bir abonelik planı gereklidir` 
      });
    }
    
    // Video işleme simülasyonu
    const videoOptions = { format, resolution, duration, aiModel };
    const processingResult = await simulateVideoProcessing(scenes, videoOptions);
    
    // Yeni video oluştur
    const videoData = {
      userId,
      title,
      originalText: scenes.map((s: any) => s.text_segment || '').join(' '),
      format,
      resolution,
      duration,
      thumbnailUrl: processingResult.thumbnailUrl || null,
      videoUrl: null,
      aiModel,
    };
    
    // Video oluştur
    const video = await storage.createVideo(videoData);
    
    // Video durumunu güncelle (storage.ts içinde tanımlanan doğrudan erişim ile)
    if (video) {
      await storage.updateVideo(video.id, {
        status: "processing" as any
      });
    }
    
    // Başarılı yanıt
    res.json({ 
      message: "Video oluşturma işlemi başlatıldı",
      video,
      processingResult
    });
  } catch (error: any) {
    console.error("Create video error:", error);
    res.status(500).json({ error: error.message || "Video oluşturulurken bir hata oluştu" });
  }
}

// Sahne içeriğini geliştirme endpoint'i
export async function enhanceScenes(req: Request, res: Response) {
  try {
    const { scenes } = req.body;
    
    if (!scenes || !scenes.length) {
      return res.status(400).json({ error: "Sahne listesi gereklidir" });
    }
    
    // Oturum kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }
    
    const userId = req.session.userId;
    
    // Kullanıcı ve plan bilgilerini kontrol et
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }
    
    // Plan kontrolü - Pro ve Business planları sahne geliştirme özelliğine sahip olsun
    const userSubscription = await storage.getUserSubscription(userId);
    let subscriptionPlan = null;
    
    if (userSubscription) {
      subscriptionPlan = await storage.getSubscriptionPlan(userSubscription.planId);
    }
    
    // Eğer kullanıcı ücretsiz plandaysa özellik kullanımını kısıtla
    const isPremium = subscriptionPlan && subscriptionPlan.name !== "Free";
    if (!isPremium) {
      return res.status(403).json({ 
        error: "Sahne içeriği geliştirme özelliği sadece premium aboneler için kullanılabilir",
        upgradePlans: await storage.getAllSubscriptionPlans()
      });
    }
    
    // Groq API ile sahne içeriğini geliştir
    const enhancedScenes = await enhanceSceneContent(scenes);
    
    // Başarılı yanıt
    res.json({ 
      enhancedScenes,
      message: "Sahne içeriği başarıyla geliştirildi"
    });
  } catch (error: any) {
    console.error("Enhance scenes error:", error);
    res.status(500).json({ error: error.message || "Sahne içeriği geliştirilirken bir hata oluştu" });
  }
}

// Video işleme durumunu kontrol etme endpoint'i
export async function checkVideoStatus(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({ error: "Video ID gereklidir" });
    }
    
    // Oturum kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }
    
    const userId = req.session.userId;
    
    // Video varlığını kontrol et
    const video = await storage.getVideo(parseInt(videoId));
    
    if (!video) {
      return res.status(404).json({ error: "Video bulunamadı" });
    }
    
    // Kullanıcı sahipliğini kontrol et
    if (video.userId !== userId) {
      return res.status(403).json({ error: "Bu videoyu görüntüleme yetkiniz yok" });
    }
    
    // İşleme durumunu kontrol et
    const status = await checkVideoProcessingStatus(videoId);
    
    // Video durumunu güncelle (tamamlandıysa)
    if (status.status === "completed" && video.status !== "completed") {
      await storage.updateVideo(parseInt(videoId), {
        status: "completed" as any,
        videoUrl: `https://example.com/videos/${videoId}.mp4`, // Simüle edilmiş URL
      });
    }
    
    // Güncel video bilgilerini al
    const updatedVideo = await storage.getVideo(parseInt(videoId));
    
    // Başarılı yanıt
    res.json({ 
      video: updatedVideo,
      processingStatus: status
    });
  } catch (error: any) {
    console.error("Check status error:", error);
    res.status(500).json({ error: error.message || "Durum kontrolü sırasında bir hata oluştu" });
  }
}
import { Request, Response } from 'express';
import { storage } from '../storage';
import { isAdmin } from './admin';

/**
 * Tüm API yapılandırmalarını getir
 */
export async function getAllApiConfigs(req: Request, res: Response) {
  try {
    // Oturum kontrolü ve admin yetkisi kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekiyor" });
    }

    const configs = await storage.getAllApiConfigs();
    
    // Hassas bilgileri gizleyerek döndür
    const safeConfigs = configs.map(config => {
      // API anahtarlarını gizleyerek gönder - sadece ilk 4 karakteri göster
      if (config.name.includes('API_KEY') || config.name.includes('ACCESS_KEY')) {
        let maskedValue = '';
        if (config.value && config.value.length > 0) {
          // İlk 4 karakter göster, kalanı gizle
          maskedValue = config.value.substring(0, 4) + '********************';
        }
        return {
          ...config,
          value: maskedValue
        };
      }
      return config;
    });
    
    res.json(safeConfigs);
  } catch (error: any) {
    console.error('Get API configs error:', error);
    res.status(500).json({ error: error.message || "API yapılandırmaları alınırken bir hata oluştu" });
  }
}

/**
 * API yapılandırmasını güncelle
 */
export async function updateApiConfig(req: Request, res: Response) {
  try {
    const { name, value } = req.body;
    
    if (!name || value === undefined) {
      return res.status(400).json({ error: "Yapılandırma adı ve değeri gereklidir" });
    }
    
    // Oturum kontrolü ve admin yetkisi kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekiyor" });
    }
    
    // İsme göre yapılandırmayı güncelle
    const updatedConfig = await storage.updateApiConfigByName(name, value);
    
    if (!updatedConfig) {
      return res.status(404).json({ error: `"${name}" adlı yapılandırma bulunamadı` });
    }
    
    // API ile ilgili çevre değişkenlerini güncelle (runtime sırasında)
    if (name.includes('API_KEY') || name.includes('ACCESS_KEY')) {
      // Runtime çevre değişkenini güncelle
      process.env[name] = value;
    }
    
    res.json({ 
      message: `"${name}" yapılandırması başarıyla güncellendi`,
      updatedAt: updatedConfig.updatedAt
    });
  } catch (error: any) {
    console.error('Update API config error:', error);
    res.status(500).json({ error: error.message || "API yapılandırması güncellenirken bir hata oluştu" });
  }
}

/**
 * API yapılandırmasını adına göre getir
 */
export async function getApiConfigByName(req: Request, res: Response) {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: "Yapılandırma adı gereklidir" });
    }
    
    // Oturum kontrolü ve admin yetkisi kontrolü
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekiyor" });
    }
    
    const config = await storage.getApiConfig(name);
    
    if (!config) {
      return res.status(404).json({ error: `"${name}" adlı yapılandırma bulunamadı` });
    }
    
    let responseConfig = config;
    
    // API anahtarlarını gizle
    if (config.name.includes('API_KEY') || config.name.includes('ACCESS_KEY')) {
      let maskedValue = '';
      if (config.value && config.value.length > 0) {
        maskedValue = config.value.substring(0, 4) + '********************';
      }
      responseConfig = {
        ...config,
        value: maskedValue
      };
    }
    
    res.json(responseConfig);
  } catch (error: any) {
    console.error('Get API config error:', error);
    res.status(500).json({ error: error.message || "API yapılandırması alınırken bir hata oluştu" });
  }
}
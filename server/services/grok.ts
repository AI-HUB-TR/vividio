import OpenAI from "openai";
import { storage } from "../storage";

// xAI API için OpenAI uyumlu istemci
// Admin panelinden yapılandırılabilir
async function getXaiClient() {
  try {
    // API anahtarını ve etkinlik durumunu yönetim panelinden al
    const apiKeyConfig = await storage.getApiConfig("XAI_API_KEY");
    const isEnabledConfig = await storage.getApiConfig("GROK_ENABLED");
    
    // API'nin etkin olup olmadığını kontrol et
    const isEnabled = isEnabledConfig?.value === "true";
    
    if (!isEnabled) {
      throw new Error("Grok (xAI) API entegrasyonu yönetim panelinden devre dışı bırakılmış");
    }
    
    // API anahtarını kontrol et
    const apiKey = apiKeyConfig?.value || process.env.XAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Grok (xAI) API anahtarı ayarlanmamış");
    }
    
    // xAI istemcisi oluştur
    return new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: apiKey
    });
  } catch (error) {
    console.error("xAI istemcisi oluşturma hatası:", error);
    throw error;
  }
}

/**
 * Metin özetleme için Grok modeli kullanımı
 * @param text Özetlenecek metin
 * @returns Özetlenmiş metin
 */
export async function summarizeWithGrok(text: string): Promise<string> {
  try {
    const xai = await getXaiClient();
    const prompt = `Lütfen aşağıdaki metni kısa ve öz bir şekilde özetle, ana noktaları koruyarak:\n\n${text}`;

    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    return response.choices[0].message.content || "Özet oluşturulamadı.";
  } catch (error: any) {
    console.error("Grok özet hatası:", error);
    throw new Error(`Metin özeti oluşturulamadı: ${error.message}`);
  }
}

/**
 * Görsel içeriği analiz etmek için Grok-Vision modeli kullanımı
 * @param base64Image Base64 formatında görsel
 * @returns Görsel analizi sonucu
 */
export async function analyzeImageWithGrok(base64Image: string): Promise<string> {
  try {
    const xai = await getXaiClient();
    const response = await xai.chat.completions.create({
      model: "grok-2-vision-1212",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Bu görseli ayrıntılı olarak analiz et ve temel öğelerini, içeriğini ve dikkat çeken yönlerini açıkla."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Görsel analizi yapılamadı.";
  } catch (error: any) {
    console.error("Grok görsel analiz hatası:", error);
    throw new Error(`Görsel analizi yapılamadı: ${error.message}`);
  }
}

/**
 * Video sahne içeriği geliştirme için Grok modeli kullanımı
 * @param scenes Video sahneleri
 * @returns Geliştirilmiş sahne içerikleri
 */
export async function enhanceScenesWithGrok(scenes: any[]): Promise<any[]> {
  try {
    const enhancedScenes = [];

    for (const scene of scenes) {
      try {
        const xai = await getXaiClient();
        
        // Sahnenin görsel tanımını ve metin parçasını al
        const visualDesc = scene.visual_description || "";
        const textSegment = scene.text_segment || "";

        // Grok ile sahne içeriğini zenginleştirme
        const prompt = `
        Bu video sahnesi için yüksek kaliteli bir görsel açıklama oluştur. Sahnenin daha canlı, etkileyici ve görsel olarak zengin bir versiyonunu yaz.
        
        Orijinal görsel açıklama: "${visualDesc}"
        
        İlgili metin: "${textSegment}"
        
        Yeni görsel açıklama şunları içermeli:
        1. Görsel öğelerin detaylı açıklaması
        2. Renkler, ışık, perspektif gibi görsel öğeler
        3. Sahnenin duygusal veya dramatik etkisi
        
        Yanıtını 100-150 kelime ile sınırla.
        `;

        const response = await xai.chat.completions.create({
          model: "grok-2-1212",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        // Geliştirilmiş sahneyi oluştur
        enhancedScenes.push({
          ...scene,
          enhanced_description: response.choices[0].message.content || visualDesc
        });
      } catch (sceneError) {
        console.warn("Sahne geliştirme hatası, orijinal sahneyi koruyoruz:", sceneError);
        // Hata durumunda orijinal sahneyi değiştirmeden ekle
        enhancedScenes.push({ ...scene });
      }
    }

    return enhancedScenes;
  } catch (error: any) {
    console.error("Grok sahne geliştirme hatası:", error);
    throw new Error(`Sahne içeriği geliştirilemedi: ${error.message}`);
  }
}
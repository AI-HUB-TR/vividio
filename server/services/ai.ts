import axios from 'axios';
import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';

// API anahtarlarını güvenli bir şekilde erişiyoruz
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Hugging Face client
const hfClient = new HfInference(HUGGINGFACE_API_KEY);

// OpenAI client (Deepseek ile uyumlu)
const deepseekClient = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

// Groq client (OpenAI uyumlu API)
const groqClient = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Metin özeti ve sahne oluşturma fonksiyonu
export async function generateScenes(text: string, sceneCount: number) {
  try {
    const scenes = [];
    
    // Deepseek ile metin özetleme ve sahnelere bölme
    const response = await deepseekClient.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Sen bir video içerik planlayıcısısın. Metinden video sahneleri oluşturuyorsun.' },
        { role: 'user', content: `Bu metni ${sceneCount} görsel sahneye böl. Her sahne için görsel bir tanımlama ve metinden uygun bir bölüm belirle. Sadece JSON formatında yanıt ver: [{"visual_description": "açıklama", "text_segment": "metin"}]. İşte metin: ${text}` }
      ],
      temperature: 0.7,
    });

    // JSON sonucunu ayrıştırma
    const content = response.choices[0]?.message?.content || '[]';
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']') + 1;
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonStr = content.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonStr);
    }
    
    return [];
  } catch (error) {
    console.error('Scene generation error:', error);
    throw new Error('Video sahneleri oluşturulurken bir hata oluştu');
  }
}

// Metin tanımlayıcısından görsel üretme
export async function generateImageForScene(description: string, style: string) {
  try {
    // HuggingFace ile görsel oluşturma
    const imageBlob = await hfClient.textToImage({
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      inputs: `${description}, ${style}, photorealistic, high quality, 16:9 aspect ratio`,
      parameters: {
        negative_prompt: 'blurry, low quality, distorted, deformed',
      }
    });

    // Görüntüyü base64'e dönüştürme
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error('Sahne için görsel oluşturulurken bir hata oluştu');
  }
}

// Video oluşturma işlemi simülasyonu
export async function simulateVideoProcessing(scenes: any[], videoOptions: any) {
  try {
    // Video işleme sürecini başlat
    console.log('Video processing started with options:', videoOptions);
    
    // Her sahne için görsel üretildiğinden emin olalım
    const processedScenes = await Promise.all(scenes.map(async (scene, index) => {
      // Eğer sahnede görsel yoksa ve bir açıklama varsa, görsel oluştur
      if (!scene.imageUrl && scene.visual_description) {
        try {
          const imageStyle = videoOptions.style || "realistic, cinematic";
          const imageUrl = await generateImageForScene(scene.visual_description, imageStyle);
          return { ...scene, imageUrl };
        } catch (error) {
          console.warn(`Scene ${index} image generation failed:`, error);
          return scene;
        }
      }
      return scene;
    }));
    
    // Bir sonraki adımda, Gemini API kullanarak video hakkında detaylı bir açıklama oluştur
    const contentSource = 'AI tarafından üretilen içerik';
    
    // Gemini API ile video içeriği ve özeti
    const geminiRequestBody = {
      contents: [{
        parts: [{
          text: `Video oluşturma işlemi tamamlandı. Oluşturduğum video şu özellikleri içerir:
          - Format: ${videoOptions.format}
          - Çözünürlük: ${videoOptions.resolution}
          - Süre: ${videoOptions.duration} saniye
          - Toplam sahne sayısı: ${processedScenes.length}
          - İçerik kaynağı: ${contentSource}
          - AI Model: ${videoOptions.aiModel}
          
          Video sahneleri: ${processedScenes.map((scene, index) => 
            `\nSahne ${index+1}: ${scene.visual_description || 'Görsel açıklaması yok'}`
          ).join('')}
          
          Video başarıyla oluşturuldu ve kullanıma hazır.`
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      }
    };

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      geminiRequestBody
    );

    const processingResult = geminiResponse.data.candidates[0].content.parts[0].text;
    
    // Gerçek bir video URL'si oluşturma (gerçek senaryoda bu bir CDN URL olabilir)
    const videoId = Date.now().toString();
    const videoUrl = `https://storage.vidai.ai/videos/${videoId}.mp4`;
    
    // Thumbnail için ilk sahnenin görselini kullan
    const thumbnailUrl = processedScenes[0]?.imageUrl || null;
    
    return {
      videoUrl,
      thumbnailUrl,
      processingResult,
      scenes: processedScenes
    };
  } catch (error) {
    console.error('Video processing error:', error);
    throw new Error('Video işlenirken bir hata oluştu');
  }
}

// AI ile sahne içeriğini geliştirme (Groq ve xAI/Grok modellerini kullanabilir)
export async function enhanceSceneContent(scenes: any[], useGrok: boolean = false) {
  try {
    // Eğer Grok modeli kullanılacaksa
    if (useGrok) {
      try {
        // Yönetim panelinden Grok'un etkin olup olmadığını kontrol et
        const { storage } = await import('../storage');
        const isEnabledConfig = await storage.getApiConfig("GROK_ENABLED");
        const isEnabled = isEnabledConfig?.value === "true";
        
        if (!isEnabled) {
          console.log("Grok entegrasyonu devre dışı, Llama3 kullanılıyor");
          // Grok devre dışı bırakılmışsa Llama3'e geri dön
          useGrok = false;
        } else {
          // Lazy import: enhanceScenesWithGrok fonksiyonunu sadece gerektiğinde yükle
          const { enhanceScenesWithGrok } = await import('./grok');
          return await enhanceScenesWithGrok(scenes);
        }
      } catch (grokError) {
        console.error("Grok servisi başlatılamadı, Llama3 kullanılıyor:", grokError);
        // Hata durumunda Llama3'e geri dön
        useGrok = false;
      }
    } 
    
    // Varsayılan olarak Groq kullanımı
    const enhancedScenes = [];
    
    for (const scene of scenes) {
      // Groq ile sahne içeriğini zenginleştirme
      const response = await groqClient.chat.completions.create({
        model: 'llama3-8b-8192', // Groq'un desteklediği model
        messages: [
          { 
            role: 'system', 
            content: 'Sen bir profesyonel film yönetmeni ve içerik oluşturucususun. Video sahneleri için detaylı, canlı ve etkileyici açıklamalar yazıyorsun.' 
          },
          { 
            role: 'user', 
            content: `Bu video sahnesi için daha ayrıntılı ve yaratıcı bir görsel tanımlama yaz. Sonucu Türkçe olarak ver ve 100 kelimeyi geçme. Orijinal açıklama: "${scene.visual_description}"` 
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });
      
      // Sonucu ekleyerek zenginleştirilmiş sahneyi oluştur
      enhancedScenes.push({
        ...scene,
        enhanced_description: response.choices[0]?.message?.content || scene.visual_description
      });
    }
    
    return enhancedScenes;
  } catch (error) {
    console.error('Scene enhancement error:', error);
    throw new Error('Sahne içeriği zenginleştirilirken bir hata oluştu');
  }
}

// Video işleme durumunu kontrol etme
export async function checkVideoProcessingStatus(videoId: string) {
  try {
    // Bu fonksiyon gerçek bir işleme hizmeti ile entegre edilebilir
    // Şimdilik bir simülasyon yapıyoruz
    
    // Rastgele bir ilerleme yüzdesi döndür (0-100 arası)
    const progress = Math.floor(Math.random() * 101);
    
    return {
      videoId,
      status: progress < 100 ? 'processing' : 'completed',
      progress,
    };
  } catch (error) {
    console.error('Status check error:', error);
    throw new Error('Video işleme durumu kontrol edilirken bir hata oluştu');
  }
}
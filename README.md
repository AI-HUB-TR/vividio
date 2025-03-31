# VidAI - AI Video Oluşturma Platformu

VidAI, metin tabanlı girişlerden video oluşturabilen, tamamen Türkçe, kullanımı kolay ve güçlü özelliklere sahip bir AI video oluşturma platformudur.

## Özellikler

- 🎬 **Metin-Video Dönüşümü**: Metninizi birkaç tıklama ile profesyonel videolara dönüştürün
- 🧠 **Yapay Zeka Teknolojileri**: Hugging Face, DeepSeek ve Google Gemini API'leri ile güçlendirilmiş
- 👥 **Kullanıcı Yönetimi**: Tam kapsamlı kayıt ve oturum açma sistemi
- 💰 **Abonelik Planları**: Ücretsiz, Pro ve İş olmak üzere farklı kullanıcı ihtiyaçlarına yönelik çeşitli planlar
- 🛠️ **Admin Panel**: Kapsamlı yönetim ve analitik özellikleri
- 📊 **Detaylı Analizler**: Video ve kullanıcı metrikleri
- 🔒 **Güvenli Oturum**: Firebase ile sosyal medya üzerinden giriş seçenekleri

## Teknik Altyapı

- **Frontend**: React, TailwindCSS, Shadcn/UI
- **Backend**: Express, Node.js
- **Veritabanı**: PostgreSQL (şu anda MemStorage kullanılıyor)
- **AI Servisleri**: 
  - Hugging Face (Görsel Oluşturma)
  - DeepSeek (Metin İşleme)
  - Google Gemini (Video İşleme)
- **Kimlik Doğrulama**: Firebase Kimlik Doğrulama

## Başlarken

### Gereksinimler

- Node.js v18 veya üzeri
- npm veya yarn
- API anahtarları:
  - HUGGINGFACE_API_KEY
  - DEEPSEEK_API_KEY
  - GEMINI_API_KEY
  - Firebase yapılandırması (VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID, VITE_FIREBASE_PROJECT_ID)

### Kurulum

1. Repo'yu klonlayın
```
git clone https://github.com/kullaniciadi/vidai.git
cd vidai
```

2. Bağımlılıkları yükleyin
```
npm install
```

3. `.env` dosyasını oluşturun ve gerekli API anahtarlarını ekleyin

4. Uygulamayı başlatın
```
npm run dev
```

## Abonelik Planları

| Özellik | Ücretsiz | Pro | İş |
|---------|----------|-----|-----|
| Günlük Video Limiti | 2 | 10 | Sınırsız |
| Video Süresi | 60 sn | 5 dk | 20 dk |
| Çözünürlük | 720p | 1080p | 4K |
| Filigran | Var | Yok | Yok |
| Özel AI Modelleri | Hayır | Evet | Evet |
| Fiyat (Aylık) | Ücretsiz | 199₺ | 499₺ |

## API Endpoint'leri

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Oturum açma
- `POST /api/auth/social-login` - Sosyal medya ile oturum açma
- `POST /api/auth/logout` - Oturumu kapatma
- `GET /api/auth/me` - Mevcut kullanıcı bilgilerini alma

### Video İşlemleri
- `GET /api/videos` - Kullanıcı videolarını listeleme
- `GET /api/videos/:id` - Belirli bir videoyu görüntüleme
- `POST /api/videos` - Yeni video oluşturma
- `DELETE /api/videos/:id` - Video silme

### Abonelik
- `GET /api/subscription-plans` - Abonelik planlarını listeleme
- `GET /api/user/subscription` - Kullanıcı abonelik bilgilerini alma
- `POST /api/user/subscription/upgrade` - Abonelik yükseltme
- `POST /api/user/subscription/cancel` - Abonelik iptal etme

### AI İşlemleri
- `POST /api/ai/generate-scenes` - Metinden sahneler oluşturma
- `POST /api/ai/generate-image` - Sahne için görsel oluşturma
- `POST /api/ai/create-video` - Video oluşturma
- `GET /api/ai/video-status/:videoId` - Video durumunu kontrol etme

### Admin
- `GET /api/admin/stats` - Dashboard istatistikleri
- `GET /api/admin/users` - Tüm kullanıcıları listeleme
- `GET /api/admin/videos` - Tüm videoları listeleme
- `PUT /api/admin/users/:id/role` - Kullanıcı rolünü güncelleme
- `POST /api/admin/users/:id/ban` - Kullanıcıyı engelleme

## Ekran Görüntüleri

[Ekran görüntüleri burada yer alacak]

## Yol Haritası

- [ ] Veritabanı entegrasyonu (PostgreSQL)
- [ ] Sosyal medya entegrasyonları
- [ ] Daha gelişmiş analitikler
- [ ] Daha fazla dil desteği
- [ ] Özelleştirilebilir şablonlar
- [ ] Mobil uygulama

## Katkıda Bulunma

Katkıda bulunmak istiyorsanız, lütfen önce bir issue açarak değişikliği tartışmak için bizimle iletişime geçin.

## Lisans

[Lisans bilgisi burada yer alacak]

## İletişim

[İletişim bilgileri burada yer alacak]
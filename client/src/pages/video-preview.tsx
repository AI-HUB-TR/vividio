import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { 
  fetchVideoById, 
  updateVideoStatus, 
  deleteVideo 
} from "@/store/slices/videoSlice";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Edit,
  Trash,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ImageIcon,
  Video
} from "lucide-react";

const VideoPreview = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Videoyu Redux store'dan alma
  const { currentVideo, loading, error } = useSelector((state: RootState) => state.video);
  
  // Video oynatıcı durumları
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [activeTab, setActiveTab] = useState("preview");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  
  // Sahne listesini ayrıştırma
  const [scenes, setScenes] = useState<any[]>([]);
  
  // URL'den video ID'sini alma
  const videoId = parseInt(window.location.pathname.split("/").pop() || "0");
  
  // Video yükleme
  useEffect(() => {
    if (videoId) {
      dispatch(fetchVideoById(videoId) as any);
    }
    
    return () => {
      // Temizlik işlemleri
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [videoId, dispatch]);
  
  // Video bilgilerini güncelleme
  useEffect(() => {
    if (currentVideo) {
      setEditedTitle(currentVideo.title);
      
      try {
        // Sahneleri videodaki JSON verisinden ayrıştırma
        if (currentVideo.sections && typeof currentVideo.sections === 'string') {
          const parsedScenes = JSON.parse(currentVideo.sections);
          setScenes(Array.isArray(parsedScenes) ? parsedScenes : []);
        } else if (currentVideo.sections) {
          setScenes(Array.isArray(currentVideo.sections) ? currentVideo.sections : []);
        }
      } catch (e) {
        console.error("Sahne ayrıştırma hatası:", e);
        setScenes([]);
      }
      
      // Video işlenmesi devam ediyorsa, durumu periyodik olarak kontrol et
      if (currentVideo.status === "processing") {
        startStatusPolling(videoId);
      }
    }
  }, [currentVideo]);
  
  // Video oynatıcı olayları
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    // Olay dinleyicileri ekle
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('ended', handleEnded);
    
    // Ses seviyesini ayarla
    videoElement.volume = volume;
    videoElement.muted = isMuted;
    
    // Temizlik
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [videoRef, volume, isMuted]);
  
  // Video durum kontrolü için periyodik sorgu başlatma
  const startStatusPolling = (videoId: number) => {
    // Önceki interval varsa temizle
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Her 5 saniyede bir durumu kontrol et
    const interval = setInterval(async () => {
      try {
        const res = await apiRequest("GET", `/api/ai/video-status/${videoId}`);
        if (res.ok) {
          const data = await res.json();
          
          // Video durumu tamamlandı ise
          if (data.processingStatus.status === "completed") {
            // Redux store'da videoyu güncelle
            dispatch(updateVideoStatus({
              id: videoId,
              status: "completed",
              videoUrl: data.video.videoUrl,
              thumbnailUrl: data.video.thumbnailUrl
            }));
            
            // İşlemi durdur
            clearInterval(interval);
            setPollingInterval(null);
            
            // Bildirim göster
            toast({
              title: "Video işleme tamamlandı",
              description: "Videonuz başarıyla işlendi ve oynatmaya hazır",
            });
          }
        }
      } catch (error) {
        console.error("Video durum kontrolü hatası:", error);
      }
    }, 5000);
    
    setPollingInterval(interval);
  };
  
  // Video oynatma kontrolü
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Ses kontrolü
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  // Ses seviyesi ayarı
  const handleVolumeChange = (value: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = value;
    setVolume(value);
    
    if (value === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  // Video zaman çizgisi kontrolü
  const handleTimelineChange = (value: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };
  
  // 5 saniye ileri/geri
  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
  };
  
  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
  };
  
  // Videonun belirli bir sahnesine atlama
  const jumpToScene = (scene: any) => {
    if (!videoRef.current || typeof scene.startTime !== 'number') return;
    
    videoRef.current.currentTime = scene.startTime;
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };
  
  // Video indirme
  const downloadVideo = () => {
    if (!currentVideo?.videoUrl) return;
    
    const link = document.createElement('a');
    link.href = currentVideo.videoUrl;
    link.download = `${currentVideo.title || 'video'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Video silme
  const handleDeleteVideo = async () => {
    if (!currentVideo) return;
    
    try {
      await dispatch(deleteVideo(currentVideo.id) as any);
      
      toast({
        title: "Video silindi",
        description: "Video başarıyla silindi",
      });
      
      // Kullanıcıyı dashboard'a yönlendir
      navigate("/dashboard");
    } catch (error) {
      console.error("Video silme hatası:", error);
      toast({
        title: "Hata",
        description: "Video silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };
  
  // Video başlığını güncelleme
  const updateVideoTitle = async () => {
    if (!currentVideo || !editedTitle.trim()) return;
    
    try {
      const res = await apiRequest("PUT", `/api/videos/${currentVideo.id}`, {
        title: editedTitle
      });
      
      if (res.ok) {
        // Video bilgilerini yeniden yükle
        dispatch(fetchVideoById(currentVideo.id) as any);
        
        toast({
          title: "Başlık güncellendi",
          description: "Video başlığı başarıyla güncellendi",
        });
        
        setEditMode(false);
      } else {
        throw new Error("Başlık güncellenirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Başlık güncelleme hatası:", error);
      toast({
        title: "Hata",
        description: "Başlık güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };
  
  // Zaman biçimlendirme fonksiyonu
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Video işleniyor durumu
  const renderProcessingState = () => (
    <div className="flex flex-col items-center text-center py-8">
      <div className="relative mb-4">
        {currentVideo?.thumbnailUrl ? (
          <img 
            src={currentVideo.thumbnailUrl} 
            alt={currentVideo.title}
            className="w-full max-w-lg h-auto rounded-lg shadow-md"
          />
        ) : (
          <div className="w-full max-w-lg aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
            <Video className="h-20 w-20 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
          <div className="text-white flex flex-col items-center space-y-3">
            <RefreshCw className="h-12 w-12 animate-spin" />
            <h3 className="text-xl font-semibold">Video İşleniyor</h3>
            <p className="text-sm max-w-xs">Bu işlem videoların uzunluğuna bağlı olarak birkaç dakika sürebilir.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-2 max-w-md">
        <h3 className="text-lg font-semibold">{currentVideo?.title}</h3>
        <p className="text-sm text-gray-500">Video işlendikten sonra otomatik olarak güncellenecektir.</p>
      </div>
    </div>
  );
  
  // Hata durumu
  const renderErrorState = () => (
    <div className="flex flex-col items-center text-center py-8">
      <XCircle className="h-16 w-16 text-red-500 mb-4" />
      <h3 className="text-xl font-semibold">İşlem Sırasında Hata Oluştu</h3>
      <p className="text-sm text-gray-500 mt-2 max-w-sm">{error || "Video işlenirken beklenmeyen bir hata oluştu."}</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Dashboard'a Dön
      </Button>
    </div>
  );
  
  if (loading && !currentVideo) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        <Card>
          <CardContent className="p-6">
            <Skeleton className="w-full aspect-video rounded-md mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-14" />
                <Skeleton className="h-10 w-14" />
                <Skeleton className="h-10 w-14" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error && !currentVideo) {
    return renderErrorState();
  }
  
  if (!currentVideo) {
    return (
      <div className="container py-8 text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Video Bulunamadı</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          İstediğiniz video bulunamadı veya erişim izniniz yok.
        </p>
        <Button onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard'a Dön
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {!editMode ? (
              currentVideo.title
            ) : (
              <Input 
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="max-w-md" 
              />
            )}
            
            {!editMode ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setEditMode(true)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2 ml-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setEditedTitle(currentVideo.title);
                    setEditMode(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  İptal
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={updateVideoTitle}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Kaydet
                </Button>
              </div>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(currentVideo.createdAt).toLocaleDateString('tr-TR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            {' • '}
            {currentVideo.resolution}
            {' • '}
            {formatTime(currentVideo.duration)}
          </p>
        </div>
        
        <div className="flex gap-2 self-end lg:self-auto">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Videoyu silmek istediğinize emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Video kalıcı olarak silinecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteVideo} className="bg-red-500 hover:bg-red-600">
                  Videoyu Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="preview">Video Önizleme</TabsTrigger>
          <TabsTrigger value="scenes">Sahneler ({scenes.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview">
          <Card>
            <CardContent className="p-6">
              {currentVideo.status === "processing" ? (
                renderProcessingState()
              ) : (
                <>
                  {currentVideo.videoUrl ? (
                    <div className="space-y-4">
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          src={currentVideo.videoUrl}
                          className="w-full h-full"
                          poster={currentVideo.thumbnailUrl || undefined}
                          onClick={togglePlay}
                        />
                        
                        {/* Oynatma kontrolü overlay */}
                        {!isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={togglePlay}>
                            <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
                              <Play className="h-12 w-12 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Video kontrolleri */}
                      <div className="space-y-2">
                        {/* Zaman çizgisi */}
                        <div className="relative">
                          <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => handleTimelineChange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 pt-1">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>
                        
                        {/* Oynatma kontrolleri */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={skipBackward}>
                              <SkipBack className="h-5 w-5" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-full" 
                              onClick={togglePlay}
                            >
                              {isPlaying ? (
                                <Pause className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5" />
                              )}
                            </Button>
                            
                            <Button variant="ghost" size="icon" onClick={skipForward}>
                              <SkipForward className="h-5 w-5" />
                            </Button>
                          </div>
                          
                          {/* Ses kontrolü */}
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={toggleMute}>
                              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </Button>
                            
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.1}
                              value={isMuted ? 0 : volume}
                              onChange={(e) => handleVolumeChange(Number(e.target.value))}
                              className="w-24 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                          
                          {/* İndirme butonu */}
                          <Button variant="outline" onClick={downloadVideo}>
                            <Download className="h-4 w-4 mr-2" />
                            İndir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                      <AlertCircle className="h-12 w-12 text-yellow-500" />
                      <div className="text-center">
                        <h3 className="text-lg font-medium">Video dosyası bulunamadı</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Bu video için oynatılabilir bir dosya bulunamadı.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Dashboard'a Dön
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Video detayları */}
          {currentVideo.status === "completed" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Video Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Orijinal Metin</h3>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                      {currentVideo.originalText}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Format</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {currentVideo.format === "standard_16_9" ? "Standart (16:9)" : 
                         currentVideo.format === "youtube_shorts" ? "YouTube Shorts (9:16)" :
                         currentVideo.format === "tiktok" ? "TikTok (9:16)" : 
                         currentVideo.format === "instagram" ? "Instagram (1:1)" : 
                         currentVideo.format}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Çözünürlük</h3>
                      <p className="mt-1 text-sm text-gray-600">{currentVideo.resolution}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Süre</h3>
                      <p className="mt-1 text-sm text-gray-600">{formatTime(currentVideo.duration)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">AI Model</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {currentVideo.aiModel === "stable_diffusion_xl" ? "Stable Diffusion XL" :
                         currentVideo.aiModel === "llama_3" ? "Llama 3" :
                         currentVideo.aiModel === "coqui_tts" ? "Coqui TTS" :
                         currentVideo.aiModel || "Varsayılan Model"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="scenes">
          <Card>
            <CardHeader>
              <CardTitle>Video Sahneleri</CardTitle>
              <CardDescription>
                Videonun içerdiği tüm sahneleri görüntüleyin ve düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scenes.length > 0 ? (
                <div className="space-y-6">
                  {scenes.map((scene, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/3 bg-gray-100">
                          {scene.imageUrl ? (
                            <img 
                              src={scene.imageUrl} 
                              alt={`Sahne ${index + 1}`}
                              className="w-full h-full object-cover aspect-video"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[200px] flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 w-full md:w-2/3">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">Sahne {index + 1}</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => jumpToScene(scene)}
                              disabled={currentVideo.status !== "completed"}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Bu sahneye git
                            </Button>
                          </div>
                          
                          <div className="mt-2 space-y-3">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Görsel Açıklama</h4>
                              <p className="text-sm mt-1">
                                {scene.enhanced_description || scene.visual_description || "Açıklama yok"}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Metin</h4>
                              <p className="text-sm mt-1">
                                {scene.text_segment || "Metin yok"}
                              </p>
                            </div>
                            
                            {typeof scene.startTime === 'number' && typeof scene.endTime === 'number' && (
                              <div className="text-xs text-gray-500">
                                Zaman: {formatTime(scene.startTime)} - {formatTime(scene.endTime)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex rounded-full bg-yellow-100 p-3">
                    <div className="rounded-full bg-yellow-200 p-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Sahne bulunamadı</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    Bu video için sahne bilgisi bulunmuyor. Bu, videonun eski bir versiyonda oluşturulmuş olabileceği anlamına gelir.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoPreview;
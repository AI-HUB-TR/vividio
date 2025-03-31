import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { createVideo } from "@/store/slices/videoSlice";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  AlertCircle, 
  Video, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  RefreshCw, 
  CheckCircle, 
  Trash, 
  ArrowUpDown,
  MoveRight 
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const videoSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır").max(100, "Başlık en fazla 100 karakter olabilir"),
  originalText: z.string().min(10, "Metin en az 10 karakter olmalıdır"),
  format: z.string().min(1, "Bir video formatı seçmelisiniz"),
  duration: z.number().min(10, "Süre en az 10 saniye olmalıdır"),
  resolution: z.string().min(1, "Bir çözünürlük seçmelisiniz"),
  aiModel: z.string().optional(),
});

type VideoFormValues = z.infer<typeof videoSchema>;

export default function VideoEditor() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { loading, error } = useSelector((state: RootState) => state.video);
  const { plan } = useSelector((state: RootState) => state.auth);
  
  // Calculate text length and estimated duration
  const [textStats, setTextStats] = useState({
    chars: 0,
    words: 0,
    estimatedDuration: 0,
  });
  
  // Sahne oluşturma ve ön izleme durumları
  const [scenes, setScenes] = useState<any[]>([]);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [enhancingScenes, setEnhancingScenes] = useState(false);
  const [useGrokModel, setUseGrokModel] = useState(false);
  
  const maxDuration = plan ? plan.durationLimit : 60; // Default to 60 seconds if no plan
  
  // Form initialization
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      originalText: "",
      format: "standard_16_9", // Default format
      duration: 60, // Default duration in seconds
      resolution: plan?.resolution || "720p", // Use plan resolution or default to 720p
      aiModel: "stable_diffusion_xl", // Default AI model
    },
  });
  
  // Watch text changes to calculate stats
  const originalText = useWatch({
    control: form.control,
    name: "originalText",
  });
  
  // Update text stats when content changes
  useEffect(() => {
    if (originalText) {
      const words = originalText.trim().split(/\s+/).length;
      const chars = originalText.length;
      // Rough estimate: average person speaks about 150 words per minute
      const estimatedDuration = Math.round(words / 150 * 60);
      
      setTextStats({
        chars,
        words,
        estimatedDuration,
      });
      
      // Update duration in form
      form.setValue("duration", Math.min(estimatedDuration, maxDuration));
    } else {
      setTextStats({
        chars: 0,
        words: 0,
        estimatedDuration: 0,
      });
    }
  }, [originalText, form, maxDuration]);
  
  // Video sahnelerini oluştur
  const generateScenes = async () => {
    try {
      setIsGeneratingScenes(true);
      setSceneError(null);
      
      const text = form.getValues('originalText');
      
      if (!text || text.trim().length < 10) {
        toast({
          title: "Yetersiz metin",
          description: "Sahneler oluşturmak için en az 10 karakter içeren bir metin giriniz.",
          variant: "destructive",
        });
        return;
      }
      
      const sceneCount = Math.max(3, Math.min(10, Math.ceil(text.length / 500)));
      
      const response = await apiRequest("POST", "/api/ai/generate-scenes", {
        text,
        sceneCount
      });
      
      if (!response.ok) {
        throw new Error("Sahneler oluşturulurken bir hata oluştu.");
      }
      
      const data = await response.json();
      setScenes(data.scenes);
      
      toast({
        title: "Sahneler oluşturuldu",
        description: `${data.scenes.length} sahne başarıyla oluşturuldu.`,
      });
      
      // Otomatik olarak sahne önizleme sekmesine geç
      setActiveTab('preview');
      
    } catch (err) {
      console.error("Error generating scenes:", err);
      setSceneError("Sahneler oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      
      toast({
        title: "Hata",
        description: "Sahneler oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScenes(false);
    }
  };
  
  // Sahne için görsel oluştur
  const generateImageForScene = async (sceneIndex: number) => {
    try {
      if (!scenes[sceneIndex]) return;
      
      setIsGeneratingImage(sceneIndex);
      
      const visualDescription = scenes[sceneIndex].visual_description;
      const enhancedDescription = scenes[sceneIndex].enhanced_description || visualDescription;
      
      // Görsel stili seç
      let style = "realistic, cinematic";
      if (form.getValues("format") === "tiktok" || form.getValues("format") === "youtube_shorts") {
        style = "vibrant, modern, vertical video style";
      } else if (form.getValues("format") === "instagram") {
        style = "instagram aesthetic, square format, vibrant";
      }
      
      const response = await apiRequest("POST", "/api/ai/generate-image", {
        description: enhancedDescription,
        style
      });
      
      if (!response.ok) {
        throw new Error("Görsel oluşturulurken bir hata oluştu.");
      }
      
      const data = await response.json();
      
      // Sahneyi güncelle
      const updatedScenes = [...scenes];
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        imageUrl: data.imageUrl
      };
      
      setScenes(updatedScenes);
      
      toast({
        title: "Görsel oluşturuldu",
        description: "Sahne için görsel başarıyla oluşturuldu.",
      });
      
    } catch (err) {
      console.error("Error generating image:", err);
      toast({
        title: "Hata",
        description: "Görsel oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(null);
    }
  };
  
  // Sahne açıklamalarını iyileştir (Grok modeli veya Llama3 ile)
  const enhanceSceneDescriptions = async () => {
    try {
      if (scenes.length === 0) {
        toast({
          title: "Sahne bulunamadı",
          description: "Sahne içeriğini geliştirmek için önce sahneler oluşturun.",
          variant: "destructive",
        });
        return;
      }
      
      setEnhancingScenes(true);
      
      const response = await apiRequest("POST", "/api/ai/enhance-scenes", {
        scenes,
        useGrok: useGrokModel
      });
      
      if (!response.ok) {
        throw new Error("Sahne içeriği geliştirilirken bir hata oluştu.");
      }
      
      const data = await response.json();
      
      // Sahnelerin geliştirilmiş açıklamalarını güncelle
      setScenes(data.enhancedScenes);
      
      toast({
        title: "Sahne içeriği geliştirildi",
        description: `${data.model} modeli kullanılarak ${data.enhancedScenes.length} sahne geliştirildi.`,
      });
      
    } catch (err) {
      console.error("Error enhancing scenes:", err);
      toast({
        title: "Hata",
        description: "Sahne içeriği geliştirilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setEnhancingScenes(false);
    }
  };
  
  // Form submission
  const onSubmit = async (values: VideoFormValues) => {
    try {
      // İşlem durumunda kontroller
      if (scenes.length === 0) {
        toast({
          title: "Sahneler gerekli",
          description: "Video oluşturmak için önce sahne oluşturun",
          variant: "destructive",
        });
        return;
      }
      
      // Süre sınırlarını kontrol et
      if (values.duration > maxDuration) {
        values.duration = maxDuration;
      }
      
      // Sahne zaman dilimlerini hesapla
      const sceneDuration = Math.floor(values.duration / scenes.length);
      const enhancedScenes = scenes.map((scene, index) => ({
        ...scene,
        startTime: index * sceneDuration,
        endTime: (index === scenes.length - 1) ? values.duration : (index + 1) * sceneDuration,
      }));
      
      // Video verilerini oluştur ve kaydet
      await dispatch(createVideo({
        ...values,
        scenes: enhancedScenes,
      }));
      
      toast({
        title: "Video oluşturma başlatıldı",
        description: "Videonuz arka planda işleniyor. İşlem tamamlandığında bildirim alacaksınız.",
      });
      
      // Ana sayfaya yönlendir 
      window.location.href = "/dashboard";
      
    } catch (err) {
      console.error("Video oluşturma hatası:", err);
      toast({
        title: "Hata",
        description: "Video oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Video Oluştur</h1>
        <p className="text-gray-500">Metninizi girin ve video oluşturma ayarlarını yapılandırın.</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Metin İçeriği</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Başlığı</FormLabel>
                      <FormControl>
                        <Input placeholder="Video başlığını girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="originalText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Metni</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Videonuzda kullanılacak metni girin"
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {textStats.chars} karakter, {textStats.words} kelime
                        {textStats.estimatedDuration > 0 && (
                          <span> • Tahmini süre: {Math.floor(textStats.estimatedDuration / 60)}:{(textStats.estimatedDuration % 60).toString().padStart(2, '0')}</span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Video Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Video Formatı</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="standard_16_9" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Standard (16:9)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="youtube_shorts" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              YouTube Shorts (9:16)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="tiktok" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              TikTok (9:16)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="instagram" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Instagram (1:1)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Süresi (saniye)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            min={10}
                            max={maxDuration}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>10 sn</span>
                            <span>{field.value} sn</span>
                            <span>{maxDuration} sn</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Mevcut planınız için maksimum süre: {Math.floor(maxDuration / 60)}:{(maxDuration % 60).toString().padStart(2, '0')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="resolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çözünürlük</FormLabel>
                      <Select
                        disabled={plan ? true : false} // Disable if user has a plan (resolution is fixed by plan)
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Çözünürlük seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="720p">720p</SelectItem>
                          {(!plan || plan.resolution === "1080p" || plan.resolution === "4K") && (
                            <SelectItem value="1080p">1080p</SelectItem>
                          )}
                          {(!plan || plan.resolution === "4K") && (
                            <SelectItem value="4K">4K</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {plan && (
                        <FormDescription>
                          Çözünürlük abonelik planınız tarafından belirlenir
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="aiModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Modeli</FormLabel>
                      <Select
                        disabled={plan ? !plan.customAiModels : true}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="AI modeli seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="stable_diffusion_xl">Stable Diffusion XL</SelectItem>
                          {plan && plan.customAiModels && (
                            <>
                              <SelectItem value="llama_3">Llama 3</SelectItem>
                              <SelectItem value="coqui_tts">Coqui TTS</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {(!plan || !plan.customAiModels) && (
                        <FormDescription>
                          Özel AI modelleri, Pro veya Business planlarında kullanılabilir
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Sahne Oluşturma Bölümü */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Sahneler Oluştur</CardTitle>
              <CardDescription>
                Metninizi video sahnelerine dönüştürün ve görsellerle zenginleştirin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="edit">1. Video Detayları</TabsTrigger>
                  <TabsTrigger value="preview" disabled={scenes.length === 0}>
                    2. Sahne Önizleme {scenes.length > 0 && `(${scenes.length})`}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Metninizi girdikten sonra, yapay zeka ile otomatik olarak video sahneleri oluşturabilirsiniz. 
                      Her sahne için görsel ve açıklamalar oluşturulacaktır.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 mt-2">
                      <Button 
                        type="button" 
                        onClick={generateScenes}
                        disabled={isGeneratingScenes || form.getValues('originalText').length < 10}
                      >
                        {isGeneratingScenes ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sahneler Oluşturuluyor...
                          </>
                        ) : (
                          <>
                            <Video className="mr-2 h-4 w-4" />
                            Sahneler Oluştur
                          </>
                        )}
                      </Button>
                      
                      {scenes.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab('preview')}
                        >
                          <MoveRight className="mr-2 h-4 w-4" />
                          Sahneleri Önizle
                        </Button>
                      )}
                    </div>
                    
                    {sceneError && (
                      <div className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>{sceneError}</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="preview">
                  {scenes.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Video Sahneleri ({scenes.length})</h3>
                        
                        <div className="flex items-center gap-2">
                          {plan && plan.name !== "Free" && (
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={useGrokModel}
                                onCheckedChange={setUseGrokModel}
                                id="grok-model"
                                disabled={enhancingScenes}
                              />
                              <label
                                htmlFor="grok-model"
                                className="text-sm font-medium cursor-pointer"
                              >
                                Grok AI Kullan
                              </label>
                            </div>
                          )}
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={enhanceSceneDescriptions}
                            disabled={enhancingScenes || scenes.length === 0}
                          >
                            {enhancingScenes ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Geliştiriliyor...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sahne İçeriğini Geliştir
                              </>
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('edit')}
                          >
                            Metne Dön
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scenes.map((scene, index) => (
                          <Card key={index} className="overflow-hidden border border-gray-200">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base font-semibold">Sahne {index + 1}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              <div className="space-y-3">
                                <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                                  {scene.imageUrl ? (
                                    <img 
                                      src={scene.imageUrl} 
                                      alt={`Sahne ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <ImageIcon className="h-12 w-12 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-sm">
                                  <p className="font-medium mb-1">Görsel Açıklama:</p>
                                  <p className="text-gray-700">
                                    {scene.enhanced_description || scene.visual_description}
                                  </p>
                                </div>
                                
                                <div className="text-sm">
                                  <p className="font-medium mb-1">Metin:</p>
                                  <p className="text-gray-700">{scene.text_segment}</p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => generateImageForScene(index)}
                                disabled={isGeneratingImage !== null}
                              >
                                {isGeneratingImage === index ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Oluşturuluyor...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Görsel Oluştur
                                  </>
                                )}
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-1">Henüz sahne yok</h3>
                      <p className="text-gray-500 mb-4">
                        Video sahneleri oluşturmak için 'Sahneler Oluştur' butonuna tıklayın.
                      </p>
                      <Button
                        type="button"
                        onClick={generateScenes}
                        disabled={isGeneratingScenes || form.getValues('originalText').length < 10}
                      >
                        {isGeneratingScenes ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sahneler Oluşturuluyor...
                          </>
                        ) : (
                          <>
                            <Video className="mr-2 h-4 w-4" />
                            Sahneler Oluştur
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                İptal
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading || scenes.length === 0}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Video Oluştur
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

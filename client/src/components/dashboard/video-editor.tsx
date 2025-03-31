import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

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
  useState(() => {
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
  });
  
  // Form submission
  const onSubmit = async (values: VideoFormValues) => {
    try {
      // If duration exceeds plan limit, cap it
      if (values.duration > maxDuration) {
        values.duration = maxDuration;
      }
      
      // Auto-generate sections based on text
      // In a real app, this would be more sophisticated
      const segments = values.originalText.split(/\n\n+/);
      const sections = segments.map((text, index) => ({
        id: index + 1,
        text: text.trim(),
        startTime: 0, // These would be calculated properly in a real app
        endTime: 0,
      }));
      
      await dispatch(createVideo({
        ...values,
        sections,
      }));
      
      toast({
        title: "Video oluşturma başlatıldı",
        description: "Videonuz arka planda işleniyor. Tamamlandığında bilgilendirileceksiniz.",
      });
      
      // Navigate to videos list (would be implemented in a real app)
    } catch (err) {
      toast({
        title: "Hata",
        description: "Video oluşturulurken bir hata oluştu",
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                "Video Oluştur"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

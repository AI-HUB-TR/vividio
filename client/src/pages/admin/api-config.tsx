import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "wouter";
import { RootState } from "@/store/store";
import { apiRequest } from "@/lib/queryClient";
import { isAdmin } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Database,
  Key,
  RefreshCw,
  Save,
  Check,
  X,
  AlertCircle,
  Info,
  Sparkles,
  Bot,
  Settings,
  FileImage,
  Video,
  FileVideo,
  Code,
} from "lucide-react";

import AdminSidebar from "@/components/admin/sidebar";

// API yapılandırma formu şeması
const apiConfigSchema = z.object({
  id: z.number(),
  name: z.string(),
  value: z.string().optional(),
  description: z.string().optional(),
});

type ApiConfig = z.infer<typeof apiConfigSchema>;

export default function ApiConfigPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [updatingConfig, setUpdatingConfig] = useState<number | null>(null);
  
  // Kimlik doğrulama kontrolü
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin(user))) {
      navigate("/");
      return;
    }
    
    // API konfigürasyonlarını yükle
    const fetchApiConfigs = async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/api-configs");
        
        if (res.ok) {
          const data = await res.json();
          setApiConfigs(data);
        }
      } catch (error) {
        console.error("API yapılandırmaları yüklenirken hata oluştu:", error);
      } finally {
        setConfigsLoading(false);
      }
    };
    
    if (isAuthenticated && isAdmin(user)) {
      fetchApiConfigs();
    }
  }, [isAuthenticated, user, loading, navigate]);
  
  // API yapılandırmasını güncelleme
  const updateApiConfig = async (config: ApiConfig) => {
    setUpdatingConfig(config.id);
    
    try {
      const res = await apiRequest("PUT", "/api/admin/api-configs", config);
      
      if (res.ok) {
        const updatedConfig = await res.json();
        
        // Başarılı güncelleme, yerel durumu güncelle
        setApiConfigs(prevConfigs => 
          prevConfigs.map(c => 
            c.id === updatedConfig.id ? updatedConfig : c
          )
        );
        
        toast({
          title: "Yapılandırma güncellendi",
          description: `${config.name} başarıyla güncellendi.`,
        });
      } else {
        throw new Error("Yapılandırma güncellenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("API yapılandırması güncellenirken hata:", error);
      toast({
        title: "Hata",
        description: "API yapılandırması güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setUpdatingConfig(null);
    }
  };
  
  // Yükleniyor durumu
  if (loading || configsLoading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-12"></div>
          
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="rounded-lg border p-6 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // API gruplarına göre yapılandırmaları ayır
  const huggingFaceConfigs = apiConfigs.filter(config => 
    config.name.includes("HUGGINGFACE")
  );
  
  const aiModelConfigs = apiConfigs.filter(config => 
    config.name.includes("GEMINI") ||
    config.name.includes("DEEPSEEK") ||
    config.name.includes("GROQ")
  );
  
  const xaiConfigs = apiConfigs.filter(config => 
    config.name.includes("XAI") ||
    config.name.includes("GROK")
  );
  
  const stockConfigs = apiConfigs.filter(config => 
    config.name.includes("PEXELS") ||
    config.name.includes("UNSPLASH")
  );
  
  // API anahtar formunu oluşturan komponent
  const ApiKeyFormItem = ({ config }: { config: ApiConfig }) => {
    const form = useForm<ApiConfig>({
      resolver: zodResolver(apiConfigSchema),
      defaultValues: config,
    });
    
    const onSubmit = (data: ApiConfig) => {
      updateApiConfig(data);
    };
    
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="text-base">{config.name}</FormLabel>
                  {updatingConfig === config.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    form.formState.isDirty && (
                      <span className="text-xs text-yellow-500 italic">Değişiklikler kaydedilmedi</span>
                    )
                  )}
                </div>
                <FormDescription>
                  {config.description}
                </FormDescription>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      type={config.name.includes("KEY") || config.name.includes("TOKEN") ? "password" : "text"}
                      value={field.value || ""}
                      placeholder={`${config.name} değerini girin`}
                    />
                  </FormControl>
                  <Button 
                    type="submit" 
                    disabled={updatingConfig === config.id || !form.formState.isDirty}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Kaydet
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  };
  
  // Boolean değerli yapılandırma formu (etkin/devre dışı)
  const ApiToggleFormItem = ({ config }: { config: ApiConfig }) => {
    const form = useForm<ApiConfig>({
      resolver: zodResolver(apiConfigSchema),
      defaultValues: config,
    });
    
    const onToggleChange = (checked: boolean) => {
      const newValue = checked ? "true" : "false";
      form.setValue("value", newValue, { shouldDirty: true });
      updateApiConfig({ ...config, value: newValue });
    };
    
    const isEnabled = config.value === "true";
    
    return (
      <div className="flex items-center justify-between py-4">
        <div className="space-y-0.5">
          <div className="text-base font-medium">{config.name}</div>
          <div className="text-sm text-muted-foreground">{config.description}</div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={onToggleChange}
          disabled={updatingConfig === config.id}
        />
      </div>
    );
  };
  
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">API Yapılandırması</h1>
            <p className="text-muted-foreground">
              Platform için kullanılan API anahtarlarını ve servis entegrasyonlarını yönetin
            </p>
          </div>
          
          <Tabs defaultValue="ai-models">
            <TabsList className="mb-6">
              <TabsTrigger value="ai-models">
                <Bot className="h-4 w-4 mr-2" />
                AI Modelleri
              </TabsTrigger>
              <TabsTrigger value="media">
                <FileImage className="h-4 w-4 mr-2" />
                Medya Servisleri
              </TabsTrigger>
              <TabsTrigger value="grok">
                <Sparkles className="h-4 w-4 mr-2" />
                xAI/Grok
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai-models">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Hugging Face API
                  </CardTitle>
                  <CardDescription>
                    Görsel üretimi için Hugging Face Inference API yapılandırması
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {huggingFaceConfigs.map((config) => (
                    <ApiKeyFormItem key={config.id} config={config} />
                  ))}
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="h-5 w-5 mr-2" />
                    Diğer AI Modelleri
                  </CardTitle>
                  <CardDescription>
                    Metin ve içerik üretimi için kullanılan AI model yapılandırmaları
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiModelConfigs.map((config) => (
                    <ApiKeyFormItem key={config.id} config={config} />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileImage className="h-5 w-5 mr-2" />
                    Stok Görsel Servisleri
                  </CardTitle>
                  <CardDescription>
                    Video içerikleri için stok görsel ve video servisleri yapılandırması
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stockConfigs.map((config) => (
                    <ApiKeyFormItem key={config.id} config={config} />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="grok">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    xAI/Grok Entegrasyonu
                  </CardTitle>
                  <CardDescription>
                    xAI/Grok AI servisleri entegrasyonu yapılandırması
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 mb-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Grok AI Entegrasyonu</h4>
                        <p className="text-sm text-yellow-600 mt-1">
                          Grok AI, videolarınızın sahne içeriklerini geliştirmek ve görsel analizi için ek bir yapay zeka modelidir.
                          Kullanmak için önce API anahtarını giriniz, ardından entegrasyonu aktif ediniz.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {xaiConfigs
                      .filter(config => config.name === "XAI_API_KEY")
                      .map(config => (
                        <ApiKeyFormItem key={config.id} config={config} />
                      ))
                    }
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {xaiConfigs
                    .filter(config => config.name === "GROK_ENABLED")
                    .map(config => (
                      <ApiToggleFormItem key={config.id} config={config} />
                    ))
                  }
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
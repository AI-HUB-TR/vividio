import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "wouter";
import { RootState } from "@/store/store";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { AlertCircle, Settings, Save, RefreshCw, CheckCircle, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// API yapılandırma tiplerini tanımla
interface ApiConfig {
  id: number;
  name: string;
  value: string | null;
  description: string | null;
  updatedAt: Date;
}

// Tab'ları grupla
type ApiTabGroup = {
  title: string;
  description: string;
  configs: ApiConfig[];
  icon: React.ReactNode;
};

export default function ApiConfigPage() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && isAuthenticated && !isAdmin) {
      setLocation("/dashboard");
    } else if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAdmin, isAuthenticated, loading, setLocation]);

  // Fetch API configs
  useEffect(() => {
    const fetchApiConfigs = async () => {
      if (!isAuthenticated || !isAdmin) return;
      
      setConfigsLoading(true);
      setError(null);
      
      try {
        const res = await apiRequest("GET", "/api/admin/api-configs");
        const data = await res.json();
        setApiConfigs(data);
      } catch (err) {
        setError("API yapılandırmaları yüklenirken bir hata oluştu");
        console.error("Error fetching API configs:", err);
      } finally {
        setConfigsLoading(false);
      }
    };
    
    fetchApiConfigs();
  }, [isAuthenticated, isAdmin]);

  // Update API config
  const updateApiConfig = async (name: string, value: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const res = await apiRequest("PUT", "/api/admin/api-configs", {
        name,
        value
      });
      
      if (!res.ok) {
        throw new Error("API yapılandırması güncellenirken bir hata oluştu");
      }
      
      // Update the local state
      setApiConfigs(prev => 
        prev.map(config => 
          config.name === name 
            ? { ...config, value, updatedAt: new Date() } 
            : config
        )
      );
      
      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      
      toast({
        title: "Başarılı",
        description: `${name} başarıyla güncellendi.`,
        variant: "default",
      });
      
    } catch (err) {
      setError("API yapılandırması güncellenirken bir hata oluştu");
      console.error("Error updating API config:", err);
      
      toast({
        title: "Hata",
        description: "API yapılandırması güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Organize configs into tab groups
  const getApiTabGroups = (): ApiTabGroup[] => {
    const huggingfaceConfigs = apiConfigs.filter(c => c.name.includes("HUGGINGFACE"));
    const deepseekConfigs = apiConfigs.filter(c => c.name.includes("DEEPSEEK"));
    const geminiConfigs = apiConfigs.filter(c => c.name.includes("GEMINI"));
    const groqConfigs = apiConfigs.filter(c => c.name.includes("GROQ"));
    const grokConfigs = apiConfigs.filter(c => c.name.includes("GROK") || c.name.includes("XAI"));
    const generalConfigs = apiConfigs.filter(c => 
      !c.name.includes("HUGGINGFACE") && 
      !c.name.includes("DEEPSEEK") && 
      !c.name.includes("GEMINI") && 
      !c.name.includes("GROQ") && 
      !c.name.includes("GROK") && 
      !c.name.includes("XAI")
    );
    
    return [
      {
        title: "Genel Ayarlar",
        description: "Temel API yapılandırma ayarları",
        configs: generalConfigs,
        icon: <Settings className="h-5 w-5" />
      },
      {
        title: "Hugging Face",
        description: "Hugging Face API yapılandırma ayarları",
        configs: huggingfaceConfigs,
        icon: <Database className="h-5 w-5" />
      },
      {
        title: "DeepSeek",
        description: "DeepSeek API yapılandırma ayarları",
        configs: deepseekConfigs,
        icon: <Database className="h-5 w-5" />
      },
      {
        title: "Gemini",
        description: "Gemini API yapılandırma ayarları",
        configs: geminiConfigs,
        icon: <Database className="h-5 w-5" />
      },
      {
        title: "Groq",
        description: "Groq API yapılandırma ayarları",
        configs: groqConfigs,
        icon: <Database className="h-5 w-5" />
      },
      {
        title: "Grok (xAI)",
        description: "Grok (xAI) API yapılandırma ayarları",
        configs: grokConfigs,
        icon: <Database className="h-5 w-5" />
      }
    ];
  };

  // Handling boolean values for switches
  const getBooleanValue = (value: string | null): boolean => {
    return value === "true";
  };

  // Toggle boolean value
  const toggleBooleanValue = (name: string, currentValue: string | null) => {
    const newValue = currentValue === "true" ? "false" : "true";
    updateApiConfig(name, newValue);
  };

  // Format the API key to only show last 4 characters
  const formatApiKey = (key: string | null): string => {
    if (!key) return "";
    if (key.length <= 8) return "••••••••";
    return "••••••••" + key.slice(-4);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500 border-r-2 border-b-2 border-gray-200 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Yetkisiz Erişim</h2>
          <p className="text-gray-600 mb-6">
            Bu sayfayı görüntülemek için yönetici yetkisine sahip olmanız gerekmektedir.
          </p>
          <Link href="/dashboard">
            <Button>Dashboard'a Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabGroups = getApiTabGroups();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-primary-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/admin">
            <a className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 mr-2"
              >
                <path d="m4 8 2-2m0 0 2-2M6 6 4 4m2 2 2 2" />
                <rect width="12" height="12" x="8" y="8" rx="2" />
                <path d="m15 13-2 2-1-1" />
              </svg>
              <span className="font-display font-bold text-xl">VidAI Yönetim</span>
            </a>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" className="text-white border-white hover:bg-primary-700">
                Yönetim Paneline Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">API Yapılandırması</h1>
            <p className="text-gray-500">AI servisleri ve API anahtarlarını yapılandırın.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/admin">
              <Button variant="outline" className="mr-2">
                Geri
              </Button>
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {configsLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-center items-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">API yapılandırmaları yükleniyor...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={tabGroups[0]?.title}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
              {tabGroups.map((group) => (
                <TabsTrigger key={group.title} value={group.title} className="flex items-center">
                  {group.icon}
                  <span className="ml-2 hidden md:inline">{group.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {tabGroups.map((group) => (
              <TabsContent key={group.title} value={group.title}>
                <Card>
                  <CardHeader>
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {group.configs.length === 0 ? (
                      <p className="text-gray-500 italic">Bu grupta yapılandırma bulunmuyor.</p>
                    ) : (
                      <div className="grid gap-6">
                        {group.configs.map((config) => (
                          <div key={config.id} className="p-4 rounded-lg border border-gray-200">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{config.name}</h3>
                                {config.description && (
                                  <p className="text-sm text-gray-500">{config.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  Son güncelleme: {new Date(config.updatedAt).toLocaleString()}
                                </p>
                              </div>
                              
                              {/* API anahtarı ise farklı gösterim yap */}
                              {config.name.includes("_API_KEY") ? (
                                <div className="mt-4 md:mt-0 grid gap-2">
                                  <div className="flex items-center space-x-2">
                                    <Input 
                                      type="password" 
                                      value={formatApiKey(config.value)} 
                                      readOnly 
                                      className="max-w-xs"
                                    />
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        // Burada API anahtarını göster/gizle mantığı olabilir
                                        toast({
                                          title: "Bilgi",
                                          description: "Güvenlik nedeniyle API anahtarları gizlenir. Yeni bir anahtar eklemek için güncelleme yapın.",
                                        });
                                      }}
                                    >
                                      Göster
                                    </Button>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="grid w-full max-w-xs items-center gap-1.5">
                                      <Label htmlFor={`api-key-${config.id}`}>Yeni API Anahtarı</Label>
                                      <div className="flex space-x-2">
                                        <Input 
                                          id={`api-key-${config.id}`}
                                          type="password"
                                          placeholder="yeni API anahtarı girin"
                                          className="max-w-xs"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              updateApiConfig(config.name, e.currentTarget.value);
                                              e.currentTarget.value = "";
                                            }
                                          }}
                                        />
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={(e) => {
                                            const input = document.getElementById(`api-key-${config.id}`) as HTMLInputElement;
                                            updateApiConfig(config.name, input.value);
                                            input.value = "";
                                          }}
                                        >
                                          Güncelle
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : config.name.includes("_ENABLED") ? (
                                // Switch komponenti kullan (enabled/disabled ayarları için)
                                <div className="mt-4 md:mt-0 flex items-center space-x-4">
                                  <span className="text-sm text-gray-500">
                                    {getBooleanValue(config.value) ? "Etkin" : "Devre Dışı"}
                                  </span>
                                  <Switch 
                                    checked={getBooleanValue(config.value)}
                                    onCheckedChange={() => toggleBooleanValue(config.name, config.value)}
                                  />
                                </div>
                              ) : (
                                // Normal metin girişi
                                <div className="mt-4 md:mt-0 grid gap-2">
                                  <div className="flex items-center space-x-2">
                                    <Input 
                                      type="text" 
                                      value={config.value || ""}
                                      className="max-w-xs"
                                      onChange={(e) => {
                                        setApiConfigs(prev => 
                                          prev.map(c => 
                                            c.id === config.id 
                                              ? { ...c, value: e.target.value } 
                                              : c
                                          )
                                        );
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value !== config.value) {
                                          updateApiConfig(config.name, e.target.value);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          updateApiConfig(config.name, e.currentTarget.value);
                                        }
                                      }}
                                    />
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => updateApiConfig(config.name, config.value || "")}
                                    >
                                      Kaydet
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
        
        {saving && (
          <div className="fixed bottom-4 right-4 bg-primary-100 text-primary-800 p-4 rounded-md shadow-lg flex items-center">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            <span>Kaydediliyor...</span>
          </div>
        )}
        
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 p-4 rounded-md shadow-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Başarıyla kaydedildi!</span>
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "wouter";
import { RootState } from "@/store/store";
import { apiRequest } from "@/lib/queryClient";
import { isAdmin } from "@/lib/auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import {
  Users,
  FilmIcon,
  Settings,
  AreaChart,
  ShieldCheck,
  CircleDollarSign,
  CalendarRange,
  Layout,
} from "lucide-react";

import AdminSidebar from "@/components/admin/sidebar";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  
  const [stats, setStats] = useState({
    userCount: 0,
    videoCount: 0,
    revenue: 0,
  });
  
  const [statsLoading, setStatsLoading] = useState(true);
  
  useEffect(() => {
    // Kimlik doğrulama kontrolü
    if (!loading && (!isAuthenticated || !isAdmin(user))) {
      navigate("/");
      return;
    }
    
    // İstatistikleri yükle
    const fetchStats = async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/stats");
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Admin istatistikleri yüklenirken hata oluştu:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    if (isAuthenticated && isAdmin(user)) {
      fetchStats();
    }
  }, [isAuthenticated, user, loading, navigate]);
  
  if (loading || statsLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
          <div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex">
      <AdminSidebar />
      
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Yönetici Paneli</h1>
            <p className="text-muted-foreground">
              VidAI platformunu yönetin ve izleyin
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full">
              <ShieldCheck className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-medium">Admin</span>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="settings">Site Ayarları</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Toplam Kullanıcı
                  </CardTitle>
                  <CardDescription>
                    Platformdaki kayıtlı kullanıcı sayısı
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.userCount}</div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Toplam Video
                  </CardTitle>
                  <CardDescription>
                    Platformda oluşturulan video sayısı
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.videoCount}</div>
                    <FilmIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Toplam Gelir
                  </CardTitle>
                  <CardDescription>
                    Aboneliklerden elde edilen aylık gelir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.revenue} ₺</div>
                    <CircleDollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Hızlı Erişim</CardTitle>
                  <CardDescription>
                    Platform yönetimi için hızlı erişim bağlantıları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card
                      className="cursor-pointer hover:bg-accent transition-colors group"
                      onClick={() => navigate("/admin/users")}
                    >
                      <CardContent className="p-6 flex flex-col items-center justify-center">
                        <Users className="h-8 w-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Kullanıcılar</span>
                      </CardContent>
                    </Card>
                    
                    <Card
                      className="cursor-pointer hover:bg-accent transition-colors group"
                      onClick={() => navigate("/admin/videos")}
                    >
                      <CardContent className="p-6 flex flex-col items-center justify-center">
                        <FilmIcon className="h-8 w-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Videolar</span>
                      </CardContent>
                    </Card>
                    
                    <Card
                      className="cursor-pointer hover:bg-accent transition-colors group" 
                      onClick={() => navigate("/admin/subscriptions")}
                    >
                      <CardContent className="p-6 flex flex-col items-center justify-center">
                        <CalendarRange className="h-8 w-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Abonelikler</span>
                      </CardContent>
                    </Card>
                    
                    <Card
                      className="cursor-pointer hover:bg-accent transition-colors group"
                      onClick={() => navigate("/admin/api-config")}
                    >
                      <CardContent className="p-6 flex flex-col items-center justify-center">
                        <Settings className="h-8 w-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">API Ayarları</span>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Ayarları</CardTitle>
                <CardDescription>
                  VidAI platformunun genel ayarlarını yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Görünüm Ayarları</h3>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="cursor-pointer hover:bg-accent transition-colors group">
                        <CardContent className="p-4 flex items-center space-x-4">
                          <Layout className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Site Temaları</p>
                            <p className="text-sm text-muted-foreground">
                              Platform temasını ve renklerini değiştirin
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="cursor-pointer hover:bg-accent transition-colors group"
                        onClick={() => navigate("/admin/api-config")}>
                        <CardContent className="p-4 flex items-center space-x-4">
                          <Settings className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="font-medium">API Yapılandırması</p>
                            <p className="text-sm text-muted-foreground">
                              API anahtarlarını ve entegrasyonları yönetin
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">İçerik Yönetimi</h3>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="cursor-pointer hover:bg-accent transition-colors group"
                        onClick={() => navigate("/admin/videos")}>
                        <CardContent className="p-4 flex items-center space-x-4">
                          <FilmIcon className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Video Yönetimi</p>
                            <p className="text-sm text-muted-foreground">
                              Tüm videoları görüntüleyin ve yönetin
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="cursor-pointer hover:bg-accent transition-colors group"
                        onClick={() => navigate("/admin/users")}>
                        <CardContent className="p-4 flex items-center space-x-4">
                          <Users className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Kullanıcı Yönetimi</p>
                            <p className="text-sm text-muted-foreground">
                              Kullanıcıları yönetin ve rolleri düzenleyin
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
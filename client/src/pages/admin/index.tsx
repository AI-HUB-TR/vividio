import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "wouter";
import { RootState } from "@/store/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  Users,
  Video,
  CreditCard,
  AlertCircle
} from "lucide-react";

interface DashboardStats {
  userCount: number;
  videoCount: number;
  revenueTotal: number;
}

export default function AdminIndex() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated || !isAdmin) return;
      
      setStatsLoading(true);
      setError(null);
      
      try {
        const res = await apiRequest("GET", "/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError("İstatistikler yüklenirken bir hata oluştu");
        console.error("Error fetching admin stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchStats();
  }, [isAuthenticated, isAdmin]);

  // Sample data for charts
  const monthlyData = [
    { name: "Oca", users: 30, videos: 150, revenue: 5000 },
    { name: "Şub", users: 45, videos: 230, revenue: 7500 },
    { name: "Mar", users: 55, videos: 280, revenue: 9200 },
    { name: "Nis", users: 70, videos: 340, revenue: 12000 },
    { name: "May", users: 85, videos: 390, revenue: 15000 },
    { name: "Haz", users: 100, videos: 450, revenue: 18000 },
  ];
  
  const planData = [
    { name: "Ücretsiz", value: 65 },
    { name: "Pro", value: 25 },
    { name: "Business", value: 10 },
  ];
  
  const formatCurrency = (value: number) => {
    return `${value}₺`;
  };
  
  const COLORS = ["#CBD5E1", "#3B82F6", "#1E40AF"];

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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-primary-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
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
            <Link href="/dashboard">
              <Button variant="outline" className="text-white border-white hover:bg-primary-700">
                Dashboard'a Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-gray-900">Yönetim Paneli</h1>
          <p className="text-gray-500">VidAI platformu hakkında genel istatistikler.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-9 animate-pulse bg-gray-200 rounded"></div>
              ) : error ? (
                <div className="text-red-500 text-sm">Hata: Yüklenemedi</div>
              ) : stats ? (
                <div className="text-2xl font-bold">{stats.userCount.toLocaleString()}</div>
              ) : (
                <div className="text-2xl font-bold">0</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stats && `Son 30 günde %12 artış`}
              </p>
              <div className="mt-4">
                <Link href="/admin/users">
                  <Button variant="outline" size="sm" className="w-full">
                    Kullanıcıları Görüntüle
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Oluşturulan Video</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-9 animate-pulse bg-gray-200 rounded"></div>
              ) : error ? (
                <div className="text-red-500 text-sm">Hata: Yüklenemedi</div>
              ) : stats ? (
                <div className="text-2xl font-bold">{stats.videoCount.toLocaleString()}</div>
              ) : (
                <div className="text-2xl font-bold">0</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stats && `Son 30 günde %25 artış`}
              </p>
              <div className="mt-4">
                <Link href="/admin/videos">
                  <Button variant="outline" size="sm" className="w-full">
                    Videoları Görüntüle
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aylık Gelir</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-9 animate-pulse bg-gray-200 rounded"></div>
              ) : error ? (
                <div className="text-red-500 text-sm">Hata: Yüklenemedi</div>
              ) : stats ? (
                <div className="text-2xl font-bold">{stats.revenueTotal.toLocaleString()}₺</div>
              ) : (
                <div className="text-2xl font-bold">0₺</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stats && `Son 30 günde %18 artış`}
              </p>
              <div className="mt-4">
                <Link href="/admin/subscriptions">
                  <Button variant="outline" size="sm" className="w-full">
                    Abonelikleri Görüntüle
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Aylık İstatistikler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                    <Tooltip formatter={(value, name) => {
                      if (name === "revenue") return formatCurrency(value as number);
                      return value;
                    }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="users" name="Kullanıcılar" fill="#3B82F6" />
                    <Bar yAxisId="left" dataKey="videos" name="Videolar" fill="#CBD5E1" />
                    <Bar yAxisId="right" dataKey="revenue" name="Gelir (₺)" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Abonelik Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hızlı Erişim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Kullanıcı Yönetimi
                  </Button>
                </Link>
                
                <Link href="/admin/videos">
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="mr-2 h-4 w-4" />
                    Video Yönetimi
                  </Button>
                </Link>
                
                <Link href="/admin/subscriptions">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Abonelik Yönetimi
                  </Button>
                </Link>
                
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="m4 8 2-2m0 0 2-2M6 6 4 4m2 2 2 2" />
                      <rect width="12" height="12" x="8" y="8" rx="2" />
                      <path d="m15 13-2 2-1-1" />
                    </svg>
                    Dashboard'a Dön
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

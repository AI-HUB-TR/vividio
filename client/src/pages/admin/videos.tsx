import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, Link } from "wouter";
import { RootState } from "@/store/store";
import { useQuery } from "@tanstack/react-query";
import { Video } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  AlertCircle,
  Search,
  Video as VideoIcon,
  Film
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function AdminVideos() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { user: currentUser, isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );

  // Check if user is admin
  const isAdmin = currentUser?.role === "admin";

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && isAuthenticated && !isAdmin) {
      setLocation("/dashboard");
    } else if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAdmin, isAuthenticated, loading, setLocation]);

  // Fetch all videos
  const { 
    data: videos, 
    isLoading: videosLoading, 
    error: videosError,
    refetch: refetchVideos
  } = useQuery({
    queryKey: ["/api/admin/videos"],
    enabled: isAdmin
  });

  // Format date as relative time
  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: tr });
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Tamamlandı";
      case "processing":
        return "İşleniyor";
      case "failed":
        return "Başarısız";
      default:
        return status;
    }
  };

  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter videos based on search term
  const filteredVideos = videos 
    ? (videos as Video[]).filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.originalText.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

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
            <Link href="/admin">
              <Button variant="outline" className="text-white border-white hover:bg-primary-700">
                Yönetim Paneline Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Video Yönetimi</h1>
            <p className="text-gray-500">Tüm videoları görüntüleyin ve yönetin.</p>
          </div>
          
          <Link href="/admin">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Videolar</CardTitle>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Video ara..."
                className="pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {videosLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500 border-r-2 border-b-2 border-gray-200 mx-auto mb-4"></div>
                <p className="text-gray-500">Videolar yükleniyor...</p>
              </div>
            ) : videosError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">Videolar yüklenirken bir hata oluştu</p>
                <Button variant="outline" onClick={() => refetchVideos()}>Yeniden Dene</Button>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-10">
                <VideoIcon className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? "Aramanızla eşleşen video bulunamadı" : "Henüz video yok"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Süre</TableHead>
                    <TableHead>Çözünürlük</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVideos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-10 w-16 rounded bg-gray-100 mr-3 flex items-center justify-center overflow-hidden">
                            {video.thumbnailUrl ? (
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Film className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <span className="truncate max-w-[150px]">{video.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>ID: {video.userId}</TableCell>
                      <TableCell>{video.format}</TableCell>
                      <TableCell>{formatDuration(video.duration)}</TableCell>
                      <TableCell>{video.resolution}</TableCell>
                      <TableCell>{formatDate(video.createdAt)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusClass(video.status)}`}>
                          {getStatusLabel(video.status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

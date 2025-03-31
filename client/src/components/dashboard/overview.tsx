import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Video,
  Clock,
  Calendar,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Video as VideoType } from "@shared/schema";

export default function Overview() {
  const { user, plan } = useSelector((state: RootState) => state.auth);
  
  // Fetch user videos
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ["/api/videos"],
  });

  // Format video creation date relative to now (e.g. "3 days ago")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  };

  // Check if video duration is in seconds or already formatted
  const formatDuration = (duration: number | string) => {
    if (typeof duration === 'string') return duration;
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Hoş geldiniz, {user?.displayName || user?.username || 'kullanıcı'}!</p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonelik</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plan?.name || "Ücretsiz"}</div>
            <p className="text-xs text-muted-foreground">
              {plan && plan.priceMonthly > 0 
                ? `${plan.priceMonthly}₺/ay` 
                : "Ücretsiz plan"}
            </p>
            {plan && (
              <div className="mt-4">
                <Link href="/pricing">
                  <Button variant="outline" size="sm" className="w-full">
                    Yükselt
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Günlük Video Limiti</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plan ? `${plan.dailyVideoLimit} video/gün` : "2 video/gün"}
            </div>
            <p className="text-xs text-muted-foreground">
              Kalan: {/* This would display remaining videos for the day */}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Video</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Yükleniyor..." : videos ? videos.length : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {!isLoading && videos && videos.length > 0 
                ? `Son video: ${formatDate(videos[0].createdAt)}` 
                : "Henüz video oluşturmadınız"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Son Videolarınız</h3>
        </div>
        <div>
          {isLoading ? (
            <div className="p-6 text-center">Videolar yükleniyor...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500 flex flex-col items-center">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p>Videolar yüklenirken bir hata oluştu.</p>
            </div>
          ) : videos && videos.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {(videos as VideoType[]).slice(0, 5).map((video) => (
                <li key={video.id} className="px-4 py-4 flex items-center">
                  <div className="min-w-0 flex-1 flex items-center">
                    <div className="flex-shrink-0 bg-gray-100 rounded-md p-2">
                      {video.thumbnailUrl ? (
                        <img 
                          src={video.thumbnailUrl} 
                          className="h-12 w-16 object-cover rounded"
                          alt={video.title}
                        />
                      ) : (
                        <Video className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <div>
                        <p className="text-sm font-medium text-primary-600 truncate">{video.title}</p>
                        <p className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="truncate">{formatDuration(video.duration)} • {video.format} • {video.resolution}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 flex-shrink-0 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">{formatDate(video.createdAt)}</span>
                    <div className={`px-2 py-1 text-xs rounded ${
                      video.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : video.status === 'processing' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {video.status === 'completed' 
                        ? 'Tamamlandı' 
                        : video.status === 'processing' 
                        ? 'İşleniyor' 
                        : 'Hata'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center">
              <div className="flex justify-center mb-4">
                <Video className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz videonuz yok</h3>
              <p className="text-gray-500 mb-6">Yeni bir video oluşturmak için aşağıdaki butona tıklayın.</p>
              <Link href="/dashboard/create">
                <Button>
                  Video Oluştur
                </Button>
              </Link>
            </div>
          )}
        </div>
        {videos && videos.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-200 sm:px-6">
            <Link href="/dashboard/videos">
              <Button variant="outline" className="w-full">
                Tüm Videoları Görüntüle
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

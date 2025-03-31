import { Link } from "wouter";
import { Video } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useDispatch } from "react-redux";
import { updateVideoStatus, deleteVideo } from "@/store/slices/videoSlice";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import {
  Play,
  MoreVertical,
  Trash,
  RefreshCw,
  ExternalLink,
  Edit,
  Video as VideoIcon,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";

interface VideoCardProps {
  video: Video;
  onDelete?: () => void;
}

const VideoCard = ({ video, onDelete }: VideoCardProps) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  
  // Video sıfatını ve rengini belirle
  const getStatusBadge = () => {
    switch (video.status) {
      case "processing":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          İşleniyor
        </Badge>;
      case "completed":
        return <Badge variant="success" className="bg-green-500 hover:bg-green-600">Hazır</Badge>;
      case "failed":
        return <Badge variant="destructive">Başarısız</Badge>;
      default:
        return <Badge variant="outline">Bekliyor</Badge>;
    }
  };
  
  // Video işleme durumunu kontrol et
  useEffect(() => {
    if (video.status === "processing" && !isPolling) {
      pollVideoStatus();
    }
  }, [video.status]);
  
  // Durum kontrolü
  const pollVideoStatus = async () => {
    if (isPolling) return;
    
    setIsPolling(true);
    
    try {
      const res = await apiRequest("GET", `/api/ai/video-status/${video.id}`);
      if (res.ok) {
        const data = await res.json();
        
        // İlerleme durumunu güncelle
        if (data.processingStatus) {
          setProgress(data.processingStatus.progress || null);
        }
        
        // Tamamlandıysa durumu güncelle
        if (data.processingStatus.status === "completed" && video.status !== "completed") {
          dispatch(updateVideoStatus({
            id: video.id,
            status: "completed",
            videoUrl: data.video.videoUrl,
            thumbnailUrl: data.video.thumbnailUrl
          }));
          
          toast({
            title: "Video hazır",
            description: `"${video.title}" videosu işlendi ve hazır`,
          });
          
          setIsPolling(false);
          return;
        }
      }
      
      // 5 saniye sonra tekrar kontrol et
      setTimeout(() => {
        setIsPolling(false);
        if (video.status === "processing") {
          pollVideoStatus();
        }
      }, 5000);
      
    } catch (error) {
      console.error("Video status polling error:", error);
      setIsPolling(false);
    }
  };
  
  // Video silme
  const handleDelete = async () => {
    try {
      await dispatch(deleteVideo(video.id) as any);
      
      toast({
        title: "Video silindi",
        description: "Video başarıyla silindi",
      });
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Video silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };
  
  // Oluşturma tarihini biçimlendir
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Thumbnail veya varsayılan görsel */}
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}
          
          {/* Durum işareti */}
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
          
          {/* İşleme ilerleme çubuğu */}
          {video.status === "processing" && progress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          {/* Oynat butonu - tamamlanmış videolar için */}
          {video.status === "completed" && (
            <Link href={`/video/${video.id}`}>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                  <Play className="h-8 w-8 text-white" fill="white" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
      
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            <Link href={`/video/${video.id}`} className="hover:text-primary transition-colors">
              {video.title}
            </Link>
          </CardTitle>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/video/${video.id}`} className="cursor-pointer">
                  <Play className="h-4 w-4 mr-2" />
                  İzle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/video/${video.id}`} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Link>
              </DropdownMenuItem>
              {video.status === "completed" && video.videoUrl && (
                <DropdownMenuItem>
                  <a 
                    href={video.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Yeni sekmede aç
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Videoyu silmek istediğinize emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem geri alınamaz ve video kalıcı olarak silinecektir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Videoyu Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="text-sm text-gray-500 space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(video.createdAt)}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs">{video.resolution}</span>
            <span>•</span>
            <span className="font-medium text-xs">{video.format === "standard_16_9" ? "16:9" : video.format === "instagram" ? "1:1" : "9:16"}</span>
            <span>•</span>
            <span className="font-medium text-xs">{video.duration}s</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-full"
        >
          <Link href={`/video/${video.id}`}>
            {video.status === "completed" ? "İzle ve Düzenle" : "Detayları Görüntüle"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VideoCard;
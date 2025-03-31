import { useState } from "react";
import { Link } from "wouter";
import { useSelector, useDispatch } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { RootState } from "@/store/store";
import { deleteVideo, updateVideoStatus } from "@/store/slices/videoSlice";
import { Video } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Video as VideoIcon,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Film,
  AlertCircle
} from "lucide-react";

export default function VideoList() {
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const { toast } = useToast();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { loading } = useSelector((state: RootState) => state.video);

  // Fetch videos from API
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ["/api/videos"],
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

  const handleDeleteVideo = async (video: Video) => {
    setVideoToDelete(video);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      await dispatch(deleteVideo(videoToDelete.id));
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video silindi",
        description: "Video başarıyla silindi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Video silinemedi",
        variant: "destructive",
      });
    } finally {
      setVideoToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setVideoToDelete(null);
  };

  // Simulating a video processing update
  const pollVideoStatus = async (videoId: number) => {
    try {
      const res = await fetch(`/api/videos/${videoId}`);
      if (!res.ok) throw new Error("Failed to fetch video status");
      
      const video = await res.json();
      dispatch(updateVideoStatus({
        id: video.id,
        status: video.status,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl
      }));
      
      // Continue polling if still processing
      if (video.status === "processing") {
        setTimeout(() => pollVideoStatus(videoId), 5000);
      } else if (video.status === "completed") {
        toast({
          title: "Video hazır",
          description: "Videonuz başarıyla oluşturuldu ve izlemeye hazır",
        });
      }
    } catch (error) {
      console.error("Error polling video status:", error);
    }
  };

  // Start polling for processing videos
  useState(() => {
    if (videos) {
      const processingVideos = (videos as Video[]).filter(v => v.status === "processing");
      processingVideos.forEach(video => {
        pollVideoStatus(video.id);
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        
        <Card className="p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="ml-auto flex items-center space-x-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Videolarım</h1>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Videolar yüklenemedi</h3>
          <p className="text-red-600 mb-4">Videolarınızı getirirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/videos"] })}
            variant="outline"
          >
            Yeniden Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Videolarım</h1>
          <p className="text-gray-500">Oluşturduğunuz tüm videoları görüntüleyin ve yönetin.</p>
        </div>
        
        <Link href="/dashboard/create">
          <Button>
            <VideoIcon className="mr-2 h-4 w-4" />
            Yeni Video
          </Button>
        </Link>
      </div>
      
      <Card>
        {videos && (videos as Video[]).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(videos as Video[]).map((video) => (
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
                      <span className="truncate max-w-[200px]">{video.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{video.format}</TableCell>
                  <TableCell>{formatDuration(video.duration)}</TableCell>
                  <TableCell>{formatDate(video.createdAt)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusClass(video.status)}`}>
                      {getStatusLabel(video.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">İşlemler</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {video.status === "completed" && (
                          <>
                            <DropdownMenuItem 
                              disabled={!video.videoUrl}
                              onClick={() => {
                                if (video.videoUrl) {
                                  window.open(video.videoUrl, '_blank');
                                }
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              <span>İndir</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              <span>Paylaş</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteVideo(video)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Sil</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-10 text-center">
            <VideoIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz videonuz yok</h3>
            <p className="text-gray-500 mb-6">İlk videonuzu oluşturmak için aşağıdaki butona tıklayın.</p>
            <Link href="/dashboard/create">
              <Button>
                Video Oluştur
              </Button>
            </Link>
          </div>
        )}
      </Card>
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!videoToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Videoyu Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. "{videoToDelete?.title}" videosunu silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? "Siliniyor..." : "Videoyu Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

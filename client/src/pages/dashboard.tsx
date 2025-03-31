import { useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Sidebar from "@/components/dashboard/sidebar";
import Overview from "@/components/dashboard/overview";
import VideoEditor from "@/components/dashboard/video-editor";
import VideoList from "@/components/dashboard/video-list";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [isRoot] = useRoute("/dashboard");
  const [isCreate] = useRoute("/dashboard/create");
  const [isVideos] = useRoute("/dashboard/videos");
  
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  // If user is not authenticated and not loading, redirect to home
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);

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

  // Show unauthorized message
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Erişim Reddedildi</h2>
          <p className="text-gray-600 mb-6">
            Bu sayfayı görüntülemek için giriş yapmanız gerekmektedir.
          </p>
          <Link href="/">
            <Button>Ana Sayfaya Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {isRoot && <Overview />}
        {isCreate && <VideoEditor />}
        {isVideos && <VideoList />}
      </div>
    </div>
  );
}

import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

import {
  Users,
  FilmIcon,
  Settings,
  Home,
  BarChart,
  CalendarRange,
  LogOut,
  User,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { RootState } from "@/store/store";
import { Button } from "@/components/ui/button";

const AdminSidebar = () => {
  const [location, navigate] = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const handleLogout = () => {
    dispatch(logout() as any);
    navigate("/");
  };
  
  // Menü öğeleri
  const menuItems = [
    {
      title: "Genel Bakış",
      href: "/admin",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Kullanıcılar",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Videolar",
      href: "/admin/videos",
      icon: <FilmIcon className="h-5 w-5" />,
    },
    {
      title: "Abonelikler",
      href: "/admin/subscriptions",
      icon: <CalendarRange className="h-5 w-5" />,
    },
    {
      title: "API Ayarları",
      href: "/admin/api-config",
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  return (
    <div className="h-screen w-64 border-r flex flex-col bg-muted/20">
      <div className="p-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FilmIcon className="h-6 w-6 text-primary" />
          VidAI Admin
        </h2>
      </div>
      
      <div className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant={location === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                location === item.href && "bg-secondary"
              )}
              onClick={() => navigate(item.href)}
            >
              <span className="mr-3">{item.icon}</span>
              {item.title}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Kullanıcı bilgisi ve çıkış */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium truncate">{user?.displayName || user?.username}</p>
            <p className="text-xs text-muted-foreground">Yönetici</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
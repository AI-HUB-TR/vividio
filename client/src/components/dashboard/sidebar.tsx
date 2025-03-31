import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Home,
  Video,
  LayoutGrid,
  Settings,
  Users,
  CreditCard
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  current: boolean;
}

function SidebarLink({ href, icon, children, current }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a
        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md 
          ${current
            ? "bg-primary-900 text-white"
            : "text-gray-300 hover:bg-primary-800 hover:text-white"
          }`}
      >
        {icon}
        {children}
      </a>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === "admin";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Video Oluştur", href: "/dashboard/create", icon: <Video className="h-5 w-5" /> },
    { name: "Videolarım", href: "/dashboard/videos", icon: <LayoutGrid className="h-5 w-5" /> },
    { name: "Hesap Ayarları", href: "/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  const adminNavigation = [
    { name: "Yönetim Paneli", href: "/admin", icon: <LayoutGrid className="h-5 w-5" /> },
    { name: "Kullanıcılar", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { name: "Videolar", href: "/admin/videos", icon: <Video className="h-5 w-5" /> },
    { name: "Abonelikler", href: "/admin/subscriptions", icon: <CreditCard className="h-5 w-5" /> },
  ];

  return (
    <div className="flex-shrink-0 w-64 bg-primary-800">
      <div className="h-full flex flex-col">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-900">
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
                className="h-8 w-8 text-white mr-2"
              >
                <path d="m4 8 2-2m0 0 2-2M6 6 4 4m2 2 2 2" />
                <rect width="12" height="12" x="8" y="8" rx="2" />
                <path d="m15 13-2 2-1-1" />
              </svg>
              <span className="font-display font-bold text-xl text-white">VidAI</span>
            </a>
          </Link>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <SidebarLink
                key={item.name}
                href={item.href}
                icon={item.icon}
                current={location === item.href}
              >
                {item.name}
              </SidebarLink>
            ))}

            {isAdmin && (
              <>
                <div className="pt-6">
                  <div className="px-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Yönetici Menüsü
                    </h3>
                  </div>
                  <div className="mt-3 space-y-1">
                    {adminNavigation.map((item) => (
                      <SidebarLink
                        key={item.name}
                        href={item.href}
                        icon={item.icon}
                        current={location === item.href}
                      >
                        {item.name}
                      </SidebarLink>
                    ))}
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

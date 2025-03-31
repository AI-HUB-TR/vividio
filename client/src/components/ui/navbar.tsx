import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import { 
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import LoginModal from "@/components/auth/login-modal";
import RegisterModal from "@/components/auth/register-modal";
import { Menu } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary-600 mr-2"
                >
                  <path d="m4 8 2-2m0 0 2-2M6 6 4 4m2 2 2 2" />
                  <rect width="12" height="12" x="8" y="8" rx="2" />
                  <path d="m15 13-2 2-1-1" />
                </svg>
                <span className="font-display font-bold text-xl text-primary-600">VidAI</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <Link href="/">
                <a className={`px-3 py-2 text-sm font-medium ${location === "/" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
                  Ana Sayfa
                </a>
              </Link>
              <Link href="/features">
                <a className={`px-3 py-2 text-sm font-medium ${location === "/features" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
                  Özellikler
                </a>
              </Link>
              <Link href="/pricing">
                <a className={`px-3 py-2 text-sm font-medium ${location === "/pricing" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
                  Fiyatlandırma
                </a>
              </Link>
              <Link href="/faq">
                <a className={`px-3 py-2 text-sm font-medium ${location === "/faq" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
                  SSS
                </a>
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <a className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700">
                    Dashboard
                  </a>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <a className="ml-4 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md shadow-sm hover:bg-gray-900">
                      Yönetim Paneli
                    </a>
                  </Link>
                )}
                <Button 
                  variant="outline" 
                  className="ml-4"
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  Giriş Yap
                </Button>
                <Button 
                  className="ml-4" 
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  Kaydol
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile menu */}
          <div className="flex items-center sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="p-2">
                  <span className="sr-only">Menüyü aç</span>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-6">
                  <Link href="/">
                    <a className={`px-3 py-2 text-sm font-medium ${location === "/" ? "text-primary-600" : "text-gray-500"}`}>
                      Ana Sayfa
                    </a>
                  </Link>
                  <Link href="/features">
                    <a className={`px-3 py-2 text-sm font-medium ${location === "/features" ? "text-primary-600" : "text-gray-500"}`}>
                      Özellikler
                    </a>
                  </Link>
                  <Link href="/pricing">
                    <a className={`px-3 py-2 text-sm font-medium ${location === "/pricing" ? "text-primary-600" : "text-gray-500"}`}>
                      Fiyatlandırma
                    </a>
                  </Link>
                  <Link href="/faq">
                    <a className={`px-3 py-2 text-sm font-medium ${location === "/faq" ? "text-primary-600" : "text-gray-500"}`}>
                      SSS
                    </a>
                  </Link>
                  
                  <div className="border-t my-4"></div>
                  
                  {isAuthenticated ? (
                    <>
                      <Link href="/dashboard">
                        <a className="px-3 py-2 text-sm font-medium text-primary-600">
                          Dashboard
                        </a>
                      </Link>
                      {user?.role === "admin" && (
                        <Link href="/admin">
                          <a className="px-3 py-2 text-sm font-medium text-gray-800">
                            Yönetim Paneli
                          </a>
                        </Link>
                      )}
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={handleLogout}
                      >
                        Çıkış Yap
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsLoginModalOpen(true)}
                      >
                        Giriş Yap
                      </Button>
                      <Button 
                        className="w-full" 
                        onClick={() => setIsRegisterModalOpen(true)}
                      >
                        Kaydol
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onRegisterClick={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onLoginClick={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </nav>
  );
}

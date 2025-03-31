import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, Link } from "wouter";
import { RootState } from "@/store/store";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MoreVertical,
  Shield,
  User as UserIcon,
  Ban,
  AlertCircle,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function AdminUsers() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Fetch all users
  const { 
    data: users, 
    isLoading: usersLoading, 
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin
  });

  // Handle changing user role
  const handleChangeRole = async (role: string) => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const res = await apiRequest("PUT", `/api/admin/users/${selectedUser.id}/role`, { role });
      const data = await res.json();
      
      toast({
        title: "Başarılı",
        description: data.message,
      });
      
      // Refetch users to update the list
      refetchUsers();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı rolü güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  // Handle banning user
  const handleBanUser = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const res = await apiRequest("POST", `/api/admin/users/${selectedUser.id}/ban`, {});
      const data = await res.json();
      
      toast({
        title: "Başarılı",
        description: data.message,
      });
      
      // Refetch users to update the list
      refetchUsers();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı yasaklanırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsBanDialogOpen(false);
      setSelectedUser(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users 
    ? (users as User[]).filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <h1 className="text-3xl font-display font-bold text-gray-900">Kullanıcı Yönetimi</h1>
            <p className="text-gray-500">Tüm kullanıcıları görüntüleyin ve yönetin.</p>
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
            <CardTitle>Kullanıcılar</CardTitle>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                className="pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500 border-r-2 border-b-2 border-gray-200 mx-auto mb-4"></div>
                <p className="text-gray-500">Kullanıcılar yükleniyor...</p>
              </div>
            ) : usersError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">Kullanıcılar yüklenirken bir hata oluştu</p>
                <Button variant="outline" onClick={() => refetchUsers()}>Yeniden Dene</Button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10">
                <UserIcon className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? "Aramanızla eşleşen kullanıcı bulunamadı" : "Henüz kullanıcı yok"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Giriş Yöntemi</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 overflow-hidden">
                            {user.profileImageUrl ? (
                              <img 
                                src={user.profileImageUrl} 
                                alt={user.username} 
                                className="h-8 w-8 object-cover"
                              />
                            ) : (
                              <UserIcon className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName || user.username}</div>
                            <div className="text-xs text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === "admin" 
                            ? "bg-primary-100 text-primary-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.role === "admin" ? "Yönetici" : "Kullanıcı"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.authProvider ? (
                          <span className="capitalize">{user.authProvider}</span>
                        ) : (
                          "Email/Şifre"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), "dd MMM yyyy", { locale: tr })}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              <span>Rol Değiştir</span>
                            </DropdownMenuItem>
                            {user.role !== "admin" && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsBanDialogOpen(true);
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                <span>Yasakla</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Rolünü Değiştir</DialogTitle>
            <DialogDescription>
              {selectedUser && `${selectedUser.displayName || selectedUser.username} kullanıcısının rolünü değiştir.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button
              variant={selectedUser?.role === "admin" ? "default" : "outline"}
              className="justify-start"
              onClick={() => handleChangeRole("admin")}
              disabled={isProcessing}
            >
              <Shield className="mr-2 h-4 w-4" />
              Yönetici
            </Button>
            <Button
              variant={selectedUser?.role === "user" ? "default" : "outline"}
              className="justify-start"
              onClick={() => handleChangeRole("user")}
              disabled={isProcessing}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Kullanıcı
            </Button>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isProcessing}
            >
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Yasakla</DialogTitle>
            <DialogDescription>
              {selectedUser && `${selectedUser.displayName || selectedUser.username} kullanıcısını yasaklamak istediğinize emin misiniz? Bu işlem kullanıcının aboneliğini iptal edecek ve platformu kullanmasını engelleyecektir.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBanDialogOpen(false)}
              disabled={isProcessing}
            >
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBanUser}
              disabled={isProcessing}
            >
              {isProcessing ? "İşleniyor..." : "Yasakla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

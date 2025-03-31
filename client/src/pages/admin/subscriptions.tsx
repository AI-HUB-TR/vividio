import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, Link } from "wouter";
import { RootState } from "@/store/store";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SubscriptionPlan, Subscription, User } from "@shared/schema";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CreditCard,
  UserCog,
  XCircle,
  AlertCircle,
  Search,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Interface for subscription with user information
interface SubscriptionWithUser extends Subscription {
  user?: User;
  plan?: SubscriptionPlan;
}

export default function AdminSubscriptions() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithUser | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false);
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

  // Fetch all users (for user details)
  const { 
    data: users,
  } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin
  });

  // Fetch all subscription plans
  const { 
    data: plans,
  } = useQuery({
    queryKey: ["/api/subscription-plans"],
  });

  // Simulate fetching all subscriptions
  // In a real app this would be an actual API endpoint
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState<any>(null);

  // Fetch subscriptions (simulated)
  useEffect(() => {
    if (!isAdmin || !users || !plans) return;

    const fetchSubscriptions = async () => {
      setSubscriptionsLoading(true);
      setSubscriptionsError(null);
      
      try {
        // In a real app, this would be an API call
        // For this demo, we'll generate subscriptions based on users
        const allUsers = users as User[];
        const allPlans = plans as SubscriptionPlan[];
        
        // Create subscriptions for each user
        const subs: SubscriptionWithUser[] = allUsers.map((user, index) => {
          // Assign a random plan to each user
          const planIndex = index % allPlans.length;
          const plan = allPlans[planIndex];
          
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
          
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
          
          return {
            id: index + 1,
            userId: user.id,
            planId: plan.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            active: true,
            user,
            plan
          };
        });
        
        setSubscriptions(subs);
      } catch (error) {
        setSubscriptionsError(error);
        console.error("Error fetching subscriptions:", error);
      } finally {
        setSubscriptionsLoading(false);
      }
    };
    
    fetchSubscriptions();
  }, [isAdmin, users, plans]);

  // Handle canceling subscription
  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    setIsProcessing(true);
    try {
      // In a real app, this would be an API call
      // For this demo, we'll update state directly
      setSubscriptions(prevSubscriptions => 
        prevSubscriptions.map(sub => 
          sub.id === selectedSubscription.id 
            ? { ...sub, active: false } 
            : sub
        )
      );
      
      toast({
        title: "Başarılı",
        description: "Abonelik başarıyla iptal edildi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Abonelik iptal edilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsCancelDialogOpen(false);
      setSelectedSubscription(null);
    }
  };

  // Handle changing subscription plan
  const handleChangePlan = async (planId: number) => {
    if (!selectedSubscription) return;

    setIsProcessing(true);
    try {
      // Find the new plan
      const newPlan = plans && (plans as SubscriptionPlan[]).find(p => p.id === planId);
      
      if (!newPlan) {
        throw new Error("Plan bulunamadı");
      }
      
      // In a real app, this would be an API call
      // For this demo, we'll update state directly
      setSubscriptions(prevSubscriptions => 
        prevSubscriptions.map(sub => 
          sub.id === selectedSubscription.id 
            ? { ...sub, planId, plan: newPlan } 
            : sub
        )
      );
      
      toast({
        title: "Başarılı",
        description: `Abonelik planı başarıyla ${newPlan.name} olarak değiştirildi`,
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Abonelik planı değiştirilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsChangePlanDialogOpen(false);
      setSelectedSubscription(null);
    }
  };

  // Filter subscriptions based on search term
  const filteredSubscriptions = subscriptions.filter(sub => {
    const user = sub.user;
    if (!user) return false;
    
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.plan && sub.plan.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Format date
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: tr });
  };

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
            <h1 className="text-3xl font-display font-bold text-gray-900">Abonelik Yönetimi</h1>
            <p className="text-gray-500">Tüm abonelikleri görüntüleyin ve yönetin.</p>
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
            <CardTitle>Abonelikler</CardTitle>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Abonelik/kullanıcı ara..."
                className="pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {subscriptionsLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500 border-r-2 border-b-2 border-gray-200 mx-auto mb-4"></div>
                <p className="text-gray-500">Abonelikler yükleniyor...</p>
              </div>
            ) : subscriptionsError ? (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">Abonelikler yüklenirken bir hata oluştu</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSubscriptionsLoading(true);
                    // Simulate refetch
                    setTimeout(() => setSubscriptionsLoading(false), 1000);
                  }}
                >
                  Yeniden Dene
                </Button>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-10">
                <CreditCard className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? "Aramanızla eşleşen abonelik bulunamadı" : "Henüz abonelik yok"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Başlangıç Tarihi</TableHead>
                    <TableHead>Bitiş Tarihi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.user && (
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 overflow-hidden">
                              {subscription.user.profileImageUrl ? (
                                <img 
                                  src={subscription.user.profileImageUrl} 
                                  alt={subscription.user.username} 
                                  className="h-8 w-8 object-cover"
                                />
                              ) : (
                                <UserCog className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {subscription.user.displayName || subscription.user.username}
                              </div>
                              <div className="text-xs text-gray-500">{subscription.user.email}</div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {subscription.plan && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            subscription.plan.name === "Business" 
                              ? "bg-gray-800 text-white" 
                              : subscription.plan.name === "Pro" 
                                ? "bg-primary-100 text-primary-800" 
                                : "bg-gray-100 text-gray-800"
                          }`}>
                            {subscription.plan.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(subscription.startDate)}</TableCell>
                      <TableCell>
                        {subscription.endDate ? formatDate(subscription.endDate) : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          subscription.active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {subscription.active ? "Aktif" : "İptal Edildi"}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setIsChangePlanDialogOpen(true);
                              }}
                              disabled={!subscription.active}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              <span>Plan Değiştir</span>
                            </DropdownMenuItem>
                            {subscription.active && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedSubscription(subscription);
                                  setIsCancelDialogOpen(true);
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                <span>İptal Et</span>
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
      
      {/* Cancel Subscription Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aboneliği İptal Et</DialogTitle>
            <DialogDescription>
              {selectedSubscription?.user && `${selectedSubscription.user.displayName || selectedSubscription.user.username} kullanıcısının aboneliğini iptal etmek istediğinize emin misiniz?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isProcessing}
            >
              Vazgeç
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? "İşleniyor..." : "İptal Et"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Plan Dialog */}
      <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonelik Planını Değiştir</DialogTitle>
            <DialogDescription>
              {selectedSubscription?.user && `${selectedSubscription.user.displayName || selectedSubscription.user.username} kullanıcısının abonelik planını değiştirin.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {plans && (plans as SubscriptionPlan[]).map((plan) => (
              <Button
                key={plan.id}
                variant={selectedSubscription?.planId === plan.id ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleChangePlan(plan.id)}
                disabled={isProcessing || selectedSubscription?.planId === plan.id}
              >
                {selectedSubscription?.planId === plan.id && (
                  <Check className="mr-2 h-4 w-4" />
                )}
                <span className="mr-2">{plan.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">{plan.priceMonthly}₺/ay</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsChangePlanDialogOpen(false)}
              disabled={isProcessing}
            >
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

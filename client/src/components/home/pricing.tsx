import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { updateUserSubscription } from "@/store/slices/authSlice";
import { apiRequest } from "@/lib/queryClient";
import RegisterModal from "@/components/auth/register-modal";
import LoginModal from "@/components/auth/login-modal";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: number;
  name: string;
  price: number;
  popular?: boolean;
  features: PlanFeature[];
  buttonText: string;
  buttonVariant: "default" | "outline" | "secondary";
}

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { isAuthenticated, user, plan } = useSelector((state: RootState) => state.auth);

  const plans: PricingPlan[] = [
    {
      id: 1,
      name: "Ücretsiz",
      price: 0,
      features: [
        { text: "Günlük 2 video", included: true },
        { text: "1 dakika süre limiti", included: true },
        { text: "720p çözünürlük", included: true },
        { text: "Filigran var", included: true },
        { text: "Özel AI model seçimi", included: false }
      ],
      buttonText: "Ücretsiz Başla",
      buttonVariant: "outline"
    },
    {
      id: 2,
      name: "Pro",
      price: 99,
      popular: true,
      features: [
        { text: "Günlük 10 video", included: true },
        { text: "3 dakika süre limiti", included: true },
        { text: "1080p çözünürlük", included: true },
        { text: "Filigran kaldırılabilir", included: true },
        { text: "Özel AI model seçimi", included: true }
      ],
      buttonText: "Pro'ya Geç",
      buttonVariant: "default"
    },
    {
      id: 3,
      name: "Business",
      price: 299,
      features: [
        { text: "Günlük 50 video", included: true },
        { text: "5 dakika süre limiti", included: true },
        { text: "4K çözünürlük", included: true },
        { text: "Filigran yok", included: true },
        { text: "Özel AI model seçimi", included: true },
        { text: "Öncelikli destek", included: true }
      ],
      buttonText: "Business'a Geç",
      buttonVariant: "secondary"
    }
  ];

  const handleSubscribe = async (planId: number) => {
    // If not logged in, open login modal
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    // Don't do anything if this is already the user's plan
    if (plan && plan.id === planId) {
      toast({
        title: "Bilgi",
        description: "Zaten bu abonelik planını kullanıyorsunuz.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/user/subscription/upgrade", { planId });
      const data = await res.json();

      // Update the subscription in Redux
      dispatch(updateUserSubscription({
        subscription: data.subscription,
        plan: data.plan
      }));

      toast({
        title: "Başarılı",
        description: data.message,
      });
    } catch (error) {
      console.error("Subscription upgrade error:", error);
      toast({
        title: "Hata",
        description: "Abonelik yükseltme işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold tracking-wider text-primary-600 uppercase">
            FİYATLANDIRMA
          </h2>
          <p className="mt-2 text-3xl font-display font-bold text-gray-900 sm:text-4xl">
            İhtiyacınıza uygun plan seçin
          </p>
          <p className="mt-5 max-w-prose mx-auto text-xl text-gray-500">
            Her bütçeye uygun, esnek fiyatlandırma seçenekleri.
          </p>
        </div>
        
        <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative p-8 bg-white border ${plan.popular ? 'border-primary-200' : 'border-gray-200'} rounded-2xl shadow-sm flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 transform translate-y-px">
                  <div className="flex justify-center transform -translate-y-1/2">
                    <span className="inline-flex rounded-full bg-primary-600 px-4 py-1 text-sm font-semibold tracking-wider text-white">
                      En Popüler
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-xl font-display font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-display font-bold tracking-tight">{plan.price}₺</span>
                  <span className="ml-1 text-xl font-medium">/ay</span>
                </p>
                <p className="mt-6 text-gray-500">
                  {plan.name === "Ücretsiz" ? "Başlangıç için mükemmel seçenek." : 
                   plan.name === "Pro" ? "Düzenli içerik üretenler için." :
                   "Profesyonel içerik üreticileri için."}
                </p>
                
                <ul role="list" className="mt-6 space-y-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex">
                      <Check className={`flex-shrink-0 w-6 h-6 ${feature.included ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className={`ml-3 ${feature.included ? 'text-gray-500' : 'text-gray-300'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button 
                variant={plan.buttonVariant as any}
                className={`mt-8 w-full ${plan.buttonVariant === "secondary" ? "bg-gray-800 hover:bg-gray-900" : ""}`}
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading || (isAuthenticated && plan?.id === plan.id)}
              >
                {isLoading ? "İşleniyor..." : plan.buttonText}
              </Button>
            </div>
          ))}
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
    </div>
  );
}

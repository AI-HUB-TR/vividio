import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import RegisterModal from "@/components/auth/register-modal";

export default function Hero() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Geçersiz e-posta",
        description: "Lütfen geçerli bir e-posta adresi girin.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Open register modal with email prefilled (would be handled in a real app)
    setIsRegisterModalOpen(true);
    setIsLoading(false);
  };
  
  return (
    <div className="pt-10 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
      <div className="mx-auto max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
            <div className="lg:py-24">
              <h1 className="mt-4 text-4xl tracking-tight font-display font-bold text-gray-900 sm:mt-5 sm:text-5xl lg:mt-6">
                <span className="block">Metninizi</span>
                <span className="block text-primary-600">1 Dakikada Videoya Dönüştürün!</span>
              </h1>
              
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg">
                VidAI ile metinlerinizi hızlıca profesyonel videolara dönüştürün. YouTube, TikTok, Instagram ve daha fazlası için içerik üretin.
              </p>
              
              <div className="mt-8 sm:mt-12">
                <form onSubmit={handleSubmit} className="sm:max-w-xl sm:mx-auto lg:mx-0">
                  <div className="sm:flex">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="email" className="sr-only">Email adresi</label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Email adresiniz" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        disabled={isLoading}
                      />
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Gönderiliyor..." : "Ücretsiz Deneyin"}
                      </Button>
                    </div>
                  </div>
                </form>
                
                <div className="mt-3 text-sm text-gray-500">
                  Kredi kartı gerekmez. Şimdi kaydolun ve hemen kullanmaya başlayın.
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 -mb-16 sm:-mb-48 lg:m-0 lg:relative">
            <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
              <svg
                className="w-full lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                viewBox="0 0 800 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Video editor interface SVG */}
                <rect width="800" height="600" rx="10" fill="#f8fafc" />
                
                {/* App header */}
                <rect width="800" height="60" fill="#2563eb" />
                <rect x="20" y="20" width="120" height="20" rx="4" fill="white" opacity="0.8" />
                <circle cx="760" cy="30" r="15" fill="white" opacity="0.8" />
                
                {/* Sidebar */}
                <rect width="200" height="540" y="60" fill="#f1f5f9" />
                <rect x="20" y="80" width="160" height="40" rx="4" fill="white" />
                <rect x="20" y="130" width="160" height="40" rx="4" fill="white" />
                <rect x="20" y="180" width="160" height="40" rx="4" fill="white" />
                <rect x="20" y="230" width="160" height="40" rx="4" fill="white" />
                
                {/* Main content */}
                <rect x="220" y="80" width="560" height="320" rx="4" fill="#e2e8f0" />
                <rect x="240" y="100" width="520" height="280" rx="4" fill="#3b82f6" opacity="0.7" />
                <rect x="360" y="190" width="280" height="100" rx="50" fill="white" opacity="0.5" />
                <polygon points="380,190 480,240 380,290" fill="white" />
                
                {/* Controls */}
                <rect x="220" y="420" width="560" height="80" rx="4" fill="white" />
                <rect x="240" y="440" width="400" height="10" rx="2" fill="#cbd5e1" />
                <rect x="240" y="440" width="150" height="10" rx="2" fill="#3b82f6" />
                <circle cx="390" cy="445" r="8" fill="#3b82f6" />
                <rect x="240" y="470" width="40" height="20" rx="4" fill="#3b82f6" />
                <rect x="290" y="470" width="40" height="20" rx="4" fill="#3b82f6" />
                <rect x="340" y="470" width="40" height="20" rx="4" fill="#3b82f6" />
                <rect x="700" y="430" width="60" height="60" rx="30" fill="#3b82f6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onLoginClick={() => setIsRegisterModalOpen(false)} 
      />
    </div>
  );
}

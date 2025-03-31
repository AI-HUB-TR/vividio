import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function DashboardPreview() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="relative py-16 bg-background overflow-hidden">
      <div className="relative">
        <div className="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:grid-flow-col-dense lg:gap-24">
          <div className="px-4 max-w-xl mx-auto sm:px-6 lg:py-16 lg:max-w-none lg:mx-0 lg:px-0">
            <div>
              <div>
                <span className="h-12 w-12 rounded-md flex items-center justify-center bg-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
                  Kullanıcı Dostu Yönetim Paneli
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  VidAI yönetim paneli ile tüm içeriklerinizi kolaylıkla yönetin. Video analizleri, kullanıcı yönetimi ve abonelik bilgileriniz tek bir yerde.
                </p>
                <div className="mt-6">
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button>
                        Paneli Görüntüle
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/">
                      <Button>
                        Giriş Yap ve Başla
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 sm:mt-16 lg:mt-0">
            <div className="pl-4 -mr-48 sm:pl-6 md:-mr-16 lg:px-0 lg:m-0 lg:relative lg:h-full">
              <svg
                className="w-full rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 lg:absolute lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                viewBox="0 0 800 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Dashboard interface SVG */}
                <rect width="800" height="600" rx="8" fill="#1c1c1c" />
                
                {/* Top navbar */}
                <rect width="800" height="64" fill="#6a11cb" />
                <rect x="24" y="20" width="120" height="24" rx="4" fill="white" opacity="0.9" />
                <circle cx="760" cy="32" r="16" fill="white" opacity="0.9" />
                
                {/* Sidebar */}
                <rect y="64" width="220" height="536" fill="#2a2a2a" />
                <rect x="16" y="96" width="188" height="40" rx="4" fill="#333333" />
                <rect x="24" y="108" width="24" height="16" rx="2" fill="#94a3b8" />
                <rect x="56" y="108" width="100" height="16" rx="2" fill="#e2e8f0" />
                
                {/* Content area with cards */}
                <rect x="240" y="84" width="540" height="48" rx="4" fill="#2a2a2a" />
                <rect x="256" y="96" width="240" height="24" rx="2" fill="#e2e8f0" />
                
                {/* Stats cards */}
                <rect x="240" y="148" width="172" height="120" rx="8" fill="#2a2a2a" />
                <rect x="256" y="164" width="88" height="16" rx="2" fill="#94a3b8" />
                <rect x="256" y="192" width="56" height="32" rx="2" fill="#6a11cb" />
                <rect x="256" y="234" width="120" height="16" rx="2" fill="#666666" />
                
                <rect x="428" y="148" width="172" height="120" rx="8" fill="#2a2a2a" />
                <rect x="444" y="164" width="88" height="16" rx="2" fill="#94a3b8" />
                <rect x="444" y="192" width="56" height="32" rx="2" fill="#10b981" />
                <rect x="444" y="234" width="120" height="16" rx="2" fill="#666666" />
                
                <rect x="616" y="148" width="172" height="120" rx="8" fill="#2a2a2a" />
                <rect x="632" y="164" width="88" height="16" rx="2" fill="#94a3b8" />
                <rect x="632" y="192" width="56" height="32" rx="2" fill="#f97316" />
                <rect x="632" y="234" width="120" height="16" rx="2" fill="#666666" />
                
                {/* Video preview area */}
                <rect x="240" y="284" width="340" height="280" rx="8" fill="#2a2a2a" />
                <rect x="256" y="300" width="160" height="16" rx="2" fill="#e2e8f0" />
                <rect x="256" y="328" width="308" height="160" rx="4" fill="#6a11cb" opacity="0.7" />
                <polygon points="350,380 400,408 350,436" fill="white" />
                <rect x="256" y="500" width="240" height="16" rx="2" fill="#94a3b8" />
                <rect x="256" y="528" width="120" height="16" rx="2" fill="#666666" />
                
                {/* Recent videos list */}
                <rect x="596" y="284" width="184" height="280" rx="8" fill="#2a2a2a" />
                <rect x="612" y="300" width="120" height="16" rx="2" fill="#e2e8f0" />
                <rect x="612" y="328" width="152" height="72" rx="4" fill="#333333" />
                <rect x="624" y="340" width="80" height="12" rx="2" fill="#94a3b8" />
                <rect x="624" y="360" width="128" height="8" rx="2" fill="#666666" />
                <rect x="624" y="376" width="60" height="8" rx="2" fill="#666666" />
                
                <rect x="612" y="412" width="152" height="72" rx="4" fill="#333333" />
                <rect x="624" y="424" width="80" height="12" rx="2" fill="#94a3b8" />
                <rect x="624" y="444" width="128" height="8" rx="2" fill="#666666" />
                <rect x="624" y="460" width="60" height="8" rx="2" fill="#666666" />
                
                <rect x="612" y="496" width="152" height="56" rx="4" fill="#333333" />
                <rect x="624" y="508" width="80" height="12" rx="2" fill="#94a3b8" />
                <rect x="624" y="528" width="128" height="8" rx="2" fill="#666666" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

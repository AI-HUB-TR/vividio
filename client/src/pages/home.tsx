import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Hero from "@/components/home/hero";
import Features from "@/components/home/features";
import HowItWorks from "@/components/home/how-it-works";
import Pricing from "@/components/home/pricing";
import DashboardPreview from "@/components/home/dashboard-preview";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <DashboardPreview />
      </main>
      <Footer />
    </div>
  );
}

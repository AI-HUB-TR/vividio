import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Hero from "@/components/home/hero";
import Features from "@/components/home/features";
import HowItWorks from "@/components/home/how-it-works";
import DashboardPreview from "@/components/home/dashboard-preview";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <HowItWorks />
        <DashboardPreview />
      </main>
      <Footer />
    </div>
  );
}

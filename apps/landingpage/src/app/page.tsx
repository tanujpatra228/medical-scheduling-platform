import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Architecture } from "@/components/Architecture";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background selection:bg-primary/30 selection:text-white pb-0">
      <Hero />
      <Features />
      <Architecture />
      <Footer />
    </main>
  );
}

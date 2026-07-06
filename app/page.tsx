import Navbar from "@/components/shared/navbar";
import { HeroSection } from "@/components/shared/hero-section";
import { SocialProofBar } from "@/components/shared/social-proof-bar";
import { FeaturesGrid } from "@/components/shared/features-grid";
import { HowItWorks } from "@/components/shared/how-it-works";
import { PricingPreview } from "@/components/shared/pricing-preview";
import { TestimonialsSection } from "@/components/shared/testimonials-section";
import { NepalSection } from "@/components/shared/nepal-section";
import Footer from "@/components/shared/footer";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <FeaturesGrid />
      <HowItWorks />
      <PricingPreview />
      <TestimonialsSection />
      <NepalSection />
      <Footer />
    </main>
  );
}

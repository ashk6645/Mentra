import { HeroSection } from '@/components/landing/hero-section'
import { SocialProof } from '@/components/landing/social-proof'
import { ProblemSection } from '@/components/landing/problem-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { FeatureShowcase } from '@/components/landing/feature-showcase'
import { DifferentiationSection } from '@/components/landing/differentiation-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { FinalCTA } from '@/components/landing/final-cta'
import { LandingFooter } from '@/components/landing/landing-footer'

export const dynamic = 'force-dynamic'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAFAF9] to-white">
      <HeroSection />
      <SocialProof />
      <ProblemSection />
      <HowItWorksSection />
      <FeatureShowcase />
      <DifferentiationSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTA />
      <LandingFooter />
    </main>
  )
}

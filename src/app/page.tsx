import {
  Navbar,
  Hero,
  Introduction,
  Features,
  WhySeedor,
  HighlightedFeatures,
  CTA,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Introduction />
      <Features />
      <WhySeedor />
      <HighlightedFeatures />
      <CTA />
      <Footer />
    </main>
  );
}

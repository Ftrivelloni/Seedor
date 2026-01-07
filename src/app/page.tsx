import {
  Navbar,
  Hero,
  Features,
  Stats,
  Benefits,
  CTA,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F1F1F1]">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Benefits />
      <CTA />
      <Footer />
    </main>
  );
}

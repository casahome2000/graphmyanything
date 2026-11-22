import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { DemoChart } from "@/components/DemoChart";
import { CodeSnippet } from "@/components/CodeSnippet";
import { TokenComparison } from "@/components/TokenComparison";
import { UseCases } from "@/components/UseCases";
import { Tools } from "@/components/Tools";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <DemoChart />
        <CodeSnippet />
        <TokenComparison />
        <UseCases />
        <Tools />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
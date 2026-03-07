import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NeedSection from "@/components/NeedSection";
import PillarsSection from "@/components/PillarsSection";
import ChildrenStruggleSection from "@/components/ChildrenStruggleSection";
import SecuritySection from "@/components/SecuritySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <PillarsSection />
        <NeedSection />
        <ChildrenStruggleSection />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

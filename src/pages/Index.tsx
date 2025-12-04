import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import WhyChoose from "@/components/WhyChoose";
import Services from "@/components/Services";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <WhyChoose />
        <Services />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

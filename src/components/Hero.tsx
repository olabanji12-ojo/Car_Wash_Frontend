import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useNavigate, Link } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section
      className="w-full py-24 md:py-32 px-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBg})` }}
      data-aos="fade-in"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/75 backdrop-blur-sm" />
      <div className="container mx-auto text-center relative z-10 max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6" data-aos="fade-down">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Your Car Deserves the Best</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight" data-aos="fade-up" data-aos-delay="100">
          Experience the Joy of a
          <br />
          <span className="text-primary bg-clip-text">Spotlessly Clean Car</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" data-aos="fade-up" data-aos-delay="200">
          Stop wasting weekends at the car wash. Book premium detailing services in seconds and get back to what matters—while we make your car shine like new.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" data-aos="fade-up" data-aos-delay="300">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-7 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            onClick={() => navigate("/dashboard")}
          >
            <Search className="mr-2 h-5 w-5" />
            Find Your Perfect Wash
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-10 py-7 transition-all duration-300"
            onClick={() => navigate("/dashboard")}
          >
            Book Home Service
          </Button>
        </div>

        <p className="mt-10 text-muted-foreground" data-aos="fade-up" data-aos-delay="400">
          <span className="text-sm">Own a car wash business?</span>{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
            Grow your revenue with us
            <span className="text-xs">→</span>
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Hero;

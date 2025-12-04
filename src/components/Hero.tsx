import { Button } from "@/components/ui/button";
import { Search, Home } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
// import { Link } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate()
  return (
    <section
      className="w-full py-20 px-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="container mx-auto text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          Book Your Perfect Car Wash
          <br />
          <span className="text-primary">Anytime</span>
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Button
            size="lg"
            className="bg-hero-gradient hover:opacity-90 text-primary-foreground text-lg px-8 py-6"
            onClick={() => navigate("/dashboard")}
          >
            <Search className="mr-2 h-5 w-5" />
            Find a Carwash
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-6"
            onClick={() => navigate("/dashboard")}
          >
            <Home className="mr-2 h-5 w-5" />
            Book Home Service
          </Button>
        </div>

        <p className="mt-8 text-muted-foreground">
          Are you a carwash business?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            Join our platform
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Hero;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Home, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Services = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full py-20 bg-gradient-to-b from-section-bg to-background" id="services">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Choose Your Experience
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you prefer visiting a location or having us come to you, we've got you covered
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-primary/20" data-aos="fade-right">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">Visit a Location</CardTitle>
              <p className="text-muted-foreground">
                Discover top-rated car washes in your neighborhood
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Browse verified locations with real customer reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Compare prices and services at a glance</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Instant booking confirmation—no phone calls needed</span>
                </li>
              </ul>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6 shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/dashboard")}
              >
                Find Nearby Locations
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-accent/20" data-aos="fade-left">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mb-4 shadow-lg">
                <Home className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">Mobile Service</CardTitle>
              <p className="text-muted-foreground">
                Premium car care delivered to your doorstep
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Professional detailing at your home or office</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Eco-friendly waterless options available</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Same-day service for those last-minute needs</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full border-2 border-accent text-accent hover:bg-accent hover:text-white text-lg py-6 shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/dashboard")}
              >
                Book Mobile Service
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Services;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Home } from "lucide-react";

const Services = () => {
  return (
    <section className="w-full py-16 bg-section-bg" id="services">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
          Our Services
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">Visit a Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Discover and book car wash slots at top-rated facilities near you. 
                Choose from various services, compare prices, and read reviews.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Find carwashes near you</li>
                <li>✓ Instant booking confirmation</li>
                <li>✓ Detailed facility information</li>
              </ul>
              <Button className="w-full bg-hero-gradient hover:opacity-90 mt-4">
                Browse Carwashes
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl mb-2">We Come to You</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Experience ultimate convenience with our mobile carwash service. 
                Book professionals to clean your car right at your home or workplace.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Eco-friendly options available</li>
                <li>✓ Professional mobile service</li>
                <li>✓ Same-day availability</li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-4"
              >
                Book Home Service
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Services;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import flexibleBooking from "@/assets/flexible-booking.jpg";
import trustedVerified from "@/assets/trusted-verified.jpg";
import realTime from "@/assets/real-time.jpg";
import homeService from "@/assets/home-service.jpg";

const WhyChoose = () => {
  const features = [
    {
      image: flexibleBooking,
      title: "Flexible Booking",
      description: "Schedule at your convenience, with options for same-day or future appointments",
    },
    {
      image: trustedVerified,
      title: "Trusted & Verified",
      description: "Access a network of highly-rated reviews and quality service",
    },
    {
      image: realTime,
      title: "Real-Time Availability",
      description: "See live slot availability and book instantly, avoiding wait times and last-minute hassle",
    },
    {
      image: homeService,
      title: "Home Service Network",
      description: "Enjoy premium car wash services brought directly to your home or office",
    },
  ];

  return (
    <section className="w-full py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
          Why Choose Carwash App?
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="shadow-card hover:shadow-card-hover transition-all hover:scale-105 border-border overflow-hidden"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;

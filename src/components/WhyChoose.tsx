import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import flexibleBooking from "@/assets/flexible-booking.jpg";
import trustedVerified from "@/assets/trusted-verified.jpg";
import realTime from "@/assets/real-time.jpg";
import homeService from "@/assets/home-service.jpg";

const WhyChoose = () => {
  const features = [
    {
      image: flexibleBooking,
      title: "Book on Your Schedule",
      description: "Same-day or plan ahead—your car wash fits your life, not the other way around",
    },
    {
      image: trustedVerified,
      title: "Verified Excellence",
      description: "Every business is vetted and rated by real customers, so you always know what to expect",
    },
    {
      image: realTime,
      title: "Zero Wait Times",
      description: "See live availability and book instantly—no more calling around or waiting in line",
    },
    {
      image: homeService,
      title: "We Come to You",
      description: "Premium detailing at your home or office—because your time is valuable",
    },
  ];

  return (
    <section className="w-full py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Why Thousands Choose Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're not just another booking platform—we're your partner in keeping your car pristine
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-border overflow-hidden group"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, Sparkles, Building2, TrendingUp, LineChart } from "lucide-react";

const HowItWorks = () => {
  return (
    <section className="w-full py-16 bg-section-bg" id="about">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
          How It Works
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* For Car Owners */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-primary">
              Get Your Car Sparkling Clean
            </h3>
            <div className="space-y-6">
              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">Choose Your Service</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Browse top-rated carwashes by location or book a home service
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">Select Date & Time</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Check real-time availability and book instantly
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">Relax & Enjoy</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Your car gets sparkling clean while you relax
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* For Businesses */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-accent">
              Grow Your Carwash Business
            </h3>
            <div className="space-y-6">
              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">List Your Business</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Reach thousands of potential customers seeking car wash services
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">Manage Bookings</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Streamlined tools for scheduling, payments, and client communication
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">Increase Revenue</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Expand your customer base and boost your earnings
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

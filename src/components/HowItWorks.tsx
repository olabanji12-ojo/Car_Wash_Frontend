import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, Sparkles, Building2, TrendingUp, Zap } from "lucide-react";

const HowItWorks = () => {
  return (
    <section className="w-full py-20 bg-gradient-to-b from-background to-section-bg" id="how-it-works">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Simple. Fast. Effortless.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're a busy professional or a growing business, we've made car care incredibly easy
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* For Car Owners */}
          <div data-aos="fade-right">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">For Car Owners</span>
            </div>
            <h3 className="text-3xl font-bold mb-8 text-foreground">
              Your Car, Sparkling Clean in 3 Steps
            </h3>
            <div className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">1. Find Your Perfect Match</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Browse verified car washes near you or request a mobile service at your doorstep
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">2. Book in Seconds</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Choose your time slot, select services, and confirm—all in under 60 seconds
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">3. Enjoy the Results</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Sit back while professionals make your car look showroom-ready
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* For Businesses */}
          <div data-aos="fade-left">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">For Businesses</span>
            </div>
            <h3 className="text-3xl font-bold mb-8 text-foreground">
              Grow Your Revenue, Effortlessly
            </h3>
            <div className="space-y-6">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-accent">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">1. Get Discovered</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Reach thousands of customers actively searching for car wash services in your area
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-accent">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">2. Manage with Ease</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Streamline bookings, payments, and customer communication from one powerful dashboard
                        </p>
                      </CardContent>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-accent">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">3. Watch Revenue Grow</CardTitle>
                      <CardContent className="p-0">
                        <p className="text-sm text-muted-foreground">
                          Fill empty slots, reduce no-shows, and maximize your earning potential
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

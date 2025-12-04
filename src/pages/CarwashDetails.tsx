import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BookingSidebar from "@/components/BookingSidebar";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Clock,
  Share2,
  Heart,
  CheckCircle2
} from "lucide-react";
import CarwashService, { Carwash } from "@/Contexts/CarwashService";
import ReviewService, { Review } from "@/Contexts/ReviewService";
import { toast } from "sonner";
import { AddReviewDialog } from "@/components/AddReviewDialog";

const CarwashDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [carwash, setCarwash] = useState<Carwash | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCarwashData(id);
      fetchReviews(id);
    }
  }, [id]);

  const fetchCarwashData = async (carwashId: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching carwash data for ID:', carwashId);
      const response = await CarwashService.getCarwashById(carwashId) as any;
      console.log('✅ Carwash data:', response);
      // Backend returns { success: true, data: {...} }
      const carwashData = response.data || response;
      setCarwash(carwashData);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to fetch carwash:', err);
      setError("Failed to load carwash details");
      toast.error("Failed to load carwash details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async (carwashId: string) => {
    try {
      console.log('🔍 Fetching reviews for carwash:', carwashId);
      const data = await ReviewService.getReviewsByBusinessId(carwashId) as any;
      console.log('✅ Reviews data:', data);
      // Backend returns { success: true, data: [...] } or { success: true, data: null }
      const reviewsData = data?.data || data;
      const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
      setReviews(reviewsArray);
    } catch (err) {
      console.error('❌ Failed to fetch reviews:', err);
      // Don't show error toast for reviews, just log it
      setReviews([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading carwash details...</p>
        </div>
      </div>
    );
  }

  if (error || !carwash) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Carwash Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || "This carwash doesn't exist"}</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Calculate starting price from services if available
  const startingPrice = carwash.services && carwash.services.length > 0
    ? Math.min(...carwash.services.map(s => s.price || 0))
    : 0;

  // Use carwash photos or fallback images
  const images = carwash.photos && carwash.photos.length > 0
    ? carwash.photos
    : [
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop"
    ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Image Gallery */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-4">
          <div className="relative aspect-video md:aspect-[21/9] rounded-lg overflow-hidden">
            <img
              src={images[selectedImage]}
              alt={carwash.name}
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-4 left-4">
              {carwash.is_open ? "Open Now" : "Closed"}
            </Badge>
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              {images.slice(0, 4).map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? "border-primary" : "border-transparent"
                    }`}
                >
                  <img
                    src={image}
                    alt={`View ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{carwash.name}</h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{carwash.average_rating || 0}</span>
                  <span className="text-sm">({reviews.length} reviews)</span>
                </div>

                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {carwash.is_open ? "Open Now" : "Closed"}
                </Badge>
              </div>

              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{carwash.address || 'Address not available'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  <a href={`tel:${carwash.phone}`} className="hover:text-primary">
                    {carwash.phone}
                  </a>
                </div>
              </div>
            </div>

            <Separator />

            {/* About Us */}
            {carwash.about && (
              <div>
                <h2 className="text-2xl font-bold mb-4">About Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {carwash.about}
                </p>

                {carwash.features && carwash.features.length > 0 && (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {carwash.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {carwash.about && <Separator />}

            {/* Our Services */}
            {carwash.services && carwash.services.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mb-6">Our Services</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {carwash.services.map((service: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {service.description}
                        </p>
                        <div className="text-2xl font-bold text-primary mb-4">
                          ₦{service.price.toLocaleString()}
                        </div>
                        {service.features && service.features.length > 0 && (
                          <ul className="space-y-2">
                            {service.features.map((feature: string, idx: number) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Phone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Services Listed Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    This carwash is still adding their service menu. Call them directly to learn about available services and pricing.
                  </p>
                  {carwash.phone && (
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = `tel:${carwash.phone}`}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call {carwash.phone}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Add-ons & Extras */}
            {carwash.addons && carwash.addons.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Add-ons & Extras</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {carwash.addons.map((addon: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold">{addon.name}</h3>
                          <div className="text-xl font-bold text-primary">
                            ₦{addon.price.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{addon.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {carwash.addons && carwash.addons.length > 0 && <Separator />}

            {/* Opening Hours */}
            {carwash.operating_hours && carwash.operating_hours.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Opening Hours</h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {carwash.operating_hours.map((schedule: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <span className="font-medium">{schedule.day}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{schedule.hours}</span>
                            {schedule.status === "closed" ? (
                              <Badge variant="destructive">Closed</Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Open
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {carwash.operating_hours && carwash.operating_hours.length > 0 && <Separator />}

            {/* Location */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Location</h2>
              <div className="flex items-start gap-2 text-muted-foreground mb-4">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{carwash.address || 'Address not available'}</span>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=400&fit=crop"
                  alt="Map location"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <Separator />

            {/* Customer Reviews */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Customer Reviews</h2>
                <AddReviewDialog
                  carwashId={id || ""}
                  onReviewAdded={() => {
                    if (id) {
                      fetchReviews(id);
                      fetchCarwashData(id); // Refresh to update average rating
                    }
                  }}
                />
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                              {(review.customer_name || review.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold">{review.customer_name || review.name || 'Anonymous'}</div>
                              <div className="text-sm text-muted-foreground">{review.created_at ? new Date(review.created_at).toLocaleDateString() : (review.date || 'Recently')}</div>
                            </div>
                          </div>
                          {review.verified && (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted"
                                }`}
                            />
                          ))}
                        </div>

                        <p className="text-muted-foreground">{review.comment || 'No comment provided'}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No reviews yet. Be the first to leave a review!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>


          {/* Booking Sidebar */}
          <BookingSidebar
            carwashId={id || "1"}
            startingPrice={startingPrice}
            services={carwash.services || []}
            phone={carwash.phone || ''}
          />
        </div>
      </div>
    </div>
  );
};

export default CarwashDetails;

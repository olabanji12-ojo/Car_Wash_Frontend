import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Clock,
  DollarSign,
  Upload,
  Trash2,
  Plus,
  Pencil,
  Briefcase,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Define TypeScript interface for payoutMethod
interface PayoutMethod {
  type: "bank" | "mobile" | "";
  bankName?: string;
  accountNumber?: string;
  mobileProvider?: string;
  mobileNumber?: string;
}

// Define TypeScript interface for business data
interface BusinessData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  photos: { id: string; url: string }[];
  hours: { day: string; open: string; close: string; closed: boolean }[];
  maxCarsPerSlot: number;
  homeService: boolean;
  deliveryRadiusKM: number;
  basePrice: number;
  services: { id?: string; name: string; price: number; duration: number; description: string }[];
  addons: { name: string; price: number; description?: string }[];
  payoutMethod: PayoutMethod;
  notifications: { email: boolean; sms: boolean; push: boolean };
}

const BusinessProfileSettings = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"business-info" | "hours" | "services-pricing">("business-info");
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    photos: [],
    hours: [],
    maxCarsPerSlot: 1,
    homeService: false,
    deliveryRadiusKM: 10,
    basePrice: 5000,
    services: [],
    addons: [],
    payoutMethod: { type: "", bankName: "", accountNumber: "" },
    notifications: { email: true, sms: false, push: true },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [carwashId, setCarwashId] = useState<string>('');

  // Service CRUD state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  // Addon CRUD state
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any>(null);

  useEffect(() => {
    const fetchCarwashData = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          toast.error("Please log in to view settings");
          navigate('/login');
          return;
        }

        const user = JSON.parse(storedUser);
        if (!user.carwash_id) {
          toast.error("No carwash found for this account");
          setIsLoading(false);
          return;
        }

        setCarwashId(user.carwash_id);
        const { default: CarwashService } = await import('@/Contexts/CarwashService');
        const carwashResponse = await CarwashService.getCarwashById(user.carwash_id);
        const carwashData = (carwashResponse as any).data || carwashResponse;

        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const transformedHours = daysOfWeek.map(day => {
          const dayLower = day.toLowerCase();
          const hourData = carwashData.open_hours?.[dayLower];
          return {
            day,
            open: hourData?.start || '08:00',
            close: hourData?.end || '20:00',
            closed: !hourData || hourData.start === '' || hourData.end === ''
          };
        });

        setBusinessData({
          name: carwashData.name || '',
          description: carwashData.description || '',
          address: carwashData.address || '',
          phone: carwashData.phone || user.phone || '',
          email: user.email || '',
          photos: (carwashData.photo_gallery || []).map((url: string, index: number) => ({ id: `${index}`, url })),
          hours: transformedHours,
          maxCarsPerSlot: carwashData.max_cars_per_slot || 1,
          homeService: carwashData.home_service || false,
          deliveryRadiusKM: carwashData.delivery_radius_km || 10,
          basePrice: carwashData.base_price || 5000,
          services: carwashData.services || [],
          addons: carwashData.addons || [],
          payoutMethod: { type: '', bankName: '', accountNumber: '' },
          notifications: { email: true, sms: false, push: true },
        });
      } catch (error) {
        console.error('Failed to fetch carwash data:', error);
        toast.error("Failed to load business settings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarwashData();
  }, [navigate]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { default: CarwashService } = await import('@/Contexts/CarwashService');
      let updateData: any = {};

      const openHoursMap: Record<string, { start: string; end: string }> = {};
      businessData.hours.forEach(h => {
        if (!h.closed) openHoursMap[h.day.toLowerCase()] = { start: h.open, end: h.close };
      });

      updateData = {
        name: businessData.name,
        description: businessData.description,
        address: businessData.address,
        open_hours: openHoursMap,
        max_cars_per_slot: businessData.maxCarsPerSlot,
        home_service: businessData.homeService,
        delivery_radius_km: businessData.homeService ? businessData.deliveryRadiusKM : 0,
        base_price: Number(businessData.basePrice),
        services: businessData.services,
        addons: businessData.addons,
      };

      if (photos.length > 0) {
        await CarwashService.uploadCarwashPhotos(carwashId, photos);
        setPhotos([]);
      }

      await CarwashService.updateCarwash(carwashId, updateData);
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(f => f.size <= 5 * 1024 * 1024 && ["image/jpeg", "image/png"].includes(f.type));
      if (validFiles.length + businessData.photos.length + photos.length > 5) {
        toast.error("Maximum 5 photos allowed");
        return;
      }
      setPhotos([...photos, ...validFiles]);
    }
  };

  const handleDeletePhoto = async (id: string | number) => {
    try {
      if (typeof id === 'string') {
        const photoToDelete = businessData.photos.find(p => p.id === id);
        if (photoToDelete) {
          const { default: CarwashService } = await import('@/Contexts/CarwashService');
          await CarwashService.deleteCarwashPhoto(carwashId, photoToDelete.url);
          setBusinessData({ ...businessData, photos: businessData.photos.filter(p => p.id !== id) });
        }
      } else {
        setPhotos(photos.filter((_, index) => index !== id));
      }
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 font-outfit max-w-7xl">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground uppercase">Business Settings</h1>
              <p className="text-xs sm:text-base text-muted-foreground font-medium italic">Manage your profile, hours, and service menu</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto h-11 sm:h-12 rounded-full px-8 font-black bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm uppercase tracking-wider"
            >
              {isSaving ? "SAVING..." : "SAVE ALL CHANGES"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Vertical Navigation Stack */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="border-none rounded-[2rem] shadow-card ring-1 ring-border/5 overflow-hidden">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-sm font-black text-muted-foreground tracking-widest uppercase">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {[
                    { id: "business-info", label: "BUSINESS IDENTITY", icon: User, color: "text-blue-600", bg: "bg-blue-50" },
                    { id: "hours", label: "OPERATING HOURS", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
                    { id: "services-pricing", label: "MENU & PRICING", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
                        activeTab === tab.id
                          ? "bg-primary text-white shadow-md shadow-primary/20 translate-x-1"
                          : "hover:bg-muted/50 text-foreground/70"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                        activeTab === tab.id ? "bg-white/20" : tab.bg
                      )}>
                        <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-white" : tab.color)} />
                      </div>
                      <span className="font-black text-sm tracking-tight">{tab.label}</span>
                      {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Tips/Info Card */}
              <Card className="border-none rounded-[2rem] shadow-card ring-1 ring-border/5 bg-primary/5 hidden lg:block">
                <CardContent className="p-6 space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tight">Need Help?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Make sure your business information is accurate to help customers find and trust your car wash service.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Business Identity Section */}
              <section id="business-info" className="scroll-mt-24">
                <Card className="border-none rounded-[2rem] shadow-card ring-1 ring-border/5 overflow-hidden">
                  <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-primary/[0.02]">
                    <CardTitle className="text-xl sm:text-2xl font-black text-primary tracking-tight uppercase flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <span>Business Identity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Business Name</Label>
                        <Input id="name" className="h-12 rounded-xl" value={businessData.name} onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                        <Textarea id="description" className="rounded-xl min-h-[120px]" value={businessData.description} onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Public Address</Label>
                        <Input id="address" className="h-12 rounded-xl" value={businessData.address} onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                          <Input id="phone" className="h-12 rounded-xl" value={businessData.phone} onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxCarsPerSlot" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Capacity (Cars/Slot)</Label>
                          <Input id="maxCarsPerSlot" type="number" className="h-12 rounded-xl" value={businessData.maxCarsPerSlot} onChange={(e) => setBusinessData({ ...businessData, maxCarsPerSlot: parseInt(e.target.value) || 0 })} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-dashed">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Brand Assets</Label>
                      <input type="file" accept="image/*" multiple className="hidden" id="photo-upload" onChange={handlePhotoUpload} />
                      <label htmlFor="photo-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:bg-muted/30 transition-all group">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <span className="font-bold text-sm">Tap to upload photos</span>
                        <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB (Max 5)</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {businessData.photos.map(p => (
                          <div key={p.id} className="relative aspect-square group overflow-hidden rounded-2xl shadow-sm">
                            <img src={p.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="ghost" size="icon" className="text-white hover:text-red-400" onClick={() => handleDeletePhoto(p.id)}><Trash2 className="h-5 w-5" /></Button>
                            </div>
                          </div>
                        ))}
                        {photos.map((p, i) => (
                          <div key={i} className="relative aspect-square group overflow-hidden rounded-2xl shadow-sm border-2 border-primary/20">
                            <img src={URL.createObjectURL(p)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="ghost" size="icon" className="text-white hover:text-red-400" onClick={() => handleDeletePhoto(i)}><Trash2 className="h-5 w-5" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-dashed space-y-4">
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="space-y-1">
                          <Label className="font-black text-sm text-primary uppercase tracking-tight">Home Service Availability</Label>
                          <p className="text-xs text-muted-foreground leading-relaxed">Let customers book you to come to their location</p>
                        </div>
                        <Switch
                          checked={businessData.homeService}
                          onCheckedChange={(checked) => setBusinessData({ ...businessData, homeService: checked })}
                        />
                      </div>

                      {businessData.homeService && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                          <div className="space-y-2">
                            <Label htmlFor="deliveryRadius" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Service Radius (Kilometers)</Label>
                            <div className="relative">
                              <Input
                                id="deliveryRadius"
                                type="number"
                                className="h-12 rounded-xl pr-12 font-bold"
                                value={businessData.deliveryRadiusKM}
                                onChange={(e) => setBusinessData({ ...businessData, deliveryRadiusKM: parseInt(e.target.value) || 0 })}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-xs">KM</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Operating Hours Section */}
              <section id="hours" className="scroll-mt-24">
                <Card className="border-none rounded-[2rem] shadow-card ring-1 ring-border/5 overflow-hidden">
                  <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-orange-50/30">
                    <CardTitle className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight uppercase flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Clock className="h-6 w-6" />
                      </div>
                      <span>Availability Hours</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                    {businessData.hours.map((dayHour, index) => (
                      <div key={dayHour.day} className={cn(
                        "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl transition-all",
                        dayHour.closed ? "bg-muted/30 border border-transparent" : "bg-white border border-border shadow-sm"
                      )}>
                        <div className="flex items-center justify-between w-full sm:w-32">
                          <span className="font-black text-sm tracking-tight">{dayHour.day.toUpperCase()}</span>
                          <div className="sm:hidden">
                            <Switch
                              checked={!dayHour.closed}
                              onCheckedChange={(checked) => {
                                const newHours = [...businessData.hours];
                                newHours[index].closed = !checked;
                                setBusinessData({ ...businessData, hours: newHours });
                              }}
                            />
                          </div>
                        </div>

                        <div className="hidden sm:block">
                          <Switch
                            checked={!dayHour.closed}
                            onCheckedChange={(checked) => {
                              const newHours = [...businessData.hours];
                              newHours[index].closed = !checked;
                              setBusinessData({ ...businessData, hours: newHours });
                            }}
                          />
                        </div>

                        {!dayHour.closed ? (
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Select
                              value={dayHour.open}
                              onValueChange={(value) => {
                                const newHours = [...businessData.hours];
                                newHours[index].open = value;
                                setBusinessData({ ...businessData, hours: newHours });
                              }}
                            >
                              <SelectTrigger className="h-10 rounded-lg w-full sm:w-28 font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>;
                                })}
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground font-black text-[10px] tracking-widest">TO</span>
                            <Select
                              value={dayHour.close}
                              onValueChange={(value) => {
                                const newHours = [...businessData.hours];
                                newHours[index].close = value;
                                setBusinessData({ ...businessData, hours: newHours });
                              }}
                            >
                              <SelectTrigger className="h-10 rounded-lg w-full sm:w-28 font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>;
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="h-10 flex items-center px-4 bg-muted rounded-lg w-full sm:w-64 border border-dashed border-border/50">
                            <span className="text-xs font-black text-muted-foreground tracking-widest uppercase">Closed / Not Available</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* Menu & Pricing Section */}
              <section id="services-pricing" className="scroll-mt-24">
                <Card className="border-none rounded-[2rem] shadow-card ring-1 ring-border/5 overflow-hidden">
                  <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-green-50/30">
                    <CardTitle className="text-xl sm:text-2xl font-black text-green-600 tracking-tight uppercase flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <span>Service Menu & Rates</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-8">
                    {/* Base Price Card */}
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 space-y-4">
                      <div className="flex items-center gap-3 text-primary">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <h3 className="font-black text-lg tracking-tight uppercase">Base Station Price</h3>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Starting price for standard reservations at your location.</p>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-[200px]">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xl">₦</span>
                          <Input
                            type="number"
                            className="pl-10 h-14 font-black text-2xl rounded-2xl border-none shadow-sm ring-1 ring-primary/10"
                            value={businessData.basePrice}
                            onChange={(e) => setBusinessData({ ...businessData, basePrice: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] tracking-widest px-4 py-2 rounded-full uppercase">Standard Rate</Badge>
                      </div>
                    </div>

                    {/* Services List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Custom Packages</h3>
                        <Button
                          size="sm"
                          className="h-10 rounded-full font-black text-xs gap-2 shadow-lg shadow-primary/10"
                          onClick={() => {
                            setEditingService({ name: "", description: "", price: 0, duration: 30 });
                            setIsServiceModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" /> ADD PACKAGE
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {businessData.services.length > 0 ? (
                          businessData.services.map((service, index) => (
                            <div key={index} className="flex items-center justify-between p-5 rounded-2xl border bg-card/50 hover:bg-white hover:shadow-md transition-all group">
                              <div className="space-y-1 pr-4 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-base truncate">{service.name}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">{service.duration} MIN</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                                <p className="text-sm font-black text-primary tracking-tight">₦{service.price.toLocaleString()}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary"
                                  onClick={() => {
                                    setEditingService({ ...service, index });
                                    setIsServiceModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-500"
                                  onClick={() => {
                                    const newServices = [...businessData.services];
                                    newServices.splice(index, 1);
                                    setBusinessData({ ...businessData, services: newServices });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 border-2 border-dashed rounded-[2rem] bg-muted/20">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No custom packages yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add-ons List */}
                    <div className="space-y-4 pt-4 border-t border-dashed">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Upgrades & Add-ons</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 rounded-full font-black text-xs gap-2 border-2"
                          onClick={() => {
                            setEditingAddon({ name: "", description: "", price: 0 });
                            setIsAddonModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" /> NEW UPGRADE
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {businessData.addons.length > 0 ? (
                          businessData.addons.map((addon, index) => (
                            <div key={index} className="p-4 rounded-2xl border bg-card/50 flex flex-col gap-3">
                              <div className="space-y-1">
                                <div className="font-black text-sm truncate">{addon.name}</div>
                                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">{addon.description}</p>
                                <p className="font-black text-purple-600 text-sm">₦{addon.price.toLocaleString()}</p>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-dashed">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                  onClick={() => {
                                    setEditingAddon({ ...addon, index });
                                    setIsAddonModalOpen(true);
                                  }}
                                >
                                  EDIT
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50"
                                  onClick={() => {
                                    const newAddons = [...businessData.addons];
                                    newAddons.splice(index, 1);
                                    setBusinessData({ ...businessData, addons: newAddons });
                                  }}
                                >
                                  REMOVE
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-8 bg-muted/10 rounded-2xl border border-dashed border-border/50">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No add-ons configured</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Final Save Action for ease of use */}
                    <div className="pt-8 border-t border-dashed">
                      <Button
                        className="w-full h-14 rounded-full font-black bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? "SAVING CHANGES..." : "CONFIRM ALL SETTINGS"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Service Modal */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">{editingService?.index !== undefined ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Service Name</Label>
              <Input
                className="h-12 rounded-xl"
                placeholder="e.g. Executive Full Wash"
                value={editingService?.name || ""}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea
                className="rounded-xl min-h-[100px]"
                placeholder="What does this service include?"
                value={editingService?.description || ""}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price (₦)</Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl"
                  value={editingService?.price || 0}
                  onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Duration (mins)</Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl"
                  value={editingService?.duration || 30}
                  onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsServiceModalOpen(false)}>Cancel</Button>
            <Button className="rounded-full font-black px-6" onClick={() => {
              const newServices = [...businessData.services];
              if (editingService.index !== undefined) {
                const { index, ...data } = editingService;
                newServices[index] = data;
              } else {
                newServices.push(editingService);
              }
              setBusinessData({ ...businessData, services: newServices });
              setIsServiceModalOpen(false);
            }}>Save Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Addon Modal */}
      <Dialog open={isAddonModalOpen} onOpenChange={setIsAddonModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">{editingAddon?.index !== undefined ? "Edit Add-on" : "Add New Add-on"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Add-on Name</Label>
              <Input
                className="h-12 rounded-xl"
                placeholder="e.g. Engine Steam Cleaning"
                value={editingAddon?.name || ""}
                onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea
                className="rounded-xl min-h-[80px]"
                placeholder="Brief details about the add-on"
                value={editingAddon?.description || ""}
                onChange={(e) => setEditingAddon({ ...editingAddon, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price (₦)</Label>
              <Input
                type="number"
                className="h-12 rounded-xl"
                value={editingAddon?.price || 0}
                onChange={(e) => setEditingAddon({ ...editingAddon, price: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsAddonModalOpen(false)}>Cancel</Button>
            <Button className="rounded-full font-black px-6" onClick={() => {
              const newAddons = [...businessData.addons];
              if (editingAddon.index !== undefined) {
                const { index, ...data } = editingAddon;
                newAddons[index] = data;
              } else {
                newAddons.push(editingAddon);
              }
              setBusinessData({ ...businessData, addons: newAddons });
              setIsAddonModalOpen(false);
            }}>Save Add-on</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BusinessProfileSettings;
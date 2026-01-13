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

      if (activeTab === "business-info") {
        updateData = {
          name: businessData.name,
          description: businessData.description,
          address: businessData.address,
          open_hours: openHoursMap,
          max_cars_per_slot: businessData.maxCarsPerSlot,
          home_service: businessData.homeService,
          delivery_radius_km: businessData.homeService ? businessData.deliveryRadiusKM : 0,
        };
        if (photos.length > 0) {
          await CarwashService.uploadCarwashPhotos(carwashId, photos);
          setPhotos([]);
        }
      } else if (activeTab === "hours") {
        updateData = { open_hours: openHoursMap };
      } else if (activeTab === "services-pricing") {
        updateData = {
          base_price: Number(businessData.basePrice),
          services: businessData.services,
          addons: businessData.addons,
        };
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
      <div className="container mx-auto px-4 py-8 font-outfit max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-8">
          {/* Header & Mobile-First Navigation */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase truncate">Settings</h1>
                <p className="text-sm md:text-lg text-muted-foreground font-medium italic">Fine-tune your business presence</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto h-12 rounded-full px-8 font-black bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                {isSaving ? "SAVING..." : "SAVE ALL CHANGES"}
              </Button>
            </div>

            {/* Premium Scrollable Tabs */}
            <div className="bg-card/50 p-2 rounded-[2rem] border border-border/50 shadow-sm overflow-hidden ring-1 ring-border/5">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 touch-pan-x">
                {[
                  { id: "business-info", label: "BUSINESS INFO", icon: User },
                  { id: "hours", label: "OPERATING HOURS", icon: Clock },
                  { id: "services-pricing", label: "SERVICES & PRICING", icon: DollarSign },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={cn(
                      "whitespace-nowrap flex-shrink-0 rounded-full h-12 px-8 font-black transition-all",
                      activeTab === tab.id ? "shadow-lg shadow-primary/20" : "text-muted-foreground"
                    )}
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full max-w-5xl mx-auto">
            <Card className="border-none rounded-[2.5rem] shadow-card ring-1 ring-border/5 overflow-hidden">
              <CardHeader className="p-6 sm:p-8 border-b border-border/50 bg-primary/[0.02]">
                <CardTitle className="text-xl sm:text-2xl font-black text-primary tracking-tight uppercase flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {activeTab === "business-info" && <User className="h-6 w-6" />}
                    {activeTab === "hours" && <Clock className="h-6 w-6" />}
                    {activeTab === "services-pricing" && <DollarSign className="h-6 w-6" />}
                  </div>
                  <span className="truncate">
                    {activeTab === "business-info" && "Business Identity"}
                    {activeTab === "hours" && "Times of Operation"}
                    {activeTab === "services-pricing" && "Menu & Pricing"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 space-y-10">
                {activeTab === "services-pricing" && (
                  <div className="space-y-6">
                    {/* Base Price Section */}
                    <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/20 space-y-4 group transition-all hover:bg-primary/10">
                      <div className="flex items-center gap-3 text-primary">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <h3 className="font-black text-lg tracking-tight">BASE STATION PRICE</h3>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium pl-1">This is the starting cost for customers who reserve a slot at your station.</p>
                      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 flex-wrap">
                        <div className="relative w-full xs:max-w-[200px]">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xl">₦</span>
                          <Input
                            type="number"
                            className="pl-10 h-14 font-black text-2xl rounded-2xl border-2 border-primary/10 focus-visible:ring-primary shadow-inner"
                            value={businessData.basePrice}
                            onChange={(e) => setBusinessData({ ...businessData, basePrice: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <Badge variant="outline" className="h-12 px-4 sm:px-6 rounded-full flex items-center bg-white font-black text-primary shadow-sm border-primary/10 tracking-widest uppercase whitespace-normal text-center leading-tight">
                          Premium Standard
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Services Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          <h3 className="font-bold text-lg">Main Services</h3>
                        </div>
                        <Button
                          size="sm"
                          className="gap-2 rounded-full"
                          onClick={() => {
                            setEditingService({ name: "", description: "", price: 0, duration: 30 });
                            setIsServiceModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" /> Add Service
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        {businessData.services.length > 0 ? (
                          businessData.services.map((service, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors gap-4">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="font-bold flex items-center gap-2 flex-wrap">
                                  <span className="truncate">{service.name}</span>
                                  <Badge variant="secondary" className="text-[10px] h-5 whitespace-nowrap">{service.duration} mins</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                                <p className="text-sm font-black text-primary">₦{service.price.toLocaleString()}</p>
                              </div>
                              <div className="flex gap-2 self-start sm:self-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
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
                                  className="text-red-500"
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
                          <div className="text-center py-6 border-2 border-dashed rounded-xl text-muted-foreground">
                            No services added yet. Click "Add Service" to start.
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Add-ons Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-5 w-5 text-purple-600" />
                          <h3 className="font-bold text-lg">Add-ons</h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-full"
                          onClick={() => {
                            setEditingAddon({ name: "", description: "", price: 0 });
                            setIsAddonModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" /> Add Add-on
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {businessData.addons.length > 0 ? (
                          businessData.addons.map((addon, index) => (
                            <div key={index} className="p-4 border rounded-xl hover:bg-muted/30 transition-colors flex flex-col justify-between gap-3 min-w-0">
                              <div className="space-y-1 min-w-0">
                                <div className="font-bold truncate">{addon.name}</div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{addon.description}</p>
                                <p className="text-sm font-black text-purple-600">₦{addon.price.toLocaleString()}</p>
                              </div>
                              <div className="flex justify-end gap-2 border-t pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => {
                                    setEditingAddon({ ...addon, index });
                                    setIsAddonModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-red-500"
                                  onClick={() => {
                                    const newAddons = [...businessData.addons];
                                    newAddons.splice(index, 1);
                                    setBusinessData({ ...businessData, addons: newAddons });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-6 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
                            No add-ons managed yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "business-info" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Business Name</Label>
                      <Input id="name" value={businessData.name} onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={businessData.description} onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })} rows={4} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={businessData.address} onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={businessData.phone} onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Photos</Label>
                      <input type="file" accept="image/*" multiple className="hidden" id="photo-upload" onChange={handlePhotoUpload} />
                      <label htmlFor="photo-upload" className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 inline-flex gap-2"><Upload className="h-4 w-4" />Upload Photos</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {businessData.photos.map(p => (
                          <div key={p.id} className="relative">
                            <img src={p.url} className="w-full h-32 object-cover rounded-md" />
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-red-500" onClick={() => handleDeletePhoto(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                        {photos.map((p, i) => (
                          <div key={i} className="relative">
                            <img src={URL.createObjectURL(p)} className="w-full h-32 object-cover rounded-md" />
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-red-500" onClick={() => handleDeletePhoto(i)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxCarsPerSlot">Max Cars Per Slot</Label>
                      <Input id="maxCarsPerSlot" type="number" value={businessData.maxCarsPerSlot} onChange={(e) => setBusinessData({ ...businessData, maxCarsPerSlot: parseInt(e.target.value) || 0 })} />
                    </div>

                    <div className="pt-4 border-t space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold text-blue-900">Offer Home Service</Label>
                          <p className="text-xs text-blue-700">Workers travel to client locations</p>
                        </div>
                        <Switch
                          checked={businessData.homeService}
                          onCheckedChange={(checked) => setBusinessData({ ...businessData, homeService: checked })}
                        />
                      </div>

                      {businessData.homeService && (
                        <div className="space-y-2">
                          <Label htmlFor="deliveryRadius">Delivery Radius (KM)</Label>
                          <Input
                            id="deliveryRadius"
                            type="number"
                            value={businessData.deliveryRadiusKM}
                            onChange={(e) => setBusinessData({ ...businessData, deliveryRadiusKM: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">Maximum travel distance from your base station</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "hours" && (
                  <div className="space-y-4">
                    {businessData.hours.map((dayHour, index) => (
                      <div key={dayHour.day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between w-full sm:w-24">
                          <div className="font-medium">{dayHour.day}</div>
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

                        {!dayHour.closed && (
                          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto py-1">
                            <Select
                              value={dayHour.open}
                              onValueChange={(value) => {
                                const newHours = [...businessData.hours];
                                newHours[index].open = value;
                                setBusinessData({ ...businessData, hours: newHours });
                              }}
                            >
                              <SelectTrigger className="w-full sm:w-32 min-w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return <SelectItem key={hour} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>;
                                })}
                              </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">to</span>
                            <Select
                              value={dayHour.close}
                              onValueChange={(value) => {
                                const newHours = [...businessData.hours];
                                newHours[index].close = value;
                                setBusinessData({ ...businessData, hours: newHours });
                              }}
                            >
                              <SelectTrigger className="w-full sm:w-32 min-w-[100px]">
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
                        )}
                        {dayHour.closed && <span className="text-muted-foreground text-sm">Closed</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Always show save button */}
                <div className="pt-6 border-t">
                  <Button
                    className="w-full sm:w-auto min-w-[150px]"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Saving...
                      </>
                    ) : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Service Modal */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingService?.index !== undefined ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                placeholder="e.g. Executive Full Wash"
                value={editingService?.name || ""}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this service include?"
                value={editingService?.description || ""}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₦)</Label>
                <Input
                  type="number"
                  value={editingService?.price || 0}
                  onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (mins)</Label>
                <Input
                  type="number"
                  value={editingService?.duration || 30}
                  onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
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
        <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAddon?.index !== undefined ? "Edit Add-on" : "Add New Add-on"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Add-on Name</Label>
              <Input
                placeholder="e.g. Engine Steam Cleaning"
                value={editingAddon?.name || ""}
                onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief details about the add-on"
                value={editingAddon?.description || ""}
                onChange={(e) => setEditingAddon({ ...editingAddon, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₦)</Label>
              <Input
                type="number"
                value={editingAddon?.price || 0}
                onChange={(e) => setEditingAddon({ ...editingAddon, price: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddonModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
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
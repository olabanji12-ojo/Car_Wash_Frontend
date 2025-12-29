import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Car,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  X,
  Save
} from "lucide-react";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  color: string;
  isDefault: boolean;
}

const carMakes = [
  "Toyota", "Honda", "Mercedes-Benz", "BMW", "Audi", "Lexus",
  "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia", "Mazda",
  "Volkswagen", "Peugeot", "Renault", "Other"
];

const carColors = [
  "Black", "White", "Silver", "Gray", "Red", "Blue",
  "Green", "Brown", "Gold", "Orange", "Yellow", "Purple"
];

import CarService, { CarResponse } from "@/Contexts/CarService";

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<CarResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<CarResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  // Form state
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [color, setColor] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);

  // Generate years (current year down to 30 years ago)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 31 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const data = await CarService.getMyCars();
      // ✅ FIX: Ensure data is an array
      const vehiclesArray = Array.isArray(data) ? data : [];
      setVehicles(vehiclesArray);
    } catch (error) {
      console.error("Failed to load vehicles", error);
      toast.error("Failed to load vehicles");
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMake("");
    setModel("");
    setYear("");
    setPlateNumber("");
    setColor("");
    setSetAsDefault(false);
    setIsEditing(false);
    setEditingVehicle(null);
  };

  const handleAddVehicle = async () => {
    if (!make || !model || !year || !plateNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const fullModel = `${year} ${make} ${model}`;
      const noteData = JSON.stringify({ year, make, model });

      await CarService.createCar({
        model: fullModel,
        plate: plateNumber.toUpperCase(),
        color,
        is_default: setAsDefault,
        note: noteData
      });

      toast.success("Vehicle added successfully!");
      fetchVehicles();
      resetForm();
    } catch (error) {
      toast.error("Failed to add vehicle");
    }
  };

  const handleEditVehicle = async () => {
    if (!make || !model || !year || !plateNumber || !editingVehicle) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const fullModel = `${year} ${make} ${model}`;
      const noteData = JSON.stringify({ year, make, model });

      await CarService.updateCar(editingVehicle.id, {
        model: fullModel,
        plate: plateNumber.toUpperCase(),
        color,
        is_default: setAsDefault,
        note: noteData
      });

      toast.success("Vehicle updated successfully!");
      fetchVehicles();
      resetForm();
    } catch (error) {
      toast.error("Failed to update vehicle");
    }
  };

  const startEditVehicle = (vehicle: CarResponse) => {
    setIsEditing(true);
    setEditingVehicle(vehicle);
    setPlateNumber(vehicle.plate);
    setColor(vehicle.color || "");
    setSetAsDefault(vehicle.is_default);

    // Try to parse structured data from note
    try {
      if (vehicle.note) {
        const parsed = JSON.parse(vehicle.note);
        setMake(parsed.make || "");
        setYear(parsed.year || "");
        setModel(parsed.model || "");
      } else {
        // Fallback parsing from model string
        // Assumes "Year Make Model"
        const parts = vehicle.model.split(' ');
        if (parts.length >= 3) {
          setYear(parts[0]);
          // This is a guess, might be wrong if make has spaces
          setMake(carMakes.find(m => parts.slice(1).join(' ').includes(m)) || parts[1]);
          // Remaining part is model
          setModel(vehicle.model.replace(`${parts[0]} ${parts[1]}`, '').trim());
        }
      }
    } catch (e) {
      console.error("Failed to parse vehicle details", e);
      setModel(vehicle.model);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    try {
      await CarService.deleteCar(vehicleToDelete);
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
    } catch (error) {
      toast.error("Failed to delete vehicle");
    } finally {
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const confirmDelete = (vehicleId: string) => {
    setVehicleToDelete(vehicleId);
    setDeleteDialogOpen(true);
  };

  const handleSetDefault = async (vehicleId: string) => {
    try {
      await CarService.updateCar(vehicleId, { is_default: true });
      toast.success("Default vehicle updated");
      fetchVehicles();
    } catch (error) {
      toast.error("Failed to set default vehicle");
    }
  };

  const location = useLocation();
  const isInsideDashboard = location.pathname.includes("/dashboard/");

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hide if inside dashboard to avoid double headers */}
      {!isInsideDashboard && (
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
            <h1 className="text-lg font-semibold">My Vehicles</h1>
            <div className="w-20" />
          </div>
        </header>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Vehicle List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Your Vehicles</h2>
                <p className="text-muted-foreground">
                  Manage your saved vehicles for faster bookings
                </p>
              </div>
              {vehicles.length > 0 && (
                <Badge variant="secondary">
                  {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}
                </Badge>
              )}
            </div>

            {/* Empty State */}
            {vehicles.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <Car className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No vehicles added yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Add your first vehicle to speed up your booking process and manage multiple cars easily
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Use the form on the right to add a vehicle</span>
                    <span className="hidden lg:inline">→</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Cards */}
            {vehicles.length > 0 && (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    className={`transition-all hover:shadow-md ${vehicle.is_default ? 'border-l-4 border-l-primary' : ''
                      }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Vehicle Icon */}
                        <div className="rounded-full bg-primary/10 p-3">
                          <Car className="h-6 w-6 text-primary" />
                        </div>

                        {/* Vehicle Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {vehicle.model}
                              </h3>
                              {vehicle.is_default && (
                                <Badge variant="default" className="mt-1">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Default Vehicle
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Plate Number:</span>
                              <p className="text-foreground font-mono mt-0.5">
                                {vehicle.plate}
                              </p>
                            </div>
                            {vehicle.color && (
                              <div>
                                <span className="font-medium">Color:</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div
                                    className="w-4 h-4 rounded-full border-2"
                                    style={{
                                      backgroundColor: vehicle.color.toLowerCase()
                                    }}
                                  />
                                  <span className="text-foreground">{vehicle.color}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditVehicle(vehicle)}
                            title="Edit vehicle"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(vehicle.id)}
                            title="Delete vehicle"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Set as Default Button */}
                      {!vehicle.is_default && (
                        <div className="mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(vehicle.id)}
                            className="w-full sm:w-auto"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Set as Default
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Vehicle Form */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
                  </span>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={resetForm}
                      title="Cancel editing"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Make */}
                <div className="space-y-2">
                  <Label htmlFor="make">
                    Make <span className="text-destructive">*</span>
                  </Label>
                  <Select value={make} onValueChange={setMake}>
                    <SelectTrigger id="make">
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      {carMakes.map((carMake) => (
                        <SelectItem key={carMake} value={carMake}>
                          {carMake}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label htmlFor="model">
                    Model <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="model"
                    placeholder="e.g., Camry, Accord, C-Class"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <Label htmlFor="year">
                    Year <span className="text-destructive">*</span>
                  </Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Plate Number */}
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">
                    Plate Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="plateNumber"
                    placeholder="ABC-123-XY"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your license plate number
                  </p>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label htmlFor="color">Color (Optional)</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger id="color">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {carColors.map((carColor) => (
                        <SelectItem key={carColor} value={carColor}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border-2"
                              style={{ backgroundColor: carColor.toLowerCase() }}
                            />
                            {carColor}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Set as Default Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="default"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={vehicles.length === 0 && !isEditing}
                  />
                  <Label htmlFor="default" className="cursor-pointer">
                    Set as default vehicle
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={isEditing ? handleEditVehicle : handleAddVehicle}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Vehicle
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vehicle
                    </>
                  )}
                </Button>

                {isEditing && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this vehicle
              from your saved vehicles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;
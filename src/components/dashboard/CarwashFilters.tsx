import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const serviceTypes = [
  "Exterior Wash",
  "Interior Detailing",
  "Full Service Wash",
  "Wax & Polish",
  "Engine Bay Cleaning",
];

export const CarwashFilters = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Service Type</h4>
          {serviceTypes.map((service) => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox id={service} />
              <label
                htmlFor={service}
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {service}
              </label>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Price Range</h4>
          <div className="pt-2">
            <Slider defaultValue={[50, 100]} max={200} step={10} />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>$50</span>
              <span>$100</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Rating</h4>
          <Select defaultValue="4.5">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4.5">4.5+</SelectItem>
              <SelectItem value="4.0">4.0+</SelectItem>
              <SelectItem value="3.5">3.5+</SelectItem>
              <SelectItem value="3.0">3.0+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Sorting</h4>
          <Select defaultValue="relevance">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full">Apply Filters</Button>
      </CardContent>
    </Card>
  );
};
